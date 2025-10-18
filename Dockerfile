# Simple Dockerfile for learning environment variables
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files from app folder
COPY app/package*.json ./

# Install dependencies
RUN npm install

# Copy application code from app folder
COPY app/ ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of files
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port (can be overridden by environment variable)
EXPOSE ${PORT:-3000}

# Start the application
CMD ["node", "server.js"]
