const fetch = require('node-fetch');

async function testAuth() {
  try {
    console.log('Testing authentication endpoint...');
    
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'bbb',
        password: 'bbbbbb'
      }),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());

    if (response.ok) {
      const data = await response.json();
      console.log('Login successful:', data);
    } else {
      const errorText = await response.text();
      console.log('Login failed:', errorText);
    }
  } catch (error) {
    console.error('Error testing auth:', error);
  }
}

testAuth();