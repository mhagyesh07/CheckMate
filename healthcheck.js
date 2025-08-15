const http = require('http');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3000,
  path: '/api/health',
  method: 'GET',
  timeout: 5000,
  headers: {
    'User-Agent': 'HealthCheck/1.0'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      try {
        const response = JSON.parse(data);
        if (response.success) {
          console.log('Health check passed');
          process.exit(0);
        } else {
          console.error('Health check failed: Invalid response');
          process.exit(1);
        }
      } catch (error) {
        console.error('Health check failed: Invalid JSON response');
        process.exit(1);
      }
    } else {
      console.error(`Health check failed with status: ${res.statusCode}`);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.error('Health check failed:', err.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('Health check timed out');
  req.destroy();
  process.exit(1);
});

req.setTimeout(5000);
req.end();