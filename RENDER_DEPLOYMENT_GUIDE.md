# 🚀 Render Deployment Guide - Single Container

## 📋 Quick Setup Summary

### Files Created:
- ✅ `Dockerfile.render` - Render-optimized single container
- ✅ `render.yaml` - Automatic deployment configuration

### What You Need to Do:
1. Push code to GitHub
2. Deploy on Render (2 methods below)
3. Set MongoDB URI environment variable
4. Done! 🎉

## 🎯 Method 1: Automatic Deployment (Recommended)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Add Render deployment files"
git push origin main
```

### Step 2: Deploy with Blueprint
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +" → "Blueprint"**
3. Connect your GitHub repository
4. Render automatically detects `render.yaml` and deploys!

### Step 3: Set MongoDB URI
1. Go to your service in Render dashboard
2. Click **"Environment"** tab
3. Find `MONGODB_URI` and set it to:
```
mongodb+srv://Bhagyesh:CiGj8XmoKscMgiqU@cluster2.huaiu3c.mongodb.net/chess_game?retryWrites=true&w=majority&appName=Cluster2
```

## 🎯 Method 2: Manual Web Service

### Step 1: Create Web Service
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +" → "Web Service"**
3. Connect your GitHub repository

### Step 2: Configure Service
```
Name: chess-game-fullstack
Runtime: Docker
Region: Oregon (US West)
Branch: main
Dockerfile Path: ./Dockerfile.render
```

### Step 3: Environment Variables
Set these in Render dashboard:

**Required:**
```bash
MONGODB_URI=mongodb+srv://Bhagyesh:CiGj8XmoKscMgiqU@cluster2.huaiu3c.mongodb.net/chess_game?retryWrites=true&w=majority&appName=Cluster2
```

**Auto-configured (optional to override):**
```bash
NODE_ENV=production
JWT_SECRET=auto-generated-by-render
JWT_REFRESH_SECRET=auto-generated-by-render
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=*
LOG_LEVEL=info
```

### Step 4: Deploy
Click **"Create Web Service"** and wait for deployment (5-10 minutes)

## 🔧 How It Works on Render

### Port Handling:
```bash
# Render assigns dynamic PORT (e.g., 10000)
PORT=10000  # Set by Render automatically

# Your container adapts:
Nginx listens on: $PORT (10000)
Backend runs on: 3001 (internal)
```

### Request Flow:
```
Internet → Render Load Balancer → Your Container:$PORT
                                      ↓
                                   Nginx:$PORT
                                      ↓
                              Routes requests:
                              /api/* → Node.js:3001
                              /* → React static files
```

### Container Architecture:
```
┌─────────────────────────────────────┐
│ Single Container (Port $PORT)       │
├─────────────────────────────────────┤
│ Nginx (Port $PORT - Dynamic)        │
│ ├── /api/* → Node.js:3001          │
│ ├── /socket.io/* → Node.js:3001    │
│ └── /* → React Build Files         │
│                                     │
│ Node.js Backend (Port 3001)        │
│ ├── Express API                    │
│ ├── Socket.IO WebSockets           │
│ └── MongoDB Connection             │
│                                     │
│ Supervisor (Process Manager)       │
│ ├── Manages Nginx                  │
│ └── Manages Node.js                │
└─────────────────────────────────────┘
```

## 🧪 Testing Your Deployment

### After Deployment:
Your app will be available at: `https://your-service-name.onrender.com`

### Test Endpoints:
```bash
# Health check
curl https://your-service-name.onrender.com/api/health

# Frontend
open https://your-service-name.onrender.com

# Register user
curl -X POST https://your-service-name.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

## 🔍 Monitoring & Debugging

### View Logs in Render:
1. Go to your service dashboard
2. Click **"Logs"** tab
3. See real-time logs from both Nginx and Node.js

### Log Structure:
```
=== Chess Game Container Starting ===
Render assigned port: 10000
Backend internal port: 3001
Nginx will listen on port: 10000
Backend will run on port: 3001
Starting services with supervisor...
```

### Health Checks:
- **Endpoint**: `/api/health`
- **Frequency**: Every 30 seconds
- **Timeout**: 10 seconds
- **Retries**: 3 attempts

## 🚨 Troubleshooting

### Common Issues:

1. **Build Fails**:
   ```bash
   # Check build logs in Render dashboard
   # Common causes:
   - Missing dependencies in package.json
   - React build errors
   - Docker syntax errors
   ```

2. **App Not Loading**:
   ```bash
   # Check if container is running
   # Verify PORT environment variable
   # Check nginx configuration
   ```

3. **API Errors**:
   ```bash
   # Verify MONGODB_URI is set correctly
   # Check backend logs for connection errors
   # Verify JWT secrets are generated
   ```

4. **WebSocket Issues**:
   ```bash
   # Check Socket.IO proxy configuration
   # Verify WebSocket upgrade headers
   # Check for CORS issues
   ```

### Debug Commands:
```bash
# Test locally with same Dockerfile
docker build -f Dockerfile.render -t chess-render .
docker run -p 3000:10000 -e PORT=10000 chess-render

# Check health
curl http://localhost:3000/api/health
```

## 💰 Render Free Tier Limits

### What You Get:
- ✅ 512 MB RAM
- ✅ 0.1 CPU units
- ✅ Sleeps after 15 minutes of inactivity
- ✅ 750 hours/month (enough for development)

### Performance Tips:
- App takes ~30 seconds to wake up from sleep
- First request after sleep will be slower
- Consider upgrading to Starter plan ($7/month) for production

## 🔄 Auto-Deployment

### Automatic Updates:
- Every `git push` to main branch triggers new deployment
- Zero-downtime deployments
- Automatic rollback on failure
- Build cache for faster deployments

### Manual Deployment:
- Click **"Manual Deploy"** in Render dashboard
- Choose specific commit to deploy
- Force rebuild if needed

## 🎉 Success Checklist

After deployment, verify:
- [ ] App loads at your Render URL
- [ ] Can register new users
- [ ] Can login with existing users
- [ ] Can create and join games
- [ ] Real-time moves work (WebSocket)
- [ ] Health check passes
- [ ] Logs show no errors

## 🔗 Next Steps

### Frontend Deployment:
If you want to deploy frontend separately to Vercel:
1. Update `CORS_ORIGIN` in Render to your Vercel URL
2. Deploy client folder to Vercel
3. Set `REACT_APP_API_URL` to your Render URL

### Custom Domain:
1. Upgrade to paid plan
2. Add custom domain in Render dashboard
3. Update DNS records
4. SSL certificate auto-generated

## 📞 Support

### Render Documentation:
- [Docker Deployments](https://render.com/docs/docker)
- [Environment Variables](https://render.com/docs/environment-variables)
- [Health Checks](https://render.com/docs/health-checks)

### Your App URLs:
- **Service**: `https://your-service-name.onrender.com`
- **Health**: `https://your-service-name.onrender.com/api/health`
- **Dashboard**: `https://dashboard.render.com`

Your chess game is now production-ready on Render! 🎯