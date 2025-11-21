#!/bin/bash

# Local development test script

echo "🧪 Testing Packet Simulator locally..."

# Install dependencies
echo "📦 Installing dependencies..."
npm run install:all

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies!"
    exit 1
fi

# Build frontend
echo "🏗️  Building frontend..."
cd frontend && npm run build && cd ..

if [ $? -ne 0 ]; then
    echo "❌ Failed to build frontend!"
    exit 1
fi

# Start backend
echo "🚀 Starting backend server..."
cd backend && npm start &
BACKEND_PID=$!

# Wait for server to start
sleep 3

# Test health endpoint
echo "🔍 Testing health endpoint..."
curl -f http://localhost:8080/api/health > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Server is running successfully!"
    echo "🌐 Open http://localhost:8080 in your browser"
    echo "🛑 Press Ctrl+C to stop"
    
    # Wait for user to stop
    wait $BACKEND_PID
else
    echo "❌ Server health check failed!"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi