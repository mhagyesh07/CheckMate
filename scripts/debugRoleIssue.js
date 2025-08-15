const mongoose = require('mongoose');
const GameSessionService = require('../services/gameSessionService');
const config = require('../config/config');

async function debugRoleIssue() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB');

    // Test the exact scenario from the logs
    // User bbb (689efa589a2660e6542890d7) connects first
    const userBbb = { 
      userId: '689efa589a2660e6542890d7', 
      socketId: 'socket1', 
      username: 'bbb' 
    };

    console.log('\n=== Testing bbb as FIRST player ===');
    console.log('User bbb should get WHITE role');

    const result = await GameSessionService.handlePlayerReconnection(
      userBbb.userId, userBbb.socketId, userBbb.username
    );

    console.log('\nResult for bbb:');
    console.log('- Role:', result.role);
    console.log('- Recovered:', result.recovered);
    console.log('- Session status:', result.session.status);
    console.log('- White player:', result.session.whitePlayer.username);
    console.log('- Black player:', result.session.blackPlayer.username);

    if (result.role !== 'white') {
      console.log('\n❌ BUG FOUND: bbb should be WHITE but got', result.role);
    } else {
      console.log('\n✅ Correct: bbb got WHITE role');
    }

    process.exit(0);
  } catch (error) {
    console.error('Debug failed:', error);
    process.exit(1);
  }
}

debugRoleIssue();