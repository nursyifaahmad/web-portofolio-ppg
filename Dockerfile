# Multi-stage build for Astro Node Standalone
FROM node:24-alpine AS builder

WORKDIR /app

# Copy dependency specifications
COPY package.json package-lock.json* ./

RUN npm ci

# Copy application source
COPY . .

# Build application (server + prerendered static assets)
RUN npm run build

# Production runner with lightweight Node.js 24 runtime
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=80

# Install production dependencies only
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy compiled server & client assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/src/data ./src/data

# Ensure data and uploads directories exist
RUN mkdir -p /app/data /app/public/uploads/galeri /app/public/uploads/inovasi

# Expose internal port 80
EXPOSE 80

CMD ["node", "./dist/server/entry.mjs"]
