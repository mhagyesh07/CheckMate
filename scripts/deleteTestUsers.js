const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const connectDB = require('../config/database');

async function deleteTestUsers() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Delete test users
    const testUsernames = ['aaa', 'bbb', 'player1', 'player2', 'player3', 'spectator1'];
    
    for (const username of testUsernames) {
      const result = await User.deleteOne({ username });
      if (result.deletedCount > 0) {
        console.log(`Deleted user: ${username}`);
      } else {
        console.log(`User not found: ${username}`);
      }
    }

    console.log('\nTest users deleted successfully!');

  } catch (error) {
    console.error('Error deleting test users:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

deleteTestUsers();