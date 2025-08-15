#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting deployment preparation...\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: package.json not found. Please run this script from the project root.');
  process.exit(1);
}

// Check if client directory exists
if (!fs.existsSync('client')) {
  console.error('❌ Error: client directory not found.');
  process.exit(1);
}

try {
  // Install backend dependencies
  console.log('📦 Installing backend dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  // Install frontend dependencies
  console.log('📦 Installing frontend dependencies...');
  execSync('npm install', { cwd: 'client', stdio: 'inherit' });

  // Build frontend
  console.log('🔨 Building frontend...');
  execSync('npm run build', { cwd: 'client', stdio: 'inherit' });

  console.log('\n✅ Deployment preparation complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Push your code to GitHub');
  console.log('2. Deploy backend to Render');
  console.log('3. Deploy frontend to Vercel');
  console.log('4. Update environment variables with actual URLs');
  console.log('\nSee DEPLOYMENT.md for detailed instructions.');

} catch (error) {
  console.error('❌ Error during deployment preparation:', error.message);
  process.exit(1);
}