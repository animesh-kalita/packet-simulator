#!/bin/bash

# Run script for Packet Simulator

echo "🚀 Starting Packet Simulator..."

# Check if image exists
if [[ "$(docker images -q packet-simulator 2> /dev/null)" == "" ]]; then
    echo "📦 Image not found. Building first..."
    ./build.sh
fi

# Stop existing container if running
echo "🛑 Stopping existing container..."
docker stop packet-simulator 2>/dev/null || true
docker rm packet-simulator 2>/dev/null || true

# Run the container
echo "▶️  Starting new container..."
docker run -d \
    --name packet-simulator \
    -p 8080:8080 \
    -v $(pwd)/logs:/app/logs \
    -v $(pwd)/config:/app/config \
    packet-simulator

if [ $? -eq 0 ]; then
    echo "✅ Packet Simulator is running!"
    echo ""
    echo "🌐 Access the application at: http://localhost:8080"
    echo "📊 View logs with: docker logs -f packet-simulator"
    echo "🛑 Stop with: docker stop packet-simulator"
else
    echo "❌ Failed to start container!"
    exit 1
fi