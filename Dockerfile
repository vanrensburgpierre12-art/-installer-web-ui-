# Multi-stage build for the React frontend
FROM node:18-alpine as frontend-build

WORKDIR /app/client

# Copy package files
COPY client/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY client/ ./

# Build the React app
RUN npm run build

# Backend stage
FROM node:18-alpine as backend

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache postgresql-client

# Copy package files
COPY server/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy server source code
COPY server/ ./

# Copy built frontend
COPY --from=frontend-build /app/client/build ./public

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]