#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Single Container Deployment Setup\n');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

try {
  // Check required files
  log('📋 Checking files...', 'blue');
  
  const requiredFiles = [
    'Dockerfile.single',
    'docker-compose.single.yml',
    'package.json',
    'client/package.json'
  ];
  
  let allGood = true;
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      log(`✅ ${file}`, 'green');
    } else {
      log(`❌ ${file} missing`, 'red');
      allGood = false;
    }
  });
  
  if (!allGood) {
    log('\n❌ Some required files are missing!', 'red');
    process.exit(1);
  }

  // Test Docker
  log('\n🐳 Testing Docker...', 'blue');
  try {
    execSync('docker --version', { stdio: 'pipe' });
    execSync('docker-compose --version', { stdio: 'pipe' });
    log('✅ Docker and Docker Compose available', 'green');
  } catch (error) {
    log('❌ Docker or Docker Compose not available', 'red');
    log('Please install Docker Desktop', 'yellow');
    process.exit(1);
  }

  // Build and test
  log('\n🔨 Building single container...', 'blue');
  execSync('docker build -f Dockerfile.single -t chess-game-single .', { stdio: 'inherit' });
  log('✅ Build successful!', 'green');

  // Show deployment options
  log('\n🚀 Deployment Options:', 'blue');
  log('='.repeat(50), 'blue');
  
  log('\n1. Local Development:', 'yellow');
  log('   docker-compose -f docker-compose.single.yml up', 'reset');
  log('   → Access at: http://localhost:3000', 'reset');
  
  log('\n2. Production (Render):', 'yellow');
  log('   • Use Dockerfile.single', 'reset');
  log('   • Set PORT environment variable', 'reset');
  log('   • All services run in one container', 'reset');
  
  log('\n3. Manual Docker Run:', 'yellow');
  log('   docker run -p 3000:80 \\', 'reset');
  log('     -e MONGODB_URI="your-connection-string" \\', 'reset');
  log('     -e JWT_SECRET="your-secret" \\', 'reset');
  log('     chess-game-single', 'reset');

  log('\n📊 Container Architecture:', 'blue');
  log('┌─────────────────────────────────────┐', 'reset');
  log('│ Single Container                    │', 'reset');
  log('├─────────────────────────────────────┤', 'reset');
  log('│ Nginx (Port 80) ← External Traffic │', 'reset');
  log('│   ├── /api/* → Node.js (Port 3001) │', 'reset');
  log('│   ├── /socket.io/* → Node.js       │', 'reset');
  log('│   └── /* → React Build (Static)    │', 'reset');
  log('│                                     │', 'reset');
  log('│ Node.js Backend (Port 3001)        │', 'reset');
  log('│   ├── Express API                  │', 'reset');
  log('│   ├── Socket.IO                    │', 'reset');
  log('│   └── MongoDB Connection           │', 'reset');
  log('│                                     │', 'reset');
  log('│ React Frontend (Static Files)      │', 'reset');
  log('│   └── Served by Nginx              │', 'reset');
  log('└─────────────────────────────────────┘', 'reset');

  log('\n🔧 Environment Variables:', 'blue');
  log('Required:', 'yellow');
  log('• MONGODB_URI - Your MongoDB connection', 'reset');
  log('• JWT_SECRET - Secret for JWT tokens', 'reset');
  log('• JWT_REFRESH_SECRET - Secret for refresh tokens', 'reset');
  
  log('\nOptional:', 'yellow');
  log('• PORT - External port (default: 80)', 'reset');
  log('• NODE_ENV - Environment (default: production)', 'reset');
  log('• CORS_ORIGIN - Frontend URL for CORS', 'reset');

  log('\n✅ Single container setup complete!', 'green');
  log('🎯 Everything runs in one container - perfect for simple deployment!', 'green');

} catch (error) {
  log(`❌ Error: ${error.message}`, 'red');
  process.exit(1);
}