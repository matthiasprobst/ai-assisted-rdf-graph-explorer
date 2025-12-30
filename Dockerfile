# Multi-stage Dockerfile for AI-Assisted RDF Graph Explorer
# Build stage: Uses Node.js to build the React application
FROM node:22-alpine AS builder

# Set environment to English for consistent error messages
ENV LANG=en_US.UTF-8
ENV LC_ALL=en_US.UTF-8

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./

# Install all dependencies (including dev dependencies needed for build)
# We use npm install instead of npm ci since package-lock.json may not exist
RUN npm install

# Copy source code
COPY . .

# Verify Vite installation and add node_modules/.bin to PATH
ENV PATH="/app/node_modules/.bin:${PATH}"

# Build the application with explicit npx for reliability
RUN npx vite build

# Clean up development dependencies to reduce layer size (optional but recommended)
RUN npm prune --production

# Production stage: Use nginx to serve static files
FROM nginx:alpine AS production

# Install curl for health check
RUN apk add --no-cache curl

# Copy built application to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf



# Verify nginx configuration syntax
RUN nginx -t

# Create environment variable substitution script
COPY env-substitution.sh /docker-entrypoint.d/10-env-substitution.sh
RUN chmod +x /docker-entrypoint.d/10-env-substitution.sh

# Expose port 80
EXPOSE 80

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]