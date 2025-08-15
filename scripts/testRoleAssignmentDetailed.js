const mongoose = require('mongoose');
require('dotenv').config();

// Import models and services
const User = require('../models/User');
const GameSession = require('../models/GameSession');
const GameSessionService = require('../services/gameSessionService');
const connectDB = require('../config/database');

async function testRoleAssignment() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Clean up any existing test sessions
    await GameSession.deleteMany({});
    console.log('Cleaned up existing sessions');

    // Get test users
    const user1 = await User.findOne({ username: 'player1' });
    const user2 = await User.findOne({ username: 'player2' });
    
    if (!user1 || !user2) {
      console.error('Test users not found. Run createTestUsers.js first');
      return;
    }

    console.log('\n=== Testing Role Assignment ===');
    console.log(`User1: ${user1.username} (${user1._id})`);
    console.log(`User2: ${user2.username} (${user2._id})`);

    // Test 1: First user connects
    console.log('\n--- Test 1: First user connects ---');
    const session1 = await GameSessionService.findOrCreateActiveSession();
    console.log(`Created/Found session: ${session1._id}`);

    const result1 = await GameSessionService.assignPlayerToSession(
      session1._id,
      { userId: user1._id.toString(), socketId: 'socket1', username: user1.username }
    );
    
    console.log(`User1 assigned role: ${result1.role}`);
    console.log(`Session after user1:`, {
      whitePlayer: result1.session.whitePlayer.username,
      blackPlayer: result1.session.blackPlayer.username,
      status: result1.session.status
    });

    // Test 2: Second user connects to same session
    console.log('\n--- Test 2: Second user connects ---');
    const result2 = await GameSessionService.assignPlayerToSession(
      session1._id,
      { userId: user2._id.toString(), socketId: 'socket2', username: user2.username }
    );
    
    console.log(`User2 assigned role: ${result2.role}`);
    console.log(`Session after user2:`, {
      whitePlayer: result2.session.whitePlayer.username,
      blackPlayer: result2.session.blackPlayer.username,
      status: result2.session.status
    });

    // Test 3: Same user (user2) connects again (simulating multiple tabs)
    console.log('\n--- Test 3: Same user (user2) connects again ---');
    const result3 = await GameSessionService.assignPlayerToSession(
      session1._id,
      { userId: user2._id.toString(), socketId: 'socket3', username: user2.username }
    );
    
    console.log(`User2 (second connection) assigned role: ${result3.role}`);
    console.log(`Session after user2 reconnection:`, {
      whitePlayer: result3.session.whitePlayer.username,
      blackPlayer: result3.session.blackPlayer.username,
      status: result3.session.status
    });

    // Test 4: Test reconnection logic
    console.log('\n--- Test 4: Test reconnection logic ---');
    const reconnectResult1 = await GameSessionService.handlePlayerReconnection(
      user1._id.toString(),
      'socket4',
      user1.username
    );
    
    console.log(`User1 reconnection result:`, {
      role: reconnectResult1.role,
      recovered: reconnectResult1.recovered
    });

    const reconnectResult2 = await GameSessionService.handlePlayerReconnection(
      user2._id.toString(),
      'socket5',
      user2.username
    );
    
    console.log(`User2 reconnection result:`, {
      role: reconnectResult2.role,
      recovered: reconnectResult2.recovered
    });

    // Test 5: Check what happens with the same user ID from logs
    console.log('\n--- Test 5: Testing with actual user ID from logs ---');
    const problematicUserId = '689efa589a2660e6542890d7'; // bbb user from logs
    
    // Clean session for this test
    await GameSession.deleteMany({});
    const newSession = await GameSessionService.findOrCreateActiveSession();
    
    // First connection
    const bbbResult1 = await GameSessionService.assignPlayerToSession(
      newSession._id,
      { userId: problematicUserId, socketId: 'bbb_socket1', username: 'bbb' }
    );
    console.log(`BBB user first connection role: ${bbbResult1.role}`);
    
    // Second connection (same user, different socket)
    const bbbResult2 = await GameSessionService.assignPlayerToSession(
      newSession._id,
      { userId: problematicUserId, socketId: 'bbb_socket2', username: 'bbb' }
    );
    console.log(`BBB user second connection role: ${bbbResult2.role}`);
    
    console.log(`Final session state:`, {
      whitePlayer: bbbResult2.session.whitePlayer.username,
      blackPlayer: bbbResult2.session.blackPlayer.username,
      whiteSocketId: bbbResult2.session.whitePlayer.socketId,
      blackSocketId: bbbResult2.session.blackPlayer.socketId
    });

    console.log('\n=== Test Complete ===');

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

testRoleAssignment();