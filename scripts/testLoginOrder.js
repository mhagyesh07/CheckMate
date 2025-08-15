const axios = require('axios');
const io = require('socket.io-client');

const BASE_URL = 'http://localhost:3000';

async function testLoginOrder() {
  console.log('=== Testing Login Order Role Assignment ===\n');

  try {
    // Step 1: Login aaa first
    console.log('1. Logging in aaa...');
    const aaaLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'aaa',
      password: 'password123'
    });
    
    if (!aaaLoginResponse.data.success) {
      throw new Error('Failed to login aaa');
    }
    
    const aaaToken = aaaLoginResponse.data.data.token;
    console.log('   ✓ aaa logged in successfully');

    // Step 2: Connect aaa to socket immediately
    console.log('2. Connecting aaa to socket...');
    const aaaSocket = io(BASE_URL, {
      auth: { token: aaaToken },
      transports: ['websocket']
    });

    // Wait for aaa to get role assignment
    const aaaRole = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout waiting for aaa role')), 5000);
      
      aaaSocket.on('playerRole', (role) => {
        clearTimeout(timeout);
        resolve(role === 'w' ? 'white' : 'black');
      });
      
      aaaSocket.on('spectatorRole', () => {
        clearTimeout(timeout);
        resolve('spectator');
      });
      
      aaaSocket.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    console.log(`   ✓ aaa connected and assigned role: ${aaaRole}`);

    // Step 3: Wait a moment, then login bbb
    console.log('3. Waiting 2 seconds, then logging in bbb...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const bbbLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'bbb',
      password: 'password123'
    });
    
    if (!bbbLoginResponse.data.success) {
      throw new Error('Failed to login bbb');
    }
    
    const bbbToken = bbbLoginResponse.data.data.token;
    console.log('   ✓ bbb logged in successfully');

    // Step 4: Connect bbb to socket
    console.log('4. Connecting bbb to socket...');
    const bbbSocket = io(BASE_URL, {
      auth: { token: bbbToken },
      transports: ['websocket']
    });

    // Wait for bbb to get role assignment
    const bbbRole = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout waiting for bbb role')), 5000);
      
      bbbSocket.on('playerRole', (role) => {
        clearTimeout(timeout);
        resolve(role === 'w' ? 'white' : 'black');
      });
      
      bbbSocket.on('spectatorRole', () => {
        clearTimeout(timeout);
        resolve('spectator');
      });
      
      bbbSocket.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    console.log(`   ✓ bbb connected and assigned role: ${bbbRole}`);

    // Step 5: Verify results
    console.log('\n=== RESULTS ===');
    console.log(`aaa (first to connect): ${aaaRole}`);
    console.log(`bbb (second to connect): ${bbbRole}`);
    
    if (aaaRole === 'white' && bbbRole === 'black') {
      console.log('✓ PASS: Login order role assignment working correctly');
    } else {
      console.log('✗ FAIL: Login order role assignment not working as expected');
      console.log('Expected: aaa=white, bbb=black');
      console.log(`Actual: aaa=${aaaRole}, bbb=${bbbRole}`);
    }

    // Cleanup
    aaaSocket.disconnect();
    bbbSocket.disconnect();

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testLoginOrder();