#!/bin/bash

# Build script for Packet Simulator

echo "🚀 Building Packet Simulator..."

# Use standard docker build (compatible with all Docker versions)
echo "📦 Building Docker image..."
docker build \
    --tag packet-simulator:latest \
    --tag packet-simulator:$(date +%Y%m%d-%H%M%S) \
    .

BUILD_EXIT_CODE=$?

if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo "✅ Docker image built successfully!"
    echo ""
    echo "🎯 To run the application:"
    echo "   ./run.sh"
    echo "   OR: docker run -p 8080:8080 packet-simulator"
    echo ""
    echo "🌐 Then open: http://localhost:8080"
    echo ""
    echo "📊 Image info:"
    docker images packet-simulator:latest
    echo ""
    echo "🔍 All packet-simulator images:"
    docker images packet-simulator --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
    echo ""
    echo "💡 To enable BuildKit in future (optional):"
    echo "   Install Docker Desktop or run: docker buildx install"
else
    echo "❌ Docker build failed!"
    echo ""
    echo "🔧 Troubleshooting tips:"
    echo "   1. Check Docker is running: docker --version"
    echo "   2. Free up space: docker system prune"
    echo "   3. Check logs above for specific errors"
    exit 1
fi