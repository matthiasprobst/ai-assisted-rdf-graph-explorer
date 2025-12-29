# Multi-stage Dockerfile for AI-Assisted RDF Graph Explorer
# Build stage: Uses Node.js to build the React application
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage: Use nginx to serve static files
FROM nginx:alpine AS production

# Copy built application to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create environment variable substitution script
COPY env-substitution.sh /docker-entrypoint.d/10-env-substitution.sh
RUN chmod +x /docker-entrypoint.d/10-env-substitution.sh

# Expose port 80
EXPOSE 80

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]