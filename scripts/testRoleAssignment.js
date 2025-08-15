const mongoose = require('mongoose');
const GameSessionService = require('../services/gameSessionService');
const config = require('../config/config');

async function testRoleAssignment() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB');

    // Test user IDs (using the actual user IDs from your database)
    const user1 = { userId: '689efa589a2660e6542890d9', socketId: 'socket1', username: 'aaa' };
    const user2 = { userId: '689efa589a2660e6542890d7', socketId: 'socket2', username: 'bbb' };

    console.log('\n=== Testing Role Assignment ===');

    // First user connects
    console.log('\n1. First user (aaa) connects:');
    const result1 = await GameSessionService.handlePlayerReconnection(
      user1.userId, user1.socketId, user1.username
    );
    console.log('Result:', { role: result1.role, recovered: result1.recovered });
    console.log('Session state:', {
      status: result1.session.status,
      whitePlayer: result1.session.whitePlayer.username,
      blackPlayer: result1.session.blackPlayer.username
    });

    // Second user connects
    console.log('\n2. Second user (bbb) connects:');
    const result2 = await GameSessionService.handlePlayerReconnection(
      user2.userId, user2.socketId, user2.username
    );
    console.log('Result:', { role: result2.role, recovered: result2.recovered });
    console.log('Session state:', {
      status: result2.session.status,
      whitePlayer: result2.session.whitePlayer.username,
      blackPlayer: result2.session.blackPlayer.username
    });

    console.log('\n=== Test Complete ===');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testRoleAssignment();