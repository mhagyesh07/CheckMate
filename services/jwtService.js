const jwt = require('jsonwebtoken');
const config = require('../config/config');

class JWTService {
  /**
   * Generate a JWT token for a user
   * @param {Object} payload - User data to include in token
   * @param {string} expiresIn - Token expiration time
   * @returns {string} - JWT token
   */
  static generateToken(payload, expiresIn = config.jwtExpiresIn) {
    try {
      if (!payload || typeof payload !== 'object') {
        throw new Error('Payload must be a valid object');
      }

      // Remove sensitive information from payload
      const tokenPayload = {
        userId: payload.userId || payload._id,
        username: payload.username,
        iat: Math.floor(Date.now() / 1000)
      };

      return jwt.sign(tokenPayload, config.jwtSecret, {
        expiresIn,
        issuer: 'chess-game-app',
        audience: 'chess-game-users'
      });
    } catch (error) {
      throw new Error(`Token generation failed: ${error.message}`);
    }
  }

  /**
   * Verify and decode a JWT token
   * @param {string} token - JWT token to verify
   * @returns {Object} - Decoded token payload
   */
  static verifyToken(token) {
    try {
      if (!token || typeof token !== 'string') {
        throw new Error('Token must be a valid string');
      }

      // Remove 'Bearer ' prefix if present
      const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;

      return jwt.verify(cleanToken, config.jwtSecret, {
        issuer: 'chess-game-app',
        audience: 'chess-game-users'
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      } else if (error.name === 'NotBeforeError') {
        throw new Error('Token not active yet');
      } else {
        throw new Error(`Token verification failed: ${error.message}`);
      }
    }
  }

  /**
   * Generate a refresh token
   * @param {Object} payload - User data to include in token
   * @returns {string} - Refresh token
   */
  static generateRefreshToken(payload) {
    try {
      const tokenPayload = {
        userId: payload.userId || payload._id,
        username: payload.username,
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000)
      };

      return jwt.sign(tokenPayload, config.jwtSecret, {
        expiresIn: '7d', // Refresh tokens last longer
        issuer: 'chess-game-app',
        audience: 'chess-game-users'
      });
    } catch (error) {
      throw new Error(`Refresh token generation failed: ${error.message}`);
    }
  }

  /**
   * Decode token without verification (for debugging)
   * @param {string} token - JWT token to decode
   * @returns {Object} - Decoded token payload
   */
  static decodeToken(token) {
    try {
      const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
      return jwt.decode(cleanToken);
    } catch (error) {
      throw new Error(`Token decoding failed: ${error.message}`);
    }
  }

  /**
   * Check if token is expired
   * @param {string} token - JWT token to check
   * @returns {boolean} - True if token is expired
   */
  static isTokenExpired(token) {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) return true;
      
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true; // Consider invalid tokens as expired
    }
  }

  /**
   * Extract user ID from token
   * @param {string} token - JWT token
   * @returns {string} - User ID
   */
  static getUserIdFromToken(token) {
    try {
      const decoded = this.verifyToken(token);
      return decoded.userId;
    } catch (error) {
      throw new Error(`Failed to extract user ID: ${error.message}`);
    }
  }

  /**
   * Extract username from token
   * @param {string} token - JWT token
   * @returns {string} - Username
   */
  static getUsernameFromToken(token) {
    try {
      const decoded = this.verifyToken(token);
      return decoded.username;
    } catch (error) {
      throw new Error(`Failed to extract username: ${error.message}`);
    }
  }
}

module.exports = JWTService;