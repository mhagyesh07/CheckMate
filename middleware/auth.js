const JWTService = require('../services/jwtService');
const User = require('../models/User');

/**
 * JWT Authentication middleware
 * Verifies JWT token and adds user info to request object
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Verify token
    const decoded = JWTService.verifyToken(token);
    
    // Check if user still exists
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists'
      });
    }

    // Add user info to request
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      userDoc: user
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.message.includes('expired')) {
      return res.status(401).json({
        success: false,
        message: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.message.includes('Invalid')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

/**
 * Optional authentication middleware
 * Adds user info if token is present and valid, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = JWTService.verifyToken(token);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (user) {
      req.user = {
        userId: decoded.userId,
        username: decoded.username,
        userDoc: user
      };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    // If token is invalid, just continue without user info
    req.user = null;
    next();
  }
};

/**
 * Error handling middleware for authentication
 */
const handleAuthError = (error, req, res, next) => {
  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  next(error);
};

module.exports = {
  authenticateToken,
  optionalAuth,
  handleAuthError
};