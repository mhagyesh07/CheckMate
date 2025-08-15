const mongoose = require('mongoose');
const User = require('../models/User');
const config = require('../config/config');

async function createTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB');

    // Check if test user already exists
    const existingUser = await User.findByUsername('testuser');
    if (existingUser) {
      console.log('Test user already exists');
      process.exit(0);
    }

    // Create test user
    const testUser = new User({
      username: 'testuser',
      password: 'Test123!' // This will be hashed by the pre-save middleware
    });

    await testUser.save();
    console.log('Test user created successfully');
    console.log('Username: testuser');
    console.log('Password: Test123!');

    // Create additional test users
    const users = [
      { username: 'bbb', password: 'bbbbbb' },
      { username: 'aaa', password: 'aaaaaa' },
      { username: 'abc', password: 'abcabc' }
    ];

    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      console.log(`User created: ${userData.username} / ${userData.password}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error creating test user:', error);
    process.exit(1);
  }
}

createTestUser();