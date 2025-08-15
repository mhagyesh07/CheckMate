# 🚀 Deploy to Render

## Quick Deploy

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy on Render**:
   - Go to [render.com](https://render.com)
   - Click **"New +" → "Web Service"**
   - Connect your GitHub repository
   - Configure:
     - **Runtime**: Docker
     - **Branch**: main
     - **Root Directory**: (leave empty)

3. **Set Environment Variables**:
   ```
   MONGODB_URI=mongodb+srv://Bhagyesh:CiGj8XmoKscMgiqU@cluster2.huaiu3c.mongodb.net/chess_game?retryWrites=true&w=majority&appName=Cluster2
   JWT_SECRET=chess-game-super-secret-jwt-key-2024-production-ready-32-chars-minimum
   JWT_REFRESH_SECRET=chess-game-refresh-secret-different-from-main-jwt-secret-2024-prod
   NODE_ENV=production
   ```

4. **Deploy**: Click "Create Web Service"

## What This Does

- ✅ **Single Container**: Frontend + Backend + Nginx
- ✅ **Auto Port**: Adapts to Render's dynamic PORT
- ✅ **Health Checks**: Built-in monitoring
- ✅ **Production Ready**: Security headers, compression, caching

## Your App URL
After deployment: `https://your-service-name.onrender.com`

## Test
```bash
curl https://your-service-name.onrender.com/api/health
```

That's it! 🎉