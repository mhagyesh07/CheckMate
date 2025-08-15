# Production-ready single container for Render deployment
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache nginx supervisor curl gettext && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy backend files first
COPY package*.json ./
RUN npm ci --only=production

# Copy client package files and install deps
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci

# Copy all source code
WORKDIR /app
COPY . .

# Build React app
WORKDIR /app/client
RUN npm run build

# Move built files to nginx html directory
RUN mkdir -p /var/www/html && cp -r build/* /var/www/html/

# Back to app root
WORKDIR /app

# Create nginx configuration template
RUN printf 'server {\n\
    listen ${NGINX_PORT};\n\
    server_name localhost;\n\
    root /var/www/html;\n\
    index index.html;\n\
\n\
    location /api/ {\n\
        proxy_pass http://127.0.0.1:3001;\n\
        proxy_http_version 1.1;\n\
        proxy_set_header Upgrade $http_upgrade;\n\
        proxy_set_header Connection "upgrade";\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n\
        proxy_set_header X-Forwarded-Proto $scheme;\n\
    }\n\
\n\
    location /socket.io/ {\n\
        proxy_pass http://127.0.0.1:3001;\n\
        proxy_http_version 1.1;\n\
        proxy_set_header Upgrade $http_upgrade;\n\
        proxy_set_header Connection "upgrade";\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n\
        proxy_set_header X-Forwarded-Proto $scheme;\n\
    }\n\
\n\
    location / {\n\
        try_files $uri /index.html;\n\
    }\n\
\n\
    location /health {\n\
        return 200 "healthy\\n";\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf.template

# Supervisor config
RUN printf '[supervisord]\n\
nodaemon=true\n\
\n\
[program:nginx]\n\
command=nginx -g "daemon off;"\n\
autostart=true\n\
autorestart=true\n\
\n\
[program:nodejs]\n\
command=node app.js\n\
directory=/app\n\
autostart=true\n\
autorestart=true\n' > /etc/supervisor/conf.d/supervisord.conf

# Start script
RUN printf '#!/bin/sh\n\
RENDER_PORT=${PORT:-10000}\n\
export BACKEND_PORT=3001\n\
export NODE_ENV=production\n\
envsubst "${NGINX_PORT}" < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf\n\
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf\n' > /start.sh \
    && chmod +x /start.sh

# Expose a default port (Render overrides it)
EXPOSE 10000

# Start
CMD ["/start.sh"]
