# Deployment Guide

This guide covers deploying the Chess Game application with the frontend on Vercel and backend on Render.

## Backend Deployment (Render)

### 1. Prepare Your Repository

1. Push your code to GitHub
2. Make sure your `package.json` has the correct start script:
   ```json
   {
     "scripts": {
       "start": "node app.js"
     }
   }
   ```

### 2. Deploy to Render

1. Go to [Render.com](https://render.com) and sign up/login
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `chess-game-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Starter` (free tier)

### 3. Set Environment Variables

In Render dashboard, go to Environment tab and add:

```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chess_game?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random-at-least-32-characters
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-here-make-it-different-and-long
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=https://your-vercel-app.vercel.app
LOG_LEVEL=info
```

**Important**: 
- Replace `MONGODB_URI` with your actual MongoDB connection string
- Generate strong, unique values for `JWT_SECRET` and `JWT_REFRESH_SECRET`
- Update `CORS_ORIGIN` with your actual Vercel app URL

### 4. Deploy

Click "Create Web Service" and wait for deployment to complete.

Your backend will be available at: `https://your-app-name.onrender.com`

## Frontend Deployment (Vercel)

### 1. Prepare the Client

1. Navigate to the `client` directory
2. Create a `.env.production` file:
   ```
   REACT_APP_API_URL=https://your-render-app.onrender.com
   REACT_APP_SOCKET_URL=https://your-render-app.onrender.com
   REACT_APP_ENV=production
   ```

### 2. Deploy to Vercel

#### Option A: Vercel CLI (Recommended)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Navigate to client directory:
   ```bash
   cd client
   ```

3. Login to Vercel:
   ```bash
   vercel login
   ```

4. Deploy:
   ```bash
   vercel --prod
   ```

#### Option B: Vercel Dashboard

1. Go to [Vercel.com](https://vercel.com) and sign up/login
2. Click "New Project"
3. Import your GitHub repository
4. Set the root directory to `client`
5. Configure environment variables:
   - `REACT_APP_API_URL`: `https://your-render-app.onrender.com`
   - `REACT_APP_SOCKET_URL`: `https://your-render-app.onrender.com`
   - `REACT_APP_ENV`: `production`

### 3. Update CORS Settings

After deploying to Vercel, update the `CORS_ORIGIN` environment variable in Render with your actual Vercel URL.

## Post-Deployment Steps

### 1. Update Environment Variables

1. **Backend (Render)**: Update `CORS_ORIGIN` with your Vercel app URL
2. **Frontend (Vercel)**: Update API URLs with your Render app URL

### 2. Test the Deployment

1. Visit your Vercel app URL
2. Try registering a new user
3. Test login functionality
4. Test game creation and joining
5. Test real-time gameplay

### 3. Monitor Logs

- **Render**: Check logs in the Render dashboard
- **Vercel**: Check function logs in the Vercel dashboard

## Environment Variables Reference

### Backend (Render)
```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=https://your-vercel-app.vercel.app
LOG_LEVEL=info
```

### Frontend (Vercel)
```
REACT_APP_API_URL=https://your-render-app.onrender.com
REACT_APP_SOCKET_URL=https://your-render-app.onrender.com
REACT_APP_ENV=production
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure `CORS_ORIGIN` in backend matches your Vercel URL
2. **Socket Connection Issues**: Ensure `REACT_APP_SOCKET_URL` points to your Render backend
3. **API Errors**: Check that `REACT_APP_API_URL` is correct
4. **Build Failures**: Check build logs for missing dependencies or syntax errors

### Debugging

1. Check browser console for frontend errors
2. Check Render logs for backend errors
3. Verify all environment variables are set correctly
4. Test API endpoints directly using curl or Postman

## Security Considerations

1. **JWT Secrets**: Use strong, unique secrets for production
2. **CORS**: Only allow your frontend domain
3. **HTTPS**: Both services should use HTTPS in production
4. **Environment Variables**: Never commit secrets to version control
5. **Rate Limiting**: The app includes rate limiting for API endpoints

## Performance Optimization

1. **Caching**: Static assets are cached with appropriate headers
2. **Compression**: Backend uses gzip compression
3. **Connection Pooling**: MongoDB connection pooling is enabled
4. **Socket.IO**: Configured for production with proper transports

## Monitoring

Consider adding:
1. **Error Tracking**: Sentry or similar service
2. **Analytics**: Google Analytics or similar
3. **Uptime Monitoring**: UptimeRobot or similar
4. **Performance Monitoring**: New Relic or similar