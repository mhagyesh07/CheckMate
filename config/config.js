require('dotenv').config();

const config = {
  // Database
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/chess-game',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  
  // Server
  port: process.env.BACKEND_PORT || process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Validation
  validateConfig() {
    const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
    const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missing.length > 0) {
      console.warn(`Warning: Missing environment variables: ${missing.join(', ')}`);
      console.warn('Using fallback values. Please set these in production.');
    }
    
    if (this.nodeEnv === 'production' && this.jwtSecret === 'fallback-secret-key') {
      throw new Error('JWT_SECRET must be set in production environment');
    }
  }
};

// Validate configuration on load
config.validateConfig();

module.exports = config;