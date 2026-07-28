# Multi-stage Dockerfile for Acquisitions Node.js application

# 1. Base stage - install dependencies and copy codebase
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Copy package management files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy application source files
COPY . .

# Create non-root system user and group for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

# Health check configuration
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => { process.exit(1) })"

# 2. Development stage - includes devDependencies & live reloader
FROM base AS development
USER root
RUN npm ci && npm cache clean --force
USER nodejs
CMD ["npm", "run", "dev"]

# 3. Production stage - optimized execution environment
FROM base AS production
CMD ["npm", "start"]
