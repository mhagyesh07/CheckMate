const GameSession = require('../models/GameSession');
const { Chess } = require('chess.js');

class GameSessionService {
  /**
   * Find or create an active game session
   * @returns {Promise<GameSession>} Active game session
   */
  static async findOrCreateActiveSession() {
    try {
      // Look for an existing session that's waiting or active
      let session = await GameSession.findActiveSession();
      
      if (!session) {
        // Create a new session if none exists
        session = await GameSession.createNewSession();
      }
      
      return session;
    } catch (error) {
      throw new Error(`Failed to find or create session: ${error.message}`);
    }
  }

  /**
   * Assign a player to a game session
   * @param {string} sessionId - Game session ID
   * @param {Object} user - User object with userId, socketId, username
   * @returns {Promise<{session: GameSession, role: string}>} Updated session and assigned role
   */
  static async assignPlayerToSession(sessionId, user) {
    try {
      const session = await GameSession.findById(sessionId);
      
      if (!session) {
        throw new Error('Game session not found');
      }

      const { userId, socketId, username } = user;
      let role = null;

      console.log(`Assigning player ${username} (${userId}) to session. Current state:`, {
        whitePlayer: session.whitePlayer.userId?.toString(),
        blackPlayer: session.blackPlayer.userId?.toString(),
        whitePlayerName: session.whitePlayer.username,
        blackPlayerName: session.blackPlayer.username,
        status: session.status
      });

      // Check if user is already assigned to this session
      if (session.whitePlayer.userId?.toString() === userId) {
        // Update socket ID for existing white player
        session.whitePlayer.socketId = socketId;
        role = 'white';
        console.log(`${username} reconnected as white player`);
      } else if (session.blackPlayer.userId?.toString() === userId) {
        // Update socket ID for existing black player
        session.blackPlayer.socketId = socketId;
        role = 'black';
        console.log(`${username} reconnected as black player`);
      } else if (!session.whitePlayer.userId) {
        // Assign as white player (first player)
        console.log(`Assigning ${username} as WHITE player (first player)`);
        await session.assignWhitePlayer(userId, socketId, username);
        role = 'white';
        console.log(`${username} successfully assigned as white player`);
      } else if (!session.blackPlayer.userId) {
        // Assign as black player (second player)
        console.log(`Assigning ${username} as BLACK player (second player)`);
        await session.assignBlackPlayer(userId, socketId, username);
        role = 'black';
        console.log(`${username} successfully assigned as black player`);
      } else {
        // Both player slots are taken - check if this is a duplicate connection
        const isWhitePlayerDuplicate = session.whitePlayer.userId?.toString() === userId;
        const isBlackPlayerDuplicate = session.blackPlayer.userId?.toString() === userId;
        
        if (isWhitePlayerDuplicate || isBlackPlayerDuplicate) {
          console.warn(`WARNING: Duplicate connection detected for user ${username} (${userId})`);
          console.warn('This usually means the same user is logged in from multiple browsers/tabs');
          
          // Still allow the connection but log the issue
          role = isWhitePlayerDuplicate ? 'white' : 'black';
          if (isWhitePlayerDuplicate) {
            session.whitePlayer.socketId = socketId;
          } else {
            session.blackPlayer.socketId = socketId;
          }
        } else {
          // Assign as spectator
          await session.addSpectator(userId, socketId, username);
          role = 'spectator';
          console.log(`${username} assigned as spectator`);
        }
      }

      await session.save();
      return { session, role };
    } catch (error) {
      throw new Error(`Failed to assign player: ${error.message}`);
    }
  }

  /**
   * Handle player disconnection
   * @param {string} socketId - Socket ID of disconnected player
   * @returns {Promise<GameSession|null>} Updated session or null if not found
   */
  static async handlePlayerDisconnection(socketId) {
    try {
      // Find session containing this socket ID
      const session = await GameSession.findOne({
        $or: [
          { 'whitePlayer.socketId': socketId },
          { 'blackPlayer.socketId': socketId },
          { 'spectators.socketId': socketId }
        ]
      });

      if (session) {
        await session.removePlayer(socketId);
        return session;
      }

      return null;
    } catch (error) {
      throw new Error(`Failed to handle disconnection: ${error.message}`);
    }
  }

  /**
   * Make a move in a game session
   * @param {string} sessionId - Game session ID
   * @param {Object} moveData - Move data with from, to, promotion
   * @param {string} userId - User ID making the move
   * @returns {Promise<{session: GameSession, moveResult: Object}>} Updated session and move result
   */
  static async makeMove(sessionId, moveData, userId) {
    try {
      const session = await GameSession.findById(sessionId);
      
      if (!session) {
        throw new Error('Game session not found');
      }

      // Initialize chess instance with current game state
      const chess = new Chess(session.gameState);
      
      // Verify it's the player's turn
      const currentTurn = chess.turn();
      const isWhiteTurn = currentTurn === 'w';
      const isAuthorized = (isWhiteTurn && session.whitePlayer.userId?.toString() === userId) ||
                          (!isWhiteTurn && session.blackPlayer.userId?.toString() === userId);

      if (!isAuthorized) {
        throw new Error('Not your turn or not authorized to make moves');
      }

      // Attempt the move
      const moveResult = chess.move(moveData);
      
      if (!moveResult) {
        throw new Error('Invalid move');
      }

      // Update session with new game state
      session.gameState = chess.fen();
      
      // Add move to history
      const player = isWhiteTurn ? 'white' : 'black';
      await session.addMove(player, JSON.stringify(moveData), moveResult.san);

      // Check for game end conditions
      if (chess.isCheckmate()) {
        const winner = chess.turn() === 'w' ? 'black_wins' : 'white_wins';
        await session.completeGame(winner);
      } else if (chess.isDraw()) {
        await session.completeGame('draw');
      }

      return { session, moveResult };
    } catch (error) {
      throw new Error(`Failed to make move: ${error.message}`);
    }
  }

  /**
   * Start a new game in existing session
   * @param {string} sessionId - Game session ID
   * @returns {Promise<GameSession>} Reset session
   */
  static async startNewGame(sessionId) {
    try {
      const session = await GameSession.findById(sessionId);
      
      if (!session) {
        throw new Error('Game session not found');
      }

      // Reset game state
      session.gameState = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      session.moves = [];
      session.status = session.whitePlayer.userId && session.blackPlayer.userId ? 'active' : 'waiting';
      session.result = null;
      session.completedAt = null;

      await session.save();
      return session;
    } catch (error) {
      throw new Error(`Failed to start new game: ${error.message}`);
    }
  }

  /**
   * Get session by ID with populated user data
   * @param {string} sessionId - Game session ID
   * @returns {Promise<GameSession>} Game session with populated data
   */
  static async getSessionById(sessionId) {
    try {
      const session = await GameSession.findById(sessionId)
        .populate('whitePlayer.userId', 'username')
        .populate('blackPlayer.userId', 'username')
        .populate('spectators.userId', 'username');
      
      if (!session) {
        throw new Error('Game session not found');
      }

      return session;
    } catch (error) {
      throw new Error(`Failed to get session: ${error.message}`);
    }
  }

  /**
   * Get all active sessions
   * @returns {Promise<GameSession[]>} Array of active sessions
   */
  static async getActiveSessions() {
    try {
      return await GameSession.find({
        status: { $in: ['waiting', 'active'] }
      }).sort({ createdAt: 1 });
    } catch (error) {
      throw new Error(`Failed to get active sessions: ${error.message}`);
    }
  }

  /**
   * Recover user's active game session
   * @param {string} userId - User ID to find active session for
   * @returns {Promise<{session: GameSession, role: string}|null>} User's active session and role or null
   */
  static async recoverUserSession(userId) {
    try {
      // Find active session where user is a player or spectator
      const session = await GameSession.findOne({
        status: { $in: ['waiting', 'active'] },
        $or: [
          { 'whitePlayer.userId': userId },
          { 'blackPlayer.userId': userId },
          { 'spectators.userId': userId }
        ]
      });

      if (!session) {
        return null;
      }

      let role = null;
      if (session.whitePlayer.userId?.toString() === userId) {
        role = 'white';
        console.log(`User ${userId} found as WHITE player in session recovery`);
      } else if (session.blackPlayer.userId?.toString() === userId) {
        role = 'black';
        console.log(`User ${userId} found as BLACK player in session recovery`);
      } else {
        role = 'spectator';
        console.log(`User ${userId} found as SPECTATOR in session recovery`);
      }

      console.log(`Session recovery result: userId=${userId}, role=${role}`);
      return { session, role };
    } catch (error) {
      throw new Error(`Failed to recover user session: ${error.message}`);
    }
  }

  /**
   * Handle player reconnection with state recovery
   * @param {string} userId - User ID reconnecting
   * @param {string} socketId - New socket ID
   * @param {string} username - Username
   * @returns {Promise<{session: GameSession, role: string, recovered: boolean}>} Session info and recovery status
   */
  static async handlePlayerReconnection(userId, socketId, username) {
    try {
      // First try to recover existing session
      const recovery = await this.recoverUserSession(userId);
      
      if (recovery) {
        const { session, role } = recovery;
        
        console.log(`Recovering session for ${username}: role=${role}`);
        
        // Update socket ID for reconnected user
        if (role === 'white') {
          session.whitePlayer.socketId = socketId;
          session.whitePlayer.username = username; // Ensure username is preserved
          console.log(`${username} reconnected as WHITE player`);
        } else if (role === 'black') {
          session.blackPlayer.socketId = socketId;
          session.blackPlayer.username = username; // Ensure username is preserved
          console.log(`${username} reconnected as BLACK player`);
        } else {
          // Update spectator socket ID
          const spectatorIndex = session.spectators.findIndex(
            spec => spec.userId.toString() === userId
          );
          if (spectatorIndex !== -1) {
            session.spectators[spectatorIndex].socketId = socketId;
            session.spectators[spectatorIndex].username = username;
          }
          console.log(`${username} reconnected as SPECTATOR`);
        }
        
        await session.save();
        return { session, role, recovered: true };
      }
      
      // No existing session, create or join new one
      const activeSession = await this.findOrCreateActiveSession();
      console.log(`Active session found/created for ${username}:`, {
        sessionId: activeSession._id,
        status: activeSession.status,
        whitePlayer: activeSession.whitePlayer.username,
        blackPlayer: activeSession.blackPlayer.username
      });
      
      const { session, role } = await this.assignPlayerToSession(
        activeSession._id,
        { userId, socketId, username }
      );
      
      console.log(`Final assignment for ${username}: role=${role}`);
      return { session, role, recovered: false };
    } catch (error) {
      throw new Error(`Failed to handle reconnection: ${error.message}`);
    }
  }

  /**
   * Persist game state snapshot for recovery
   * @param {string} sessionId - Game session ID
   * @param {Object} additionalData - Additional data to persist
   * @returns {Promise<GameSession>} Updated session
   */
  static async persistGameState(sessionId, additionalData = {}) {
    try {
      const session = await GameSession.findById(sessionId);
      
      if (!session) {
        throw new Error('Game session not found');
      }

      // Update last activity timestamp
      session.lastActivity = new Date();
      
      // Persist any additional game state data
      if (additionalData.gameState) {
        session.gameState = additionalData.gameState;
      }
      
      if (additionalData.moves) {
        session.moves = additionalData.moves;
      }

      await session.save();
      return session;
    } catch (error) {
      throw new Error(`Failed to persist game state: ${error.message}`);
    }
  }

  /**
   * Handle abandoned game cleanup
   * @param {number} minutesInactive - Minutes of inactivity to consider abandoned
   * @returns {Promise<number>} Number of sessions marked as abandoned
   */
  static async handleAbandonedGames(minutesInactive = 30) {
    try {
      const cutoffTime = new Date();
      cutoffTime.setMinutes(cutoffTime.getMinutes() - minutesInactive);

      const result = await GameSession.updateMany(
        {
          status: { $in: ['waiting', 'active'] },
          lastActivity: { $lt: cutoffTime }
        },
        {
          $set: {
            status: 'completed',
            result: 'abandoned',
            completedAt: new Date()
          }
        }
      );

      return result.modifiedCount;
    } catch (error) {
      throw new Error(`Failed to handle abandoned games: ${error.message}`);
    }
  }

  /**
   * Get detailed session statistics
   * @param {string} sessionId - Game session ID
   * @returns {Promise<Object>} Session statistics
   */
  static async getSessionStatistics(sessionId) {
    try {
      const session = await GameSession.findById(sessionId);
      
      if (!session) {
        throw new Error('Game session not found');
      }

      const stats = {
        sessionId: session._id,
        gameId: session.gameId,
        status: session.status,
        duration: session.completedAt ? 
          session.completedAt - session.createdAt : 
          Date.now() - session.createdAt,
        totalMoves: session.moves.length,
        whitePlayer: session.whitePlayer.username,
        blackPlayer: session.blackPlayer.username,
        spectatorCount: session.spectators.length,
        result: session.result,
        createdAt: session.createdAt,
        completedAt: session.completedAt
      };

      return stats;
    } catch (error) {
      throw new Error(`Failed to get session statistics: ${error.message}`);
    }
  }

  /**
   * Clean up old completed sessions
   * @param {number} daysOld - Number of days old to consider for cleanup
   * @returns {Promise<number>} Number of sessions cleaned up
   */
  static async cleanupOldSessions(daysOld = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await GameSession.deleteMany({
        status: 'completed',
        completedAt: { $lt: cutoffDate }
      });

      return result.deletedCount;
    } catch (error) {
      throw new Error(`Failed to cleanup sessions: ${error.message}`);
    }
  }
}

module.exports = GameSessionService;