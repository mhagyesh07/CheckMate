const User = require('../models/User');
const JWTService = require('../services/jwtService');
const PasswordService = require('../services/passwordService');
const { validationResult } = require('express-validator');

class AuthController {
  /**
   * Register new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async register(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { username, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findByUsername(username);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Username already exists'
        });
      }

      // Validate password strength
      const passwordValidation = PasswordService.validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Password does not meet requirements',
          errors: passwordValidation.errors
        });
      }

      // Create new user
      const newUser = new User({
        username,
        password // Will be hashed by the pre-save middleware
      });

      await newUser.save();

      // Generate JWT token
      const token = JWTService.generateToken({
        userId: newUser._id,
        username: newUser.username
      });

      // Generate refresh token
      const refreshToken = JWTService.generateRefreshToken({
        userId: newUser._id,
        username: newUser.username
      });

      // Return success response (exclude password)
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: newUser._id,
            username: newUser.username,
            gameStats: newUser.gameStats,
            createdAt: newUser.createdAt
          },
          token,
          refreshToken
        }
      });

    } catch (error) {
      console.error('Error during user registration:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during registration',
      });
    }
  }

  /**
   * Login user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async login(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { username, password } = req.body;

      // Find user by username
      const user = await User.findByUsername(username);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password'
        });
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password'
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate JWT token
      const token = JWTService.generateToken({
        userId: user._id,
        username: user.username
      });

      // Generate refresh token
      const refreshToken = JWTService.generateRefreshToken({
        userId: user._id,
        username: user.username
      });

      // Return success response (exclude password)
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user._id,
            username: user.username,
            gameStats: user.gameStats,
            lastLogin: user.lastLogin
          },
          token,
          refreshToken
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during login'
      });
    }
  }

  /**
   * Refresh JWT token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
      }

      // Verify refresh token
      const decoded = JWTService.verifyToken(refreshToken);
      
      if (decoded.type !== 'refresh') {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }

      // Find user
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      // Generate new tokens
      const newToken = JWTService.generateToken({
        userId: user._id,
        username: user.username
      });

      const newRefreshToken = JWTService.generateRefreshToken({
        userId: user._id,
        username: user.username
      });

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          token: newToken,
          refreshToken: newRefreshToken
        }
      });

    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }
  }

  /**
   * Get current user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.userId).select('-password');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user._id,
            username: user.username,
            gameStats: user.gameStats,
            winRate: user.getWinRate(),
            createdAt: user.createdAt,
            lastLogin: user.lastLogin
          }
        }
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Logout user (client-side token removal)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async logout(req, res) {
    try {
      // In a stateless JWT system, logout is primarily handled client-side
      // by removing the token from storage. This endpoint confirms the logout.
      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during logout'
      });
    }
  }
}

module.exports = AuthController;
