const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const connectDB = require('../config/database');

async function listUsers() {
  try {
    await connectDB();
    console.log('Connected to database');

    const users = await User.find({}, 'username email createdAt');
    
    console.log('\nExisting users:');
    console.log('================');
    users.forEach(user => {
      console.log(`- ${user.username} (${user.email}) - Created: ${user.createdAt}`);
    });
    
    console.log(`\nTotal users: ${users.length}`);

  } catch (error) {
    console.error('Error listing users:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

listUsers();