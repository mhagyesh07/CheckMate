# Multi-stage build for optimized production image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install system dependencies for building
RUN apk add --no-cache python3 make g++

# Copy package files for backend
COPY package*.json ./
RUN npm ci

# Copy client package files
COPY client/package*.json ./client/
WORKDIR /app/client
RUN npm ci

# Copy all source code
WORKDIR /app
COPY . .

# Build the React frontend
WORKDIR /app/client
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install system dependencies
RUN apk add --no-cache \
    nginx \
    supervisor \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app .

# Copy built React app to nginx directory
RUN mkdir -p /var/www/html
COPY --from=builder /app/client/build /var/www/html

# Create nginx configuration
RUN mkdir -p /etc/nginx/conf.d
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name localhost;
    root /var/www/html;
    index index.html;

    # Serve static files
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API routes to backend
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Serve React app for all other routes
    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

# Create supervisor configuration
COPY <<EOF /etc/supervisor/conf.d/supervisord.conf
[supervisord]
nodaemon=true
user=root
logfile=/var/log/supervisor/supervisord.log
pidfile=/var/run/supervisord.pid

[program:nginx]
command=nginx -g "daemon off;"
autostart=true
autorestart=true
stderr_logfile=/var/log/nginx/error.log
stdout_logfile=/var/log/nginx/access.log

[program:nodejs]
command=node app.js
directory=/app
autostart=true
autorestart=true
environment=NODE_ENV=production,BACKEND_PORT=3001
stderr_logfile=/var/log/nodejs/error.log
stdout_logfile=/var/log/nodejs/access.log
user=nodejs
EOF

# Create log directories
RUN mkdir -p /var/log/nginx /var/log/nodejs /var/log/supervisor /app/logs

# Create non-root user for Node.js
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set proper permissions
RUN chown -R nodejs:nodejs /app /var/log/nodejs
RUN chown -R nginx:nginx /var/www/html /var/log/nginx

# Create startup script
COPY <<EOF /start.sh
#!/bin/sh
# Set backend port for internal communication
export BACKEND_PORT=3001
export PORT=\${PORT:-80}

# Update nginx configuration with correct port
sed -i "s/listen 80;/listen \$PORT;/" /etc/nginx/conf.d/default.conf

# Start supervisor which manages nginx and nodejs
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
EOF

RUN chmod +x /start.sh

# Expose the port
EXPOSE \$PORT

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:\${PORT:-80}/api/health || exit 1

# Start both services
CMD ["/start.sh"]