# Production Deployment Checklist

## Pre-Deployment Checklist

### Security
- [ ] Strong JWT secrets generated (32+ characters)
- [ ] MongoDB connection string secured
- [ ] No sensitive data in environment files committed to git
- [ ] CORS configured for production domains only
- [ ] Rate limiting enabled
- [ ] Security headers configured (helmet.js)
- [ ] HTTPS enforced

### Environment Configuration
- [ ] `.env.example` updated with all required variables
- [ ] Production environment variables documented
- [ ] Development vs production configurations separated
- [ ] API URLs configured for production

### Code Quality
- [ ] All console.logs reviewed (keep only necessary ones)
- [ ] Error handling implemented
- [ ] Input validation in place
- [ ] No hardcoded URLs or credentials
- [ ] Dependencies updated and secure

### Performance
- [ ] Compression enabled
- [ ] Static asset caching configured
- [ ] Database indexes optimized
- [ ] Connection pooling configured
- [ ] Memory limits set

## Backend Deployment (Render)

### Setup
- [ ] Repository connected to Render
- [ ] Build command: `npm install`
- [ ] Start command: `npm start`
- [ ] Node.js version specified (18+)

### Environment Variables
- [ ] `NODE_ENV=production`
- [ ] `PORT=10000`
- [ ] `MONGODB_URI` (with proper credentials)
- [ ] `JWT_SECRET` (strong, unique)
- [ ] `JWT_REFRESH_SECRET` (strong, unique, different from JWT_SECRET)
- [ ] `JWT_EXPIRES_IN=24h`
- [ ] `JWT_REFRESH_EXPIRES_IN=7d`
- [ ] `CORS_ORIGIN` (Vercel app URL)
- [ ] `LOG_LEVEL=info`

### Verification
- [ ] Backend deploys successfully
- [ ] Health check endpoint responds
- [ ] API endpoints accessible
- [ ] Database connection working
- [ ] Logs are being generated

## Frontend Deployment (Vercel)

### Setup
- [ ] Repository connected to Vercel
- [ ] Root directory set to `client`
- [ ] Build command: `npm run build`
- [ ] Output directory: `build`

### Environment Variables
- [ ] `REACT_APP_API_URL` (Render backend URL)
- [ ] `REACT_APP_SOCKET_URL` (Render backend URL)
- [ ] `REACT_APP_ENV=production`

### Verification
- [ ] Frontend builds successfully
- [ ] App loads in browser
- [ ] API calls work
- [ ] Socket connection established
- [ ] Routing works correctly

## Post-Deployment Testing

### Authentication
- [ ] User registration works
- [ ] User login works
- [ ] JWT tokens are valid
- [ ] Protected routes work
- [ ] Logout functionality works

### Game Functionality
- [ ] Game creation works
- [ ] Players can join games
- [ ] Real-time moves work
- [ ] Game state persists
- [ ] Multiple games can run simultaneously

### Performance
- [ ] Page load times acceptable
- [ ] API response times good
- [ ] Socket connections stable
- [ ] No memory leaks
- [ ] Error handling works

### Cross-Browser Testing
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers

## Monitoring Setup

### Logging
- [ ] Application logs configured
- [ ] Error logs monitored
- [ ] Access logs enabled
- [ ] Log rotation configured

### Alerts
- [ ] Uptime monitoring
- [ ] Error rate monitoring
- [ ] Performance monitoring
- [ ] Database monitoring

### Analytics (Optional)
- [ ] User analytics
- [ ] Performance analytics
- [ ] Error tracking
- [ ] Usage metrics

## Security Verification

### Headers
- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] CORS properly configured
- [ ] Content Security Policy

### Authentication
- [ ] JWT tokens secure
- [ ] Password hashing working
- [ ] Session management secure
- [ ] Rate limiting active

### Data Protection
- [ ] Input sanitization
- [ ] SQL injection protection
- [ ] XSS protection
- [ ] CSRF protection

## Final Steps

- [ ] Update documentation with production URLs
- [ ] Share access credentials with team
- [ ] Set up monitoring dashboards
- [ ] Create backup procedures
- [ ] Document rollback procedures
- [ ] Test disaster recovery

## URLs to Update After Deployment

1. **In Render (Backend)**:
   - Update `CORS_ORIGIN` with actual Vercel URL

2. **In Vercel (Frontend)**:
   - Update `REACT_APP_API_URL` with actual Render URL
   - Update `REACT_APP_SOCKET_URL` with actual Render URL

3. **In Documentation**:
   - Update README.md with production URLs
   - Update API documentation
   - Update user guides

## Common Issues and Solutions

### CORS Errors
- Verify `CORS_ORIGIN` matches exactly (including https://)
- Check for trailing slashes
- Ensure environment variable is set correctly

### Socket Connection Issues
- Verify `REACT_APP_SOCKET_URL` is correct
- Check WebSocket support on hosting platform
- Verify authentication token is being sent

### Build Failures
- Check Node.js version compatibility
- Verify all dependencies are in package.json
- Check for syntax errors in code

### Database Connection Issues
- Verify MongoDB URI format
- Check network access permissions
- Verify credentials are correct