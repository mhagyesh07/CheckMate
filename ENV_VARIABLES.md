# Environment Variables Guide

## Backend Environment Variables

### Development (.env)
```bash
# Database
MONGODB_URI=mongodb+srv://Bhagyesh:CiGj8XmoKscMgiqU@cluster2.huaiu3c.mongodb.net/chess_game?retryWrites=true&w=majority&appName=Cluster2

# JWT Configuration
JWT_SECRET=chess-game-super-secret-jwt-key-2024-production-ready-32-chars-minimum
JWT_REFRESH_SECRET=chess-game-refresh-secret-different-from-main-jwt-secret-2024-prod
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
NODE_ENV=development
PORT=3000

# CORS Configuration
CORS_ORIGIN=http://localhost:3001

# Logging
LOG_LEVEL=info

# Redis (optional)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password
```

### Production (Render)
```bash
# Database
MONGODB_URI=mongodb+srv://Bhagyesh:CiGj8XmoKscMgiqU@cluster2.huaiu3c.mongodb.net/chess_game?retryWrites=true&w=majority&appName=Cluster2

# JWT Configuration
JWT_SECRET=chess-game-super-secret-jwt-key-2024-production-ready-32-chars-minimum
JWT_REFRESH_SECRET=chess-game-refresh-secret-different-from-main-jwt-secret-2024-prod
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
NODE_ENV=production
PORT=10000

# CORS Configuration (update with your actual Vercel URL)
CORS_ORIGIN=https://your-chess-game.vercel.app

# Logging
LOG_LEVEL=info
```

## Frontend Environment Variables

### Development (client/.env)
```bash
# Development Configuration
PORT=3001
BROWSER=none

# API Configuration
REACT_APP_API_URL=http://localhost:3000
REACT_APP_SOCKET_URL=http://localhost:3000

# Environment
REACT_APP_ENV=development
```

### Production (Vercel)
```bash
# API Configuration (update with your actual Render URL)
REACT_APP_API_URL=https://your-chess-backend.onrender.com
REACT_APP_SOCKET_URL=https://your-chess-backend.onrender.com

# Environment
REACT_APP_ENV=production
```

## Security Notes

### JWT Secrets
- **JWT_SECRET**: Used for signing access tokens (24h expiry)
- **JWT_REFRESH_SECRET**: Used for signing refresh tokens (7d expiry)
- Both should be different and at least 32 characters long
- Current secrets are production-ready but you can generate new ones if needed

### Database
- Your MongoDB URI is already configured with your cluster
- Make sure the database name is `chess_game` for consistency

### CORS
- Development: `http://localhost:3001` (React dev server)
- Production: Update with your actual Vercel app URL

## How to Generate New JWT Secrets (Optional)

If you want to generate new JWT secrets, you can use:

```bash
# In Node.js console
require('crypto').randomBytes(64).toString('hex')
```

Or online tools like:
- https://generate-secret.vercel.app/64
- https://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx

## Deployment URLs to Update

After deployment, update these:

1. **Render Backend Environment**:
   - `CORS_ORIGIN=https://your-actual-vercel-url.vercel.app`

2. **Vercel Frontend Environment**:
   - `REACT_APP_API_URL=https://your-actual-render-url.onrender.com`
   - `REACT_APP_SOCKET_URL=https://your-actual-render-url.onrender.com`

## Testing Environment Variables

### Backend Test
```bash
curl https://your-render-url.onrender.com/api/health
```

### Frontend Test
- Open browser console
- Check `process.env.REACT_APP_API_URL`
- Verify API calls are going to correct URL

## Common Issues

1. **CORS Errors**: Make sure `CORS_ORIGIN` exactly matches your frontend URL
2. **API Not Found**: Verify `REACT_APP_API_URL` is correct
3. **Socket Connection Failed**: Check `REACT_APP_SOCKET_URL` matches backend
4. **JWT Errors**: Ensure both JWT secrets are set and different