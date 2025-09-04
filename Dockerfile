# Multi-stage build for the React frontend
FROM node:18-alpine as frontend-build

# Set working directory
WORKDIR /app/client

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy package files first for better caching
COPY client/package*.json ./

# Install dependencies with clean cache
RUN npm ci --only=production --no-audit --no-fund && \
    npm cache clean --force

# Copy source code
COPY client/ ./

# Build the React app
RUN npm run build && \
    chown -R nextjs:nodejs /app/client

# Backend stage
FROM node:18-alpine as backend

# Set working directory
WORKDIR /app

# Update package index and install system dependencies
RUN apk update && \
    apk add --no-cache postgresql-client dumb-init || \
    (echo "Primary repo failed, trying community repo..." && \
     apk add --no-cache --repository=http://dl-cdn.alpinelinux.org/alpine/v3.18/community postgresql-client dumb-init) && \
    addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs

# Copy package files first for better caching
COPY server/package*.json ./

# Install dependencies with clean cache
RUN npm ci --only=production --no-audit --no-fund && \
    npm cache clean --force

# Copy server source code
COPY server/ ./

# Copy built frontend from frontend stage
COPY --from=frontend-build /app/client/build ./public

# Create necessary directories and set permissions
RUN mkdir -p uploads logs && \
    chown -R appuser:nodejs /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["npm", "start"]