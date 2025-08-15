const JWTService = require('../services/jwtService');
const User = require('../models/User');

/**
 * Socket.IO authentication middleware
 * Validates JWT token from socket handshake and attaches user data
 */
const socketAuth = async (socket, next) => {
  try {
    // Extract token from handshake auth or query
    const token = socket.handshake.auth?.token || 
                  socket.handshake.query?.token ||
                  socket.request.headers?.authorization;

    console.log('Socket auth attempt:', {
      hasToken: !!token,
      tokenSource: token ? (socket.handshake.auth?.token ? 'auth' : 
                           socket.handshake.query?.token ? 'query' : 'headers') : 'none',
      socketId: socket.id
    });

    if (!token) {
      console.log('No token provided for socket:', socket.id);
      return next(new Error('Authentication token required'));
    }

    // Verify the JWT token
    const decoded = JWTService.verifyToken(token);
    console.log('Token decoded successfully for user:', decoded.username);
    
    // Fetch user from database to ensure they still exist
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      console.log('User not found in database:', decoded.userId);
      return next(new Error('User not found'));
    }

    // Attach user data to socket
    socket.user = {
      userId: user._id.toString(),
      username: user.username,
      id: user._id.toString()
    };

    console.log('Socket authenticated successfully:', {
      userId: socket.user.userId,
      username: socket.user.username,
      socketId: socket.id
    });

    next();
  } catch (error) {
    console.error('Socket authentication error:', {
      message: error.message,
      socketId: socket.id,
      hasToken: !!(socket.handshake.auth?.token || socket.handshake.query?.token)
    });
    next(new Error('Authentication failed: ' + error.message));
  }
};

/**
 * Middleware to check if user is authorized to make moves
 */
const authorizeMove = (gameSession, socket) => {
  const userId = socket.user.userId;
  const currentTurn = gameSession.gameState.split(' ')[1]; // Extract turn from FEN
  
  if (currentTurn === 'w') {
    return gameSession.whitePlayer.userId?.toString() === userId;
  } else {
    return gameSession.blackPlayer.userId?.toString() === userId;
  }
};

/**
 * Check if user is a player in the game session
 */
const isPlayer = (gameSession, socket) => {
  const userId = socket.user.userId;
  return gameSession.whitePlayer.userId?.toString() === userId ||
         gameSession.blackPlayer.userId?.toString() === userId;
};

/**
 * Check if user is a spectator in the game session
 */
const isSpectator = (gameSession, socket) => {
  const userId = socket.user.userId;
  return gameSession.spectators.some(spec => spec.userId.toString() === userId);
};

/**
 * Get user role in game session
 */
const getUserRole = (gameSession, socket) => {
  const userId = socket.user.userId;
  
  if (gameSession.whitePlayer.userId?.toString() === userId) {
    return 'white';
  } else if (gameSession.blackPlayer.userId?.toString() === userId) {
    return 'black';
  } else if (gameSession.spectators.some(spec => spec.userId.toString() === userId)) {
    return 'spectator';
  } else {
    return null;
  }
};

module.exports = {
  socketAuth,
  authorizeMove,
  isPlayer,
  isSpectator,
  getUserRole
};