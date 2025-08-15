const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const connectDB = require('../config/database');

async function createTestUsers() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Create test users
    const testUsers = [
      { username: 'player1', email: 'player1@test.com', password: 'password123' },
      { username: 'player2', email: 'player2@test.com', password: 'password123' },
      { username: 'player3', email: 'player3@test.com', password: 'password123' },
      { username: 'spectator1', email: 'spectator1@test.com', password: 'password123' },
      { username: 'aaa', email: 'aaa@test.com', password: 'password123' },
      { username: 'bbb', email: 'bbb@test.com', password: 'password123' }
    ];

    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ 
        $or: [
          { username: userData.username },
          { email: userData.email }
        ]
      });

      if (existingUser) {
        console.log(`User ${userData.username} already exists, skipping...`);
        continue;
      }

      // Create user (password will be hashed by the model's pre-save hook)
      const user = new User({
        username: userData.username,
        email: userData.email,
        password: userData.password
      });

      await user.save();
      console.log(`Created user: ${userData.username} (${user._id})`);
    }

    console.log('\nTest users created successfully!');
    console.log('You can now log in with:');
    console.log('- Username: player1, Password: password123');
    console.log('- Username: player2, Password: password123');
    console.log('- Username: player3, Password: password123');
    console.log('- Username: spectator1, Password: password123');
    console.log('- Username: aaa, Password: password123');
    console.log('- Username: bbb, Password: password123');

  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

createTestUsers();