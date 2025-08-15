const express = require("express");
const socketIO = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");
const cors = require("cors");
const compression = require("compression");
const morgan = require("morgan");

// Load configuration and database connection
const config = require("./config/config");
const connectDB = require("./config/database");

// Import routes and middleware
const authRoutes = require("./routes/auth");
const gameSessionRoutes = require("./routes/gameSession");
const { errorHandler, notFound } = require("./middleware/errorHandler");

// Import socket authentication and game session services
const { socketAuth, authorizeMove, getUserRole } = require("./middleware/socketAuth");
const GameSessionService = require("./services/gameSessionService");

// Import production middleware
const logger = require("./config/logger");
const { securityHeaders, apiLimiter, authLimiter } = require("./middleware/security");

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*", // Allow all origins temporarily for debugging
    methods: ["GET", "POST"]
  }
});

// Apply socket authentication middleware
io.use(socketAuth);

// Connect to MongoDB
connectDB();

// Production middleware
if (config.nodeEnv === 'production') {
  app.use(securityHeaders);
  app.use(compression());
  app.use(morgan('combined', { stream: logger.stream }));
} else {
  app.use(morgan('dev'));
}

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = config.nodeEnv === 'development' 
      ? ["http://localhost:3001", "http://localhost:3000"]
      : [
          process.env.CORS_ORIGIN,
          "https://your-vercel-app.vercel.app",
          /\.vercel\.app$/
        ];
    
    // Check if origin matches any allowed origin (including regex patterns)
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes with rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/game-session', apiLimiter, gameSessionRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint to check if server is responding
app.get('/api/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Test endpoint working',
    timestamp: new Date().toISOString()
  });
});

// Serve static files from React build
app.use(express.static(path.join(__dirname, "public")));

// Serve React app for all routes (SPA) - but not API routes
app.get("*", (req, res, next) => {
  // Don't serve React app for API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  // In development, redirect to React dev server
  if (config.nodeEnv === 'development') {
    return res.redirect('http://localhost:3001');
  }
  
  // In production, serve built React app
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Error handling middleware (must be after all routes)
app.use(notFound);
app.use(errorHandler);

io.on("connection", async function (socket) {
  console.log(`Authenticated user connected: ${socket.user.username} (${socket.id})`);

  try {
    // Handle player reconnection with state recovery
    const { session, role, recovered } = await GameSessionService.handlePlayerReconnection(
      socket.user.userId,
      socket.id,
      socket.user.username
    );

    console.log(`User ${socket.user.username} assigned role: ${role} (recovered: ${recovered})`);
    console.log(`Session state after assignment:`, {
      sessionId: session._id,
      status: session.status,
      whitePlayer: session.whitePlayer.username,
      blackPlayer: session.blackPlayer.username
    });

    // Join socket room for this game session
    socket.join(session.gameId);
    socket.gameSessionId = session._id.toString();
    socket.userRole = role;

    // Emit player role and current game state
    if (role === 'white') {
      console.log(`Emitting white role to ${socket.user.username}`);
      socket.emit("playerRole", "w");
    } else if (role === 'black') {
      console.log(`Emitting black role to ${socket.user.username}`);
      socket.emit("playerRole", "b");
    } else {
      console.log(`Emitting spectator role to ${socket.user.username}`);
      socket.emit("spectatorRole");
    }

    // Send current board state and game info to the connecting player
    socket.emit("boardState", session.gameState);
    socket.emit("moveHistory", session.moves);

    // Broadcast updated game session info to ALL players in the room (including the new player)
    const gameSessionInfo = {
      sessionId: session._id,
      gameId: session.gameId,
      status: session.status,
      whitePlayer: session.whitePlayer.username,
      blackPlayer: session.blackPlayer.username,
      spectatorCount: session.spectators.length,
      recovered: recovered
    };
    
    console.log(`Broadcasting game session info to room ${session.gameId}:`, gameSessionInfo);
    io.to(session.gameId).emit("gameSessionInfo", gameSessionInfo);

    // Notify other players in the room about connection/reconnection
    const connectionMessage = recovered ? "playerReconnected" : "playerJoined";
    socket.to(session.gameId).emit(connectionMessage, {
      username: socket.user.username,
      role: role
    });

    // Log connection type
    console.log(`User ${recovered ? 'reconnected' : 'connected'}: ${socket.user.username} as ${role}`);

  } catch (error) {
    console.error("Error handling connection:", error.message);
    socket.emit("connectionError", error.message);
    socket.disconnect();
    return;
  }

  // Handle player disconnection
  socket.on("disconnect", async function () {
    console.log(`User disconnected: ${socket.user.username} (${socket.id})`);
    
    try {
      const session = await GameSessionService.handlePlayerDisconnection(socket.id);
      if (session) {
        // Notify other players in the room about disconnection
        socket.to(session.gameId).emit("playerLeft", {
          username: socket.user.username,
          sessionStatus: session.status
        });
      }
    } catch (error) {
      console.error("Error handling disconnection:", error.message);
    }
  });

  // Handle new game request
  socket.on("newGame", async () => {
    try {
      if (!socket.gameSessionId) {
        socket.emit("error", "No active game session");
        return;
      }

      const session = await GameSessionService.startNewGame(socket.gameSessionId);
      
      // Notify all players in the room
      io.to(session.gameId).emit("boardState", session.gameState);
      io.to(session.gameId).emit("newGameStarted");
      io.to(session.gameId).emit("moveHistory", []);
      
      // Re-emit player roles to ensure they're correct after game reset
      const sockets = await io.in(session.gameId).fetchSockets();
      for (const clientSocket of sockets) {
        if (clientSocket.user) {
          const userId = clientSocket.user.userId;
          let role = null;
          
          if (session.whitePlayer.userId?.toString() === userId) {
            role = 'white';
            clientSocket.emit("playerRole", "w");
            console.log(`Re-emitting WHITE role to ${clientSocket.user.username}`);
          } else if (session.blackPlayer.userId?.toString() === userId) {
            role = 'black';
            clientSocket.emit("playerRole", "b");
            console.log(`Re-emitting BLACK role to ${clientSocket.user.username}`);
          } else {
            clientSocket.emit("spectatorRole");
            console.log(`Re-emitting SPECTATOR role to ${clientSocket.user.username}`);
          }
          
          clientSocket.userRole = role;
        }
      }
      
      console.log(`New game started in session ${session.gameId}`);
    } catch (error) {
      console.error("Error starting new game:", error.message);
      socket.emit("error", error.message);
    }
  });

  // Handle move attempts
  socket.on("move", async (move) => {
    try {
      if (!socket.gameSessionId) {
        socket.emit("moveError", "No active game session");
        return;
      }

      // Verify user is authorized to make moves (not a spectator)
      if (socket.userRole === 'spectator') {
        socket.emit("moveError", "Spectators cannot make moves");
        return;
      }

      const { session, moveResult } = await GameSessionService.makeMove(
        socket.gameSessionId,
        move,
        socket.user.userId
      );

      // Persist game state after move
      await GameSessionService.persistGameState(socket.gameSessionId, {
        gameState: session.gameState,
        moves: session.moves
      });

      // Broadcast move to all players in the room
      io.to(session.gameId).emit("move", move);
      io.to(session.gameId).emit("boardState", session.gameState);
      
      // Update move history for all players
      io.to(session.gameId).emit("moveHistory", session.moves);

      // Emit move details for spectators and players
      io.to(session.gameId).emit("moveDetails", {
        player: socket.userRole,
        username: socket.user.username,
        move: moveResult.san,
        timestamp: new Date()
      });

      // Check for game end conditions
      if (session.status === 'completed') {
        let gameOverMessage = '';
        switch (session.result) {
          case 'white_wins':
            gameOverMessage = `Checkmate! ${session.whitePlayer.username} (White) wins!`;
            break;
          case 'black_wins':
            gameOverMessage = `Checkmate! ${session.blackPlayer.username} (Black) wins!`;
            break;
          case 'draw':
            gameOverMessage = 'Game ended in a draw!';
            break;
          default:
            gameOverMessage = 'Game completed!';
        }

        // Update player statistics
        try {
          const User = require('./models/User');
          
          if (session.whitePlayer.userId && session.blackPlayer.userId) {
            const whitePlayer = await User.findById(session.whitePlayer.userId);
            const blackPlayer = await User.findById(session.blackPlayer.userId);

            if (whitePlayer && blackPlayer) {
              switch (session.result) {
                case 'white_wins':
                  await whitePlayer.updateGameStats('win');
                  await blackPlayer.updateGameStats('loss');
                  break;
                case 'black_wins':
                  await whitePlayer.updateGameStats('loss');
                  await blackPlayer.updateGameStats('win');
                  break;
                case 'draw':
                  await whitePlayer.updateGameStats('draw');
                  await blackPlayer.updateGameStats('draw');
                  break;
              }
              console.log('Player statistics updated');
            }
          }
        } catch (error) {
          console.error('Error updating player statistics:', error);
        }

        io.to(session.gameId).emit("gameOver", {
          message: gameOverMessage,
          result: session.result,
          winner: session.result === 'white_wins' ? session.whitePlayer.username : 
                  session.result === 'black_wins' ? session.blackPlayer.username : null
        });
      }

      console.log(`Move made by ${socket.user.username} (${socket.userRole}): ${moveResult.san}`);
    } catch (error) {
      console.error("Move error:", error.message);
      socket.emit("moveError", error.message);
    }
  });

  // Handle request for current game state
  socket.on("requestGameState", async () => {
    try {
      if (!socket.gameSessionId) {
        socket.emit("error", "No active game session");
        return;
      }

      const session = await GameSessionService.getSessionById(socket.gameSessionId);
      socket.emit("boardState", session.gameState);
      socket.emit("moveHistory", session.moves);
      socket.emit("gameSessionInfo", {
        sessionId: session._id,
        gameId: session.gameId,
        status: session.status,
        whitePlayer: session.whitePlayer.username,
        blackPlayer: session.blackPlayer.username,
        spectatorCount: session.spectators.length
      });
    } catch (error) {
      console.error("Error getting game state:", error.message);
      socket.emit("error", error.message);
    }
  });

  // Handle spectator chat messages
  socket.on("spectatorMessage", async (message) => {
    try {
      if (!socket.gameSessionId) {
        socket.emit("error", "No active game session");
        return;
      }

      // Only allow spectators and players to send messages
      if (!socket.userRole) {
        socket.emit("error", "Not authorized to send messages");
        return;
      }

      const session = await GameSessionService.getSessionById(socket.gameSessionId);
      
      // Broadcast message to all users in the game room
      io.to(session.gameId).emit("spectatorMessage", {
        username: socket.user.username,
        role: socket.userRole,
        message: message,
        timestamp: new Date()
      });

      console.log(`Message from ${socket.user.username} (${socket.userRole}): ${message}`);
    } catch (error) {
      console.error("Error handling spectator message:", error.message);
      socket.emit("error", error.message);
    }
  });

  // Handle request for session statistics
  socket.on("requestSessionStats", async () => {
    try {
      if (!socket.gameSessionId) {
        socket.emit("error", "No active game session");
        return;
      }

      const stats = await GameSessionService.getSessionStatistics(socket.gameSessionId);
      socket.emit("sessionStats", stats);
    } catch (error) {
      console.error("Error getting session stats:", error.message);
      socket.emit("error", error.message);
    }
  });

  // Handle player ready status for game start
  socket.on("playerReady", async () => {
    try {
      if (!socket.gameSessionId) {
        socket.emit("error", "No active game session");
        return;
      }

      // Only players can be ready
      if (socket.userRole === 'spectator') {
        socket.emit("error", "Spectators cannot be ready");
        return;
      }

      const session = await GameSessionService.getSessionById(socket.gameSessionId);
      
      // Notify all users in the room that player is ready
      io.to(session.gameId).emit("playerReady", {
        username: socket.user.username,
        role: socket.userRole
      });

      console.log(`Player ready: ${socket.user.username} (${socket.userRole})`);
    } catch (error) {
      console.error("Error handling player ready:", error.message);
      socket.emit("error", error.message);
    }
  });
});

server.listen(config.port, () => {
  console.log(`Server is listening on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

