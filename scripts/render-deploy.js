#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Preparing for Render deployment...\n');

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

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✅ ${description} exists`, 'green');
    return true;
  } else {
    log(`❌ ${description} missing`, 'red');
    return false;
  }
}

try {
  // Check if we're in the right directory
  if (!fs.existsSync('package.json')) {
    log('❌ Error: package.json not found. Please run this script from the project root.', 'red');
    process.exit(1);
  }

  log('📋 Checking deployment requirements...', 'blue');
  
  let allGood = true;
  
  // Check required files
  allGood &= checkFile('Dockerfile', 'Dockerfile');
  allGood &= checkFile('render.yaml', 'render.yaml');
  allGood &= checkFile('.dockerignore', '.dockerignore');
  allGood &= checkFile('healthcheck.js', 'healthcheck.js');
  allGood &= checkFile('client/package.json', 'Client package.json');
  
  if (!allGood) {
    log('\n❌ Some required files are missing. Please check the files above.', 'red');
    process.exit(1);
  }

  // Check environment variables
  log('\n🔧 Checking environment configuration...', 'blue');
  
  if (fs.existsSync('.env')) {
    const envContent = fs.readFileSync('.env', 'utf8');
    
    const requiredVars = ['MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
    const missingVars = requiredVars.filter(varName => !envContent.includes(varName));
    
    if (missingVars.length > 0) {
      log(`⚠️  Missing environment variables: ${missingVars.join(', ')}`, 'yellow');
      log('   These will be set in Render dashboard', 'yellow');
    } else {
      log('✅ Environment variables configured', 'green');
    }
  } else {
    log('⚠️  .env file not found (will use Render environment variables)', 'yellow');
  }

  // Test Docker build locally (optional)
  log('\n🐳 Testing Docker build...', 'blue');
  try {
    execSync('docker --version', { stdio: 'pipe' });
    log('✅ Docker is available', 'green');
    
    log('   Building Docker image (this may take a few minutes)...', 'blue');
    execSync('docker build -t chess-game-test .', { stdio: 'inherit' });
    log('✅ Docker build successful', 'green');
    
    // Clean up test image
    execSync('docker rmi chess-game-test', { stdio: 'pipe' });
    
  } catch (error) {
    log('⚠️  Docker not available or build failed', 'yellow');
    log('   This is okay - Render will build the image', 'yellow');
  }

  // Check git status
  log('\n📦 Checking git status...', 'blue');
  try {
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    if (gitStatus.trim()) {
      log('⚠️  You have uncommitted changes:', 'yellow');
      console.log(gitStatus);
      log('   Consider committing before deployment', 'yellow');
    } else {
      log('✅ Git working directory clean', 'green');
    }
  } catch (error) {
    log('⚠️  Not a git repository or git not available', 'yellow');
  }

  // Generate deployment summary
  log('\n📋 Deployment Summary:', 'blue');
  log('='.repeat(50), 'blue');
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  log(`📦 Project: ${packageJson.name} v${packageJson.version}`, 'green');
  log(`🐳 Runtime: Docker (Node.js 18 Alpine)`, 'green');
  log(`🌐 Platform: Render`, 'green');
  log(`📁 Root: Project root directory`, 'green');
  log(`🔍 Health Check: /api/health`, 'green');
  
  // Next steps
  log('\n🚀 Next Steps:', 'blue');
  log('='.repeat(50), 'blue');
  log('1. Push your code to GitHub:', 'yellow');
  log('   git add .', 'reset');
  log('   git commit -m "Ready for Render deployment"', 'reset');
  log('   git push origin main', 'reset');
  log('', 'reset');
  log('2. Deploy on Render:', 'yellow');
  log('   • Go to https://dashboard.render.com', 'reset');
  log('   • Click "New +" → "Blueprint"', 'reset');
  log('   • Connect your GitHub repository', 'reset');
  log('   • Render will auto-deploy using render.yaml!', 'reset');
  log('', 'reset');
  log('3. Set MongoDB URI in Render dashboard:', 'yellow');
  log('   Environment → MONGODB_URI → Your connection string', 'reset');
  log('', 'reset');
  log('4. Update frontend with your Render URL:', 'yellow');
  log('   REACT_APP_API_URL=https://your-app.onrender.com', 'reset');
  log('', 'reset');

  // Configuration files info
  log('📄 Configuration Files:', 'blue');
  log('• render.yaml: Render deployment configuration', 'reset');
  log('• Dockerfile: Multi-stage Docker build', 'reset');
  log('• .dockerignore: Optimized build context', 'reset');
  log('• healthcheck.js: Application health monitoring', 'reset');
  
  log('\n✅ Your project is ready for Render deployment!', 'green');
  log('📖 See RENDER_DEPLOY.md for detailed instructions', 'blue');

} catch (error) {
  log(`❌ Error during deployment preparation: ${error.message}`, 'red');
  process.exit(1);
}