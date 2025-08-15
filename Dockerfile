# Production-ready single container for Render deployment
FROM node:18-alpine AS builder

# Install system dependencies needed for building
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy root package files
COPY package*.json ./

# Install backend dependencies
RUN npm ci --only=production

# Copy client package files
COPY client/package*.json ./client/

# Install client dependencies
WORKDIR /app/client
RUN npm ci

# Copy client source code
COPY client/ ./

# Build the React app
RUN npm run build

# Production stage
FROM node:18-alpine

# Install runtime dependencies
RUN apk add --no-cache \
    nginx \
    supervisor \
    curl \
    gettext \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy backend dependencies from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Copy built React app from builder
COPY --from=builder /app/client/build ./client/build

# Copy application source (excluding client source files)
COPY . .
RUN rm -rf client/src client/public client/node_modules

# Create necessary directories
RUN mkdir -p /var/www/html /var/log/nginx /var/log/nodejs /var/log/supervisor /app/logs

# Copy built React app to nginx directory
RUN cp -r client/build/* /var/www/html/

# Copy configuration files
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY start.sh /start.sh
COPY health.sh /health.sh

# Make scripts executable
RUN chmod +x /start.sh /health.sh

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set proper permissions
RUN chown -R nodejs:nodejs /app/logs
RUN chmod -R 755 /var/log/nginx /var/log/nodejs /var/log/supervisor

# Expose the port
EXPOSE $PORT

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD /health.sh

# Start the application
CMD ["/start.sh"]