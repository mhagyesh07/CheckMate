const mongoose = require('mongoose');
const User = require('../models/User');
const config = require('../config/config');

async function clearUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB');

    // Drop the users collection to clear any old indexes
    await mongoose.connection.db.dropCollection('users');
    console.log('Users collection dropped');

    process.exit(0);
  } catch (error) {
    if (error.message.includes('ns not found')) {
      console.log('Users collection does not exist');
      process.exit(0);
    }
    console.error('Error clearing users:', error);
    process.exit(1);
  }
}

clearUsers();