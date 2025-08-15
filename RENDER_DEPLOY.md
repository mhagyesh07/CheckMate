# One-Click Render Deployment Guide

## 🚀 Quick Deploy to Render

### Method 1: Using render.yaml (Recommended)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for Render deployment"
   git push origin main
   ```

2. **Deploy on Render**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect `render.yaml` and deploy!

### Method 2: Manual Docker Deployment

1. **Create Web Service**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**:
   ```
   Name: chess-game-backend
   Runtime: Docker
   Branch: main
   Root Directory: . (leave empty)
   ```

3. **Environment Variables** (Auto-set by render.yaml):
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=your-mongodb-connection-string
   JWT_SECRET=auto-generated
   JWT_REFRESH_SECRET=auto-generated
   JWT_EXPIRES_IN=24h
   JWT_REFRESH_EXPIRES_IN=7d
   CORS_ORIGIN=*
   LOG_LEVEL=info
   ```

## 📋 Pre-Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] `render.yaml` file present
- [ ] `Dockerfile` optimized
- [ ] `.dockerignore` configured
- [ ] MongoDB Atlas connection string ready
- [ ] Health check endpoint working

## 🔧 Configuration Files

### render.yaml
```yaml
services:
  - type: web
    name: chess-game-backend
    runtime: docker
    plan: starter
    dockerfilePath: ./Dockerfile
    envVars:
      - key: MONGODB_URI
        sync: false  # You'll set this manually
```

### Dockerfile
- Multi-stage build for optimization
- Node.js 18 Alpine (smaller image)
- Non-root user for security
- Health checks included
- Production-ready

## 🌐 After Deployment

### 1. Set MongoDB URI
```bash
# In Render Dashboard → Environment
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chess_game?retryWrites=true&w=majority
```

### 2. Update Frontend URLs
```bash
# In Vercel → Environment Variables
REACT_APP_API_URL=https://your-render-app.onrender.com
REACT_APP_SOCKET_URL=https://your-render-app.onrender.com
```

### 3. Update CORS
```bash
# In Render → Environment
CORS_ORIGIN=https://your-vercel-app.vercel.app
```

## 🧪 Testing Deployment

### Health Check
```bash
curl https://your-render-app.onrender.com/api/health
```

Expected Response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### API Test
```bash
curl -X POST https://your-render-app.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

## 🔍 Monitoring

### Render Dashboard
- **Logs**: Real-time application logs
- **Metrics**: CPU, Memory, Response time
- **Events**: Deployment history
- **Health**: Service status

### Log Commands
```bash
# View logs in Render dashboard or via CLI
render logs -s your-service-name
```

## 🚨 Troubleshooting

### Common Issues

1. **Build Fails**:
   - Check Dockerfile syntax
   - Verify all dependencies in package.json
   - Check build logs in Render dashboard

2. **Health Check Fails**:
   - Verify `/api/health` endpoint works
   - Check if app is listening on correct PORT
   - Review application logs

3. **Database Connection**:
   - Verify MONGODB_URI format
   - Check MongoDB Atlas network access
   - Ensure database name is correct

4. **CORS Errors**:
   - Update CORS_ORIGIN with exact frontend URL
   - No trailing slashes in URLs
   - Use https:// for production

### Debug Commands
```bash
# Test locally with Docker
docker build -t chess-game .
docker run -p 3000:3000 --env-file .env chess-game

# Check health locally
curl http://localhost:3000/api/health
```

## 📊 Performance Optimization

### Docker Image Size
- Using Alpine Linux (smaller base image)
- Multi-stage build
- .dockerignore excludes unnecessary files
- Production dependencies only

### Render Optimizations
- Health checks for reliability
- Auto-scaling enabled
- CDN for static assets
- Gzip compression enabled

## 💰 Cost Estimation

### Render Starter Plan (Free Tier)
- 512 MB RAM
- 0.1 CPU
- Sleeps after 15 minutes of inactivity
- Perfect for development/testing

### Render Standard Plan ($7/month)
- 512 MB RAM
- 0.5 CPU
- No sleeping
- Custom domains
- Better for production

## 🔄 Auto-Deployment

With `render.yaml`:
- Automatic deployment on git push
- Environment variables managed
- Health checks configured
- Zero-downtime deployments

## 📱 Mobile Considerations

The Docker setup includes:
- Responsive frontend build
- WebSocket support for real-time features
- Mobile-optimized API responses
- Touch-friendly game interface

## 🔐 Security Features

- Non-root Docker user
- Security headers (Helmet.js)
- Rate limiting
- JWT token security
- CORS protection
- Input validation

Your app is now ready for one-click deployment! 🎉