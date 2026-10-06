# Multi-stage build for Astro Static Site
FROM node:24-alpine AS builder

WORKDIR /app

# Copy dependency specifications
COPY package.json package-lock.json* ./

RUN npm ci

# Copy application source
COPY . .

# Build static output to /app/dist
RUN npm run build

# Production web server using lightweight Nginx
FROM nginx:alpine AS runner

# Copy custom Nginx configuration
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static site
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose internal port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
