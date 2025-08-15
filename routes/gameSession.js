const express = require('express');
const GameSessionService = require('../services/gameSessionService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/game-session/status
 * @desc    Get current game session status
 * @access  Private
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const session = await GameSessionService.findOrCreateActiveSession();
    
    // Determine what action the user can take
    let availableAction = 'new_game';
    let userRole = null;
    
    if (session) {
      const userId = req.user.userId;
      
      // Check if user is already in this session
      if (session.whitePlayer.userId?.toString() === userId) {
        userRole = 'white';
        availableAction = 'continue_game';
      } else if (session.blackPlayer.userId?.toString() === userId) {
        userRole = 'black';
        availableAction = 'continue_game';
      } else if (session.spectators.some(spec => spec.userId?.toString() === userId)) {
        userRole = 'spectator';
        availableAction = 'spectate_game';
      } else {
        // User is not in the session, determine what they can do
        if (!session.whitePlayer.userId && !session.blackPlayer.userId) {
          availableAction = 'new_game';
        } else if (!session.whitePlayer.userId || !session.blackPlayer.userId) {
          availableAction = 'join_game';
        } else {
          availableAction = 'spectate_game';
        }
      }
    }
    
    res.status(200).json({
      success: true,
      data: {
        session: session ? {
          id: session._id,
          gameId: session.gameId,
          status: session.status,
          whitePlayer: session.whitePlayer,
          blackPlayer: session.blackPlayer,
          spectatorCount: session.spectators.length
        } : null,
        availableAction,
        userRole
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   POST /api/game-session/create
 * @desc    Create a new game session
 * @access  Private
 */
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const session = await GameSessionService.findOrCreateActiveSession();
    const userId = req.user.userId;
    const username = req.user.username;
    
    // Assign user to the session (will be white player if session is new)
    const { session: updatedSession, role } = await GameSessionService.assignPlayerToSession(
      session._id, 
      { userId, socketId: null, username }
    );
    
    res.status(200).json({
      success: true,
      message: 'Game session created successfully',
      data: {
        session: {
          id: updatedSession._id,
          gameId: updatedSession.gameId,
          status: updatedSession.status,
          whitePlayer: updatedSession.whitePlayer,
          blackPlayer: updatedSession.blackPlayer,
          spectatorCount: updatedSession.spectators.length
        },
        userRole: role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   POST /api/game-session/join
 * @desc    Join an existing game session
 * @access  Private
 */
router.post('/join', authenticateToken, async (req, res) => {
  try {
    const session = await GameSessionService.findOrCreateActiveSession();
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'No active game session found'
      });
    }
    
    const userId = req.user.userId;
    const username = req.user.username;
    
    // Assign user to the session
    const { session: updatedSession, role } = await GameSessionService.assignPlayerToSession(
      session._id, 
      { userId, socketId: null, username }
    );
    
    res.status(200).json({
      success: true,
      message: 'Joined game session successfully',
      data: {
        session: {
          id: updatedSession._id,
          gameId: updatedSession.gameId,
          status: updatedSession.status,
          whitePlayer: updatedSession.whitePlayer,
          blackPlayer: updatedSession.blackPlayer,
          spectatorCount: updatedSession.spectators.length
        },
        userRole: role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   GET /api/game-session/recover
 * @desc    Recover user's active game session
 * @access  Private
 */
router.get('/recover', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const recovery = await GameSessionService.recoverUserSession(userId);
    
    if (!recovery) {
      return res.status(404).json({
        success: false,
        message: 'No active session found for user'
      });
    }
    
    const { session, role } = recovery;
    
    res.status(200).json({
      success: true,
      message: 'Session recovered successfully',
      data: {
        session: {
          id: session._id,
          gameId: session.gameId,
          status: session.status,
          whitePlayer: session.whitePlayer,
          blackPlayer: session.blackPlayer,
          spectatorCount: session.spectators.length,
          gameState: session.gameState,
          moves: session.moves
        },
        userRole: role,
        recovered: true
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   GET /api/game-session/:sessionId/stats
 * @desc    Get detailed session statistics
 * @access  Private
 */
router.get('/:sessionId/stats', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const stats = await GameSessionService.getSessionStatistics(sessionId);
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   POST /api/game-session/cleanup
 * @desc    Clean up abandoned games (admin endpoint)
 * @access  Private
 */
router.post('/cleanup', authenticateToken, async (req, res) => {
  try {
    const { minutesInactive = 30 } = req.body;
    const abandonedCount = await GameSessionService.handleAbandonedGames(minutesInactive);
    const cleanedCount = await GameSessionService.cleanupOldSessions();
    
    res.status(200).json({
      success: true,
      message: 'Cleanup completed successfully',
      data: {
        abandonedGames: abandonedCount,
        cleanedSessions: cleanedCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   GET /api/game-session/active
 * @desc    Get all active game sessions
 * @access  Private
 */
router.get('/active', authenticateToken, async (req, res) => {
  try {
    const sessions = await GameSessionService.getActiveSessions();
    
    const sessionData = sessions.map(session => ({
      id: session._id,
      gameId: session.gameId,
      status: session.status,
      whitePlayer: session.whitePlayer.username,
      blackPlayer: session.blackPlayer.username,
      spectatorCount: session.spectators.length,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity
    }));
    
    res.status(200).json({
      success: true,
      data: sessionData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;