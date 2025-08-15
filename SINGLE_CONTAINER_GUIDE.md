# 🐳 Single Container Deployment Guide

## 🎯 Overview

This setup runs **everything in one container**:
- ✅ React Frontend (served by Nginx)
- ✅ Node.js Backend (Express + Socket.IO)
- ✅ Nginx Reverse Proxy
- ✅ All managed by Supervisor

## 🚀 Quick Start

### 1. Test Locally
```bash
# Build and run single container
npm run deploy:single

# Start with Docker Compose
npm run docker:single

# Access your app
open http://localhost:3000
```

### 2. Deploy to Render
```bash
# Push to GitHub
git add .
git commit -m "Single container deployment"
git push origin main

# Deploy on Render
# Use render.single.yaml or Dockerfile.single
```

## 📊 Container Architecture

```
┌─────────────────────────────────────────┐
│ Single Container (Port 80/10000)        │
├─────────────────────────────────────────┤
│                                         │
│ 🌐 Nginx (Reverse Proxy)               │
│ ├── /api/* ────────┐                   │
│ ├── /socket.io/* ──┼─→ Node.js:3001    │
│ └── /* ────────────┘   (Backend)       │
│     │                                   │
│     └─→ React Build                     │
│         (Static Files)                  │
│                                         │
│ 📦 Node.js Backend (Port 3001)         │
│ ├── Express API                        │
│ ├── Socket.IO WebSockets               │
│ ├── JWT Authentication                 │
│ └── MongoDB Connection                 │
│                                         │
│ ⚡ Supervisor (Process Manager)         │
│ ├── Manages Nginx                      │
│ ├── Manages Node.js                    │
│ └── Auto-restart on failure            │
└─────────────────────────────────────────┘
```

## 🔧 Files Structure

### Core Files:
- `Dockerfile.single` - Single container build
- `docker-compose.single.yml` - Local development
- `render.single.yaml` - Render deployment config
- `scripts/deploy-single.js` - Setup script

### Configuration:
- Nginx config (embedded in Dockerfile)
- Supervisor config (process management)
- Health checks and logging

## 🌐 How It Works

### Request Flow:
```
User Request → Nginx (Port 80) → Routes:
├── /api/* → Node.js Backend (Port 3001)
├── /socket.io/* → Node.js Backend (Port 3001)
└── /* → React Static Files
```

### Internal Communication:
- **External**: Port 80 (or PORT env var)
- **Internal**: Node.js on port 3001
- **Nginx**: Proxies API calls to backend
- **Static**: React files served directly by Nginx

## 🚀 Deployment Options

### Option 1: Render (Recommended)
```yaml
# Use render.single.yaml
services:
  - type: web
    runtime: docker
    dockerfilePath: ./Dockerfile.single
```

### Option 2: Docker Compose
```bash
# Local development
docker-compose -f docker-compose.single.yml up

# Production
docker-compose -f docker-compose.single.yml up -d
```

### Option 3: Direct Docker
```bash
# Build
docker build -f Dockerfile.single -t chess-game .

# Run
docker run -p 3000:80 \
  -e MONGODB_URI="your-connection-string" \
  -e JWT_SECRET="your-secret" \
  chess-game
```

## 🔐 Environment Variables

### Required:
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chess_game
JWT_SECRET=your-super-secret-jwt-key-32-chars-minimum
JWT_REFRESH_SECRET=different-refresh-secret-key
```

### Optional:
```bash
NODE_ENV=production
PORT=80                    # External port
BACKEND_PORT=3001         # Internal Node.js port
CORS_ORIGIN=*             # Frontend URL
LOG_LEVEL=info
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
```

## 📱 Local Development

### Start Development Server:
```bash
# Method 1: Docker Compose
npm run docker:single

# Method 2: Direct Docker
npm run deploy:single
docker run -p 3000:80 chess-game-single

# Method 3: Manual
docker build -f Dockerfile.single -t chess-game .
docker run -p 3000:80 --env-file .env chess-game
```

### Access Points:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3000/api/health
- **WebSocket**: ws://localhost:3000/socket.io

## 🔍 Monitoring & Logs

### View Logs:
```bash
# All logs
docker-compose -f docker-compose.single.yml logs

# Specific service logs
docker exec -it container_name tail -f /var/log/nginx/access.log
docker exec -it container_name tail -f /var/log/nodejs/access.log
```

### Health Check:
```bash
# Internal health check
curl http://localhost:3000/api/health

# Docker health status
docker ps  # Shows health status
```

## 🚨 Troubleshooting

### Common Issues:

1. **Port Conflicts**:
   ```bash
   # Change external port
   docker run -p 8080:80 chess-game
   ```

2. **Build Failures**:
   ```bash
   # Clean build
   docker system prune -a
   docker build --no-cache -f Dockerfile.single -t chess-game .
   ```

3. **API Not Working**:
   - Check nginx proxy configuration
   - Verify backend is running on port 3001
   - Check CORS settings

4. **Frontend Not Loading**:
   - Verify React build completed
   - Check nginx static file serving
   - Verify index.html exists

### Debug Commands:
```bash
# Enter container
docker exec -it container_name sh

# Check processes
docker exec -it container_name ps aux

# Check nginx config
docker exec -it container_name nginx -t

# Check ports
docker exec -it container_name netstat -tlnp
```

## ⚡ Performance Optimization

### Nginx Optimizations:
- ✅ Gzip compression enabled
- ✅ Static file caching (1 year)
- ✅ Proxy buffering
- ✅ Keep-alive connections

### Docker Optimizations:
- ✅ Multi-stage build
- ✅ Alpine Linux (smaller image)
- ✅ Production dependencies only
- ✅ Layer caching

### Application Optimizations:
- ✅ React production build
- ✅ Minified assets
- ✅ Code splitting
- ✅ Service worker ready

## 💰 Cost Benefits

### Single Container Advantages:
- **Lower Cost**: One container vs multiple services
- **Simpler Deployment**: No service coordination
- **Faster Startup**: Everything in one place
- **Easier Debugging**: All logs in one place

### Resource Usage:
- **Memory**: ~512MB (vs 1GB+ for separate containers)
- **CPU**: Shared between services
- **Network**: No inter-service communication overhead

## 🔄 Scaling Considerations

### When to Use Single Container:
- ✅ Small to medium applications
- ✅ Development/testing environments
- ✅ Simple deployment requirements
- ✅ Cost-sensitive projects

### When to Use Separate Containers:
- ❌ High traffic applications
- ❌ Need independent scaling
- ❌ Complex microservices
- ❌ Different resource requirements

## 🎉 Benefits Summary

### ✅ Advantages:
- **Simple**: One container, one deployment
- **Fast**: No network overhead between services
- **Cheap**: Lower resource usage
- **Easy**: Unified logging and monitoring

### ⚠️ Considerations:
- **Scaling**: Limited to vertical scaling
- **Isolation**: Services share resources
- **Updates**: Requires full container restart

## 🚀 Ready to Deploy!

Your single container setup includes:
- ✅ Production-ready Nginx configuration
- ✅ Optimized React build
- ✅ Secure Node.js backend
- ✅ Health checks and monitoring
- ✅ Auto-restart on failures
- ✅ Comprehensive logging

**Perfect for getting your chess game online quickly and cost-effectively!** 🎯