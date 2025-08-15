const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testLogin() {
  try {
    console.log('Testing login for aaa...');
    
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'aaa',
      password: 'password123'
    });
    
    console.log('Login successful!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('Login failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testLogin();