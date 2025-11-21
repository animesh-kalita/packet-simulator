# syntax=docker/dockerfile:1
# Multi-stage build for React frontend and Node.js backend using latest Node.js 22

# Stage 1: Build React frontend
FROM node:22-slim AS frontend-builder

# Install latest npm
RUN npm install -g npm@latest

WORKDIR /app/frontend

# Copy package files and install dependencies
COPY frontend/package*.json ./
RUN npm ci --no-audit

# Copy source and build
COPY frontend/ ./
RUN npm run build

# Stage 2: Setup Node.js backend
FROM node:22-alpine AS backend

# Install latest npm
RUN npm install -g npm@latest

WORKDIR /app

# Copy backend package files and install production dependencies
COPY backend/package*.json ./
RUN npm ci --omit=dev --no-audit

# Copy backend source
COPY backend/ ./

# Copy built frontend from previous stage (fix path issue)
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create necessary directories with proper permissions
RUN mkdir -p config logs uploads temp && \
    chown -R node:node /app

# Switch to non-root user for security
USER node                                                                                                       
ENV NODE_ENV=production                                                                                         
# Expose port                                                                                                   
EXPOSE 8080
# Health check with improved error handling
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "const http=require('http');const req=http.get('http://localhost:8080/api/health',(res)=>{process.exit(res.statusCode===200?0:1)});req.on('error',()=>process.exit(1));req.setTimeout(5000,()=>process.exit(1))"

# Start the application
CMD ["npm", "start"]