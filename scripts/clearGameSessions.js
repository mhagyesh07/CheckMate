const mongoose = require('mongoose');
require('dotenv').config();

const GameSession = require('../models/GameSession');
const connectDB = require('../config/database');

async function clearGameSessions() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Delete all game sessions
    const result = await GameSession.deleteMany({});
    console.log(`Deleted ${result.deletedCount} game sessions`);

  } catch (error) {
    console.error('Error clearing game sessions:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

clearGameSessions();