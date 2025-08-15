# Production-ready single container for Render deployment
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    nginx \
    supervisor \
    curl \
    gettext \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy ALL source code first
COPY . .

# Install backend dependencies
RUN npm ci --only=production

# Build client explicitly without using npm scripts
WORKDIR /app/client
RUN npm ci
RUN npx react-scripts build

# Go back to app root
WORKDIR /app

# Create necessary directories
RUN mkdir -p /var/www/html /var/log/nginx /var/log/nodejs /var/log/supervisor /app/logs

# Copy built React app to nginx directory
RUN cp -r client/build/* /var/www/html/

# Create nginx configuration template using printf
RUN printf 'server {\n\
    listen ${NGINX_PORT};\n\
    server_name localhost;\n\
    root /var/www/html;\n\
    index index.html;\n\
\n\
    # Security headers\n\
    add_header X-Frame-Options DENY;\n\
    add_header X-Content-Type-Options nosniff;\n\
    add_header X-XSS-Protection "1; mode=block";\n\
\n\
    # Gzip compression\n\
    gzip on;\n\
    gzip_vary on;\n\
    gzip_min_length 1024;\n\
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;\n\
\n\
    # Static files with long-term caching\n\
    location /static/ {\n\
        expires 1y;\n\
        add_header Cache-Control "public, immutable";\n\
        try_files $uri =404;\n\
    }\n\
\n\
    # API routes to backend\n\
    location /api/ {\n\
        proxy_pass http://127.0.0.1:3001;\n\
        proxy_http_version 1.1;\n\
        proxy_set_header Upgrade $http_upgrade;\n\
        proxy_set_header Connection '"'"'upgrade'"'"';\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n\
        proxy_set_header X-Forwarded-Proto $scheme;\n\
        proxy_cache_bypass $http_upgrade;\n\
        proxy_read_timeout 86400;\n\
        proxy_connect_timeout 60s;\n\
        proxy_send_timeout 60s;\n\
    }\n\
\n\
    # Socket.IO WebSocket connections\n\
    location /socket.io/ {\n\
        proxy_pass http://127.0.0.1:3001;\n\
        proxy_http_version 1.1;\n\
        proxy_set_header Upgrade $http_upgrade;\n\
        proxy_set_header Connection "upgrade";\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n\
        proxy_set_header X-Forwarded-Proto $scheme;\n\
        proxy_read_timeout 86400;\n\
        proxy_connect_timeout 60s;\n\
        proxy_send_timeout 60s;\n\
    }\n\
\n\
    # React app - serve index.html for all other routes (SPA routing)\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
        add_header Cache-Control "no-cache, no-store, must-revalidate";\n\
        add_header Pragma "no-cache";\n\
        add_header Expires "0";\n\
    }\n\
\n\
    # Health check endpoint\n\
    location /health {\n\
        access_log off;\n\
        return 200 "healthy\\n";\n\
        add_header Content-Type text/plain;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf.template

# Create supervisor configuration using printf
RUN printf '[supervisord]\n\
nodaemon=true\n\
user=root\n\
logfile=/var/log/supervisor/supervisord.log\n\
pidfile=/var/run/supervisord.pid\n\
childlogdir=/var/log/supervisor\n\
loglevel=info\n\
\n\
[program:nginx]\n\
command=nginx -g "daemon off;"\n\
autostart=true\n\
autorestart=true\n\
priority=10\n\
stderr_logfile=/var/log/nginx/error.log\n\
stdout_logfile=/var/log/nginx/access.log\n\
stderr_logfile_maxbytes=10MB\n\
stdout_logfile_maxbytes=10MB\n\
stderr_logfile_backups=3\n\
stdout_logfile_backups=3\n\
\n\
[program:nodejs]\n\
command=node app.js\n\
directory=/app\n\
autostart=true\n\
autorestart=true\n\
priority=20\n\
environment=NODE_ENV=production,BACKEND_PORT=3001\n\
stderr_logfile=/var/log/nodejs/error.log\n\
stdout_logfile=/var/log/nodejs/access.log\n\
stderr_logfile_maxbytes=10MB\n\
stdout_logfile_maxbytes=10MB\n\
stderr_logfile_backups=3\n\
stdout_logfile_backups=3\n\
user=root\n\
stopwaitsecs=10\n' > /etc/supervisor/conf.d/supervisord.conf

# Create the startup script
RUN printf '#!/bin/sh\n\
\n\
# Get the port from Render'\''s environment variable\n\
RENDER_PORT=${PORT:-10000}\n\
BACKEND_PORT=3001\n\
\n\
echo "=== Chess Game Container Starting ==="\n\
echo "Render assigned port: $RENDER_PORT"\n\
echo "Backend internal port: $BACKEND_PORT"\n\
echo "Node.js version: $(node --version)"\n\
echo "Nginx version: $(nginx -v 2>&1)"\n\
\n\
# Set environment variables for the backend\n\
export PORT=$BACKEND_PORT\n\
export BACKEND_PORT=$BACKEND_PORT\n\
export NODE_ENV=${NODE_ENV:-production}\n\
\n\
# Generate nginx config from template with the correct port\n\
export NGINX_PORT=$RENDER_PORT\n\
envsubst '\''${NGINX_PORT}'\'' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf\n\
\n\
# Test nginx configuration\n\
nginx -t\n\
if [ $? -ne 0 ]; then\n\
    echo "ERROR: Nginx configuration test failed"\n\
    exit 1\n\
fi\n\
\n\
echo "Nginx will listen on port: $RENDER_PORT"\n\
echo "Backend will run on port: $BACKEND_PORT"\n\
echo "Starting services with supervisor..."\n\
\n\
# Start supervisor which manages both nginx and nodejs\n\
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf\n' > /start.sh

# Create health check script
RUN printf '#!/bin/sh\n\
RENDER_PORT=${PORT:-10000}\n\
\n\
# Check if nginx is responding\n\
if ! curl -f -s http://localhost:$RENDER_PORT/health > /dev/null; then\n\
    echo "Health check failed: nginx not responding on port $RENDER_PORT"\n\
    exit 1\n\
fi\n\
\n\
# Check if backend API is responding\n\
if ! curl -f -s http://localhost:$RENDER_PORT/api/health > /dev/null; then\n\
    echo "Health check failed: backend API not responding"\n\
    exit 1\n\
fi\n\
\n\
echo "Health check passed"\n\
exit 0\n' > /health.sh

RUN chmod +x /start.sh /health.sh

# Create non-root user for security (though supervisor runs as root for nginx)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set proper permissions
RUN chown -R nodejs:nodejs /app/logs
RUN chmod -R 755 /var/log/nginx /var/log/nodejs /var/log/supervisor

# Expose the port (Render will override this with PORT env var)
EXPOSE $PORT

# Health check for Docker
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD /health.sh

# Start the application
CMD ["/start.sh"]