# Packet Simulator

A comprehensive web-based TCP/HTTP packet simulation tool with real-time monitoring, logging capabilities, and Docker deployment. This application allows you to simulate device communications, test network protocols, and monitor packet transmission in real-time through a modern web interface.

## 📋 Table of Contents

- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Quick Start Guide](#-quick-start-guide)
- [Installation Methods](#-installation-methods)
- [Usage Guide](#-usage-guide)
- [Configuration](#-configuration)
- [API Documentation](#-api-documentation)
- [File Formats](#-file-formats)
- [Docker Deployment](#-docker-deployment)
- [Development Setup](#-development-setup)
- [Project Structure](#-project-structure)
- [Troubleshooting](#-troubleshooting)
- [Advanced Usage](#-advanced-usage)
- [Contributing](#-contributing)

## 🚀 Features

### Core Functionality
- **Dual Protocol Support**: TCP and HTTP packet transmission
- **Flexible Input Methods**: Direct text input or file upload (.txt, .js)
- **Real-time Monitoring**: Live logs with Server-Sent Events (SSE)
- **Auto IP Detection**: Automatically detects and suggests device IP addresses
- **Configurable Intervals**: Set custom packet transmission intervals
- **Progress Tracking**: Real-time simulation progress with visual indicators

### User Interface
- **Modern Web UI**: Clean, responsive Material-UI interface
- **Live Log Streaming**: Real-time log updates without page refresh
- **Configuration Persistence**: Automatically saves and restores settings
- **Packet Preview**: Preview packets before starting simulation
- **Download Logs**: Export simulation logs as files

### Docker & Deployment
- **Single Container**: Complete application in one Docker image
- **Health Checks**: Built-in container health monitoring
- **Volume Persistence**: Persistent logs and configuration
- **Production Ready**: Optimized for production deployment

## 📋 Prerequisites

### System Requirements
- **Docker**: Version 20.0+ (recommended method)
- **Node.js**: Version 18+ (for local development)
- **npm**: Version 8+ (for local development)
- **Operating System**: Linux, macOS, or Windows with Docker support

### Network Requirements
- Port 8080 available (configurable)
- Network access to target TCP/HTTP endpoints
- Internet access for downloading dependencies (during build)

## 🎯 Quick Start Guide

### Method 1: One-Command Docker Setup (Recommended)

```bash
# Clone or download the project
git clone <your-repo-url>
cd packet-simulator

# Build and run with provided scripts
./build.sh    # Builds Docker image
./run.sh      # Runs the container with proper configuration
```

**Access the application**: http://localhost:8080

### Method 2: Docker Compose

```bash
# Start with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

### Method 3: Manual Docker Commands

```bash
# Build the image
docker build -t packet-simulator .

# Run the container
docker run -d \
  --name packet-simulator \
  -p 8080:8080 \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/config:/app/config \
  packet-simulator

# Access at http://localhost:8080
```

## 🛠 Installation Methods

### Option A: Production Docker Deployment

1. **Download the project files**
   ```bash
   # If using git
   git clone <repository-url>
   cd packet-simulator
   
   # Or download and extract ZIP file
   ```

2. **Build and deploy**
   ```bash
   # Make scripts executable
   chmod +x build.sh run.sh
   
   # Build Docker image
   ./build.sh
   
   # Deploy container
   ./run.sh
   ```

3. **Verify deployment**
   ```bash
   # Check container status
   docker ps | grep packet-simulator
   
   # Check logs
   docker logs packet-simulator
   
   # Test health endpoint
   curl http://localhost:8080/api/health
   ```

### Option B: Local Development Setup

1. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install all project dependencies
   npm run install:all
   ```

2. **Start development environment**
   ```bash
   # Start both frontend and backend in development mode
   npm run dev
   
   # Or start individually:
   # Backend only: cd backend && npm run dev
   # Frontend only: cd frontend && npm run dev
   ```

3. **Build for production**
   ```bash
   # Build frontend for production
   npm run build
   
   # Start production server
   npm start
   ```

### Option C: Manual Installation

1. **Backend setup**
   ```bash
   cd backend
   npm install
   npm start  # Starts on port 8080
   ```

2. **Frontend setup** (in new terminal)
   ```bash
   cd frontend
   npm install
   npm run build  # Build for production
   # Files will be served by backend
   ```

## 📖 Usage Guide

### Getting Started

1. **Access the Application**
   - Open http://localhost:8080 in your web browser
   - The interface has three main sections: Simulation, Logs, and Settings

2. **Basic TCP Simulation**
   ```bash
   # Example workflow:
   1. Select "TCP" protocol
   2. Host: 192.168.1.100 (auto-detected or manual)
   3. Port: 19999
   4. Interval: 5 seconds
   5. Add packets in text area or upload file
   6. Click "Start Simulation"
   ```

3. **Basic HTTP Simulation**
   ```bash
   # Example workflow:
   1. Select "HTTP" protocol
   2. URL: http://api.example.com/data
   3. Method: POST
   4. Headers: {"Content-Type": "application/json"}
   5. Add packets and start simulation
   ```

### TCP Protocol Configuration

**Host Configuration:**
- **Auto-Detection**: Application automatically detects your device IP
- **Manual Override**: Enter custom IP address or hostname
- **Localhost**: Use 127.0.0.1 for local testing

**Port Configuration:**
- Default: 19999 (from your reference code)
- Range: 1-65535
- Common ports: 80 (HTTP), 443 (HTTPS), 8080, 9999

**Line Delimiters:**
- `\r\n` (CRLF) - Windows/Network standard (default)
- `\n` (LF) - Unix/Linux standard
- None - Raw packet data without delimiters

**Example TCP Configuration:**
```
Protocol: TCP
Host: 192.168.1.100
Port: 19999
Delimiter: \r\n
Interval: 5 seconds
```

### HTTP Protocol Configuration

**URL Configuration:**
- Full URLs: `http://example.com/api/endpoint`
- HTTPS support: `https://secure-api.com/data`
- Local endpoints: `http://localhost:3000/test`

**HTTP Methods:**
- **GET**: Packets appended as query parameters (`?data=packet_content`)
- **POST**: Packets sent as request body

**Headers Configuration:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer your-token",
  "X-Device-ID": "device-123",
  "User-Agent": "PacketSimulator/1.0"
}
```

**Example HTTP Configuration:**
```
Protocol: HTTP
URL: http://api.tracker.com/packets
Method: POST
Headers: {"Authorization": "Bearer abc123"}
Interval: 3 seconds
```

### Packet Input Methods

#### Method 1: Text Input
```
# Enter packets directly in the text area, one per line:
$GPRMC,123519,A,4807.038,N,01131.000,E,022.4,084.4,230394,003.1,W*6A
device_id,7002238281,timestamp,20250121120000,lat,40.7128,lon,-74.0060
alert,overspeed,device_id,7002238281,speed,85,limit,80
```

#### Method 2: Text File Upload (.txt)
```
# Create a file named packets.txt:
packet1,data,values
packet2,more,data
packet3,final,packet
```

#### Method 3: JavaScript File Upload (.js)
```javascript
// Create a file named packets.js:
module.exports = [
  "$GPRMC,123519,A,4807.038,N,01131.000,E,022.4,084.4,230394,003.1,W*6A",
  "device_id,7002238281,status,online,battery,85",
  "loc,40.7128,-74.0060,25,20250121120000",
  "alert,geofence,device_id,7002238281,zone,restricted_area"
];
```

### Simulation Control

**Starting a Simulation:**
1. Configure protocol settings
2. Add packets via text or file
3. Click "Preview Packets" to verify (optional)
4. Click "Start Simulation"
5. Monitor progress in real-time

**Monitoring Progress:**
- Progress bar shows completion percentage
- Live logs display each packet transmission
- Packet counter shows current/total packets
- Status indicator shows simulation state

**Stopping a Simulation:**
- Click "Stop Simulation" button
- Simulation stops gracefully
- Partial progress is logged
- TCP connections are properly closed

### Log Management

**Real-time Logs:**
- Automatic log streaming via Server-Sent Events
- Color-coded log levels (INFO, ERROR, WARN)
- Timestamps for each log entry
- Auto-scroll to latest entries

**Log Operations:**
```bash
# Download logs
Click "Download" button in Logs panel

# Clear logs
Click "Clear" button to reset log history

# Refresh logs
Click "Refresh" to reload log history
```

**Log Format:**
```
[12:10:03] [INFO] Starting TCP simulation
[12:10:03] [INFO] Target: 192.168.1.100:19999
[12:10:03] [INFO] Packets: 10, Interval: 5s
[12:10:03] [TCP] Connected to 192.168.1.100:19999
[12:10:03] [TCP] Sent packet 1/10: $GPRMC,123519,A,4807.038...
[12:10:08] [TCP] Sent packet 2/10: device_id,7002238281...
```

## ⚙️ Configuration

### Application Settings

**Default TCP Settings:**
```json
{
  "protocol": "tcp",
  "host": "192.168.1.100",  // Auto-detected device IP
  "port": 19999,
  "delimiter": "\r\n",
  "interval": 5
}
```

**Default HTTP Settings:**
```json
{
  "protocol": "http",
  "url": "http://localhost:3000/api/test",
  "method": "POST",
  "headers": {},
  "interval": 5
}
```

### Persistent Configuration

Settings are automatically saved to:
- **Container**: `/app/config/config.json`
- **Host** (with volumes): `./config/config.json`

**Manual Configuration:**
```bash
# Edit configuration file directly
nano config/config.json

# Or use the Settings panel in the web interface
```

### Environment Variables

```bash
# Docker environment variables
NODE_ENV=production          # production/development
PORT=8080                   # Server port
LOG_LEVEL=info              # Logging level
```

## 🔌 API Documentation

### Health Check
```bash
GET /api/health
Response: {"status": "ok", "timestamp": "2025-01-21T12:00:00.000Z"}
```

### System Information
```bash
GET /api/system/info
Response: {
  "hostname": "server-name",
  "platform": "linux",
  "ips": [{"interface": "eth0", "address": "192.168.1.100"}],
  "defaultIp": "192.168.1.100"
}
```

### Simulation Control
```bash
# Start simulation
POST /api/simulation/start
Content-Type: multipart/form-data
Body: {protocol, host, port, packets, interval, ...}

# Stop simulation
POST /api/simulation/stop
Response: {"success": true, "message": "Simulation stopped"}

# Get status
GET /api/simulation/status
Response: {
  "isRunning": true,
  "progress": {"current": 5, "total": 10, "percentage": 50}
}
```

### Configuration Management
```bash
# Get configuration
GET /api/config
Response: {protocol: "tcp", host: "192.168.1.100", ...}

# Save configuration
POST /api/config
Body: {protocol: "tcp", host: "192.168.1.100", ...}

# Reset to defaults
POST /api/config/reset
```

### Logging
```bash
# Get recent logs
GET /api/logs/recent
Response: [{"timestamp": "...", "level": "INFO", "message": "..."}]

# Stream logs (Server-Sent Events)
GET /api/logs/stream
Content-Type: text/event-stream

# Download logs
GET /api/logs/download
Content-Type: text/plain
Content-Disposition: attachment; filename="simulation-logs-*.log"

# Clear logs
POST /api/logs/clear
```

## 📁 File Formats

### Text File Format (.txt)
```
# Each line is a separate packet
$GPRMC,123519,A,4807.038,N,01131.000,E,022.4,084.4,230394,003.1,W*6A
$GPGGA,123519,4807.038,N,01131.000,E,1,08,0.9,545.4,M,46.9,M,,*47
device_id,7002238281,timestamp,20250121120000,lat,40.7128,lon,-74.0060
alert,overspeed,device_id,7002238281,speed,85,limit,80

# Empty lines are ignored
# Comments are not supported in .txt files
```

### JavaScript File Format (.js)
```javascript
// Must use CommonJS module.exports format
module.exports = [
  // GPS NMEA sentences
  "$GPRMC,123519,A,4807.038,N,01131.000,E,022.4,084.4,230394,003.1,W*6A",
  "$GPGGA,123519,4807.038,N,01131.000,E,1,08,0.9,545.4,M,46.9,M,,*47",
  
  // Device tracking data
  "device_id,7002238281,status,online,battery,85,signal,4",
  "device_id,7002238281,status,moving,battery,84,signal,4",
  
  // Location updates
  "loc,40.7128,-74.0060,25,20250121120000",
  "loc,40.7129,-74.0061,26,20250121120005",
  
  // Alert packets
  "alert,overspeed,device_id,7002238281,speed,85,limit,80",
  "alert,geofence,device_id,7002238281,zone,restricted_area",
  
  // Heartbeat packets
  "hb,7002238281,20250121120015",
  "hb,7002238281,20250121120030"
];

// Comments are allowed in .js files
// Each array element becomes one packet
// Packets are sent in array order
```

### Sample Files Included

**sample-packets.txt:**
- GPS NMEA sentences
- Device tracking data
- Location coordinates
- Ready to use for testing

**sample-packets.js:**
- JavaScript format example
- Multiple packet types
- Commented for learning

## 🐳 Docker Deployment

### Production Deployment

**Single Container:**
```bash
# Build production image
docker build -t packet-simulator .

# Run with persistent storage
docker run -d \
  --name packet-simulator \
  --restart unless-stopped \
  -p 8080:8080 \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/config:/app/config \
  packet-simulator
```

**Docker Compose (Recommended):**
```yaml
# docker-compose.yml
version: '3.8'
services:
  packet-simulator:
    build: .
    ports:
      - "8080:8080"
    volumes:
      - ./logs:/app/logs
      - ./config:/app/config
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

```bash
# Deploy with compose
docker-compose up -d

# Scale if needed
docker-compose up -d --scale packet-simulator=2

# Update deployment
docker-compose pull && docker-compose up -d
```

### Container Management

**Monitoring:**
```bash
# Check container status
docker ps | grep packet-simulator

# View logs
docker logs -f packet-simulator

# Check resource usage
docker stats packet-simulator

# Health check
docker exec packet-simulator curl -f http://localhost:8080/api/health
```

**Maintenance:**
```bash
# Update container
docker pull packet-simulator:latest
docker stop packet-simulator
docker rm packet-simulator
./run.sh

# Backup data
tar -czf backup-$(date +%Y%m%d).tar.gz logs/ config/

# Restore data
tar -xzf backup-20250121.tar.gz
```

### Multi-Environment Setup

**Development:**
```bash
# Use development profile
docker-compose --profile dev up -d

# With live reload
docker-compose -f docker-compose.dev.yml up -d
```

**Production:**
```bash
# Production optimized
docker-compose -f docker-compose.prod.yml up -d

# With load balancer
docker-compose -f docker-compose.prod.yml -f docker-compose.lb.yml up -d
```

## 💻 Development Setup

### Local Development Environment

**Prerequisites:**
```bash
# Check Node.js version
node --version  # Should be 18+
npm --version   # Should be 8+

# Install global tools (optional)
npm install -g nodemon concurrently
```

**Setup Steps:**
```bash
# 1. Clone repository
git clone <repository-url>
cd packet-simulator

# 2. Install dependencies
npm run install:all

# 3. Start development servers
npm run dev
```

**Development URLs:**
- Frontend: http://localhost:5173 (Vite dev server)
- Backend: http://localhost:8080 (Express server)
- API: http://localhost:8080/api/*

### Development Workflow

**Backend Development:**
```bash
cd backend

# Start with auto-reload
npm run dev

# Run tests
npm test

# Check code style
npm run lint

# Debug mode
DEBUG=* npm run dev
```

**Frontend Development:**
```bash
cd frontend

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check
```

### Code Structure

**Backend Architecture:**
```
backend/src/
├── server.js              # Main server file
├── routes/                # API route handlers
│   ├── simulation.js      # Simulation endpoints
│   ├── config.js          # Configuration endpoints
│   └── logs.js           # Logging endpoints
├── simulation/            # Core simulation logic
│   └── engine.js         # Simulation engine
└── utils/                # Utility functions
    └── logger.js         # Logging utility
```

**Frontend Architecture:**
```
frontend/src/
├── main.jsx              # Application entry point
├── App.jsx               # Main application component
├── components/           # React components
│   ├── SimulationPanel.jsx  # Main simulation interface
│   ├── LogsPanel.jsx        # Log viewing interface
│   └── SettingsPanel.jsx    # Configuration interface
└── services/             # API service layer
    └── api.js           # API communication
```

### Building and Testing

**Full Build Process:**
```bash
# Install all dependencies
npm run install:all

# Build frontend
cd frontend && npm run build

# Test backend
cd backend && npm test

# Build Docker image
docker build -t packet-simulator .

# Test Docker container
docker run --rm -p 8080:8080 packet-simulator
```

**Testing Checklist:**
- [ ] Health endpoint responds
- [ ] System info returns device IPs
- [ ] TCP simulation connects and sends packets
- [ ] HTTP simulation makes requests
- [ ] File upload works for .txt and .js
- [ ] Real-time logs stream properly
- [ ] Configuration saves and loads
- [ ] Container starts and stops cleanly

## 📂 Project Structure

```
packet-simulator/
├── README.md                    # This comprehensive guide
├── package.json                 # Root package configuration
├── Dockerfile                   # Container build instructions
├── docker-compose.yml           # Container orchestration
├── .dockerignore               # Docker build exclusions
├── .gitignore                  # Git exclusions
│
├── build.sh                    # Docker build script
├── run.sh                      # Container run script
├── test-local.sh              # Local testing script
│
├── sample-packets.txt          # Example text packet file
├── sample-packets.js           # Example JavaScript packet file
│
├── backend/                    # Node.js backend application
│   ├── package.json           # Backend dependencies
│   └── src/
│       ├── server.js          # Express server setup
│       ├── routes/            # API route handlers
│       │   ├── simulation.js  # Simulation control API
│       │   ├── config.js      # Configuration management API
│       │   └── logs.js        # Logging API
│       ├── simulation/        # Core simulation logic
│       │   └── engine.js      # TCP/HTTP simulation engine
│       └── utils/             # Utility modules
│           └── logger.js      # Logging system
│
├── frontend/                   # React frontend application
│   ├── package.json           # Frontend dependencies
│   ├── vite.config.js         # Vite build configuration
│   ├── index.html             # HTML template
│   └── src/
│       ├── main.jsx           # React application entry
│       ├── App.jsx            # Main application component
│       ├── components/        # React UI components
│       │   ├── SimulationPanel.jsx  # Simulation interface
│       │   ├── LogsPanel.jsx        # Log viewer
│       │   └── SettingsPanel.jsx    # Settings interface
│       └── services/          # API service layer
│           └── api.js         # HTTP client for backend API
│
├── config/                     # Application configuration (created at runtime)
│   └── config.json            # Persistent settings
│
├── logs/                       # Application logs (created at runtime)
│   └── sim-*.log              # Timestamped log files
│
└── uploads/                    # Temporary file uploads (created at runtime)
    └── temp_*.txt             # Uploaded packet files
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Port Already in Use
**Problem:** `Error: listen EADDRINUSE: address already in use :::8080`

**Solutions:**
```bash
# Option A: Use different port
docker run -p 3000:8080 packet-simulator

# Option B: Kill process using port 8080
sudo lsof -ti:8080 | xargs kill -9

# Option C: Find and stop conflicting container
docker ps | grep 8080
docker stop <container-name>
```

#### 2. Docker Build Failures
**Problem:** Docker build fails with dependency errors

**Solutions:**
```bash
# Clear Docker cache
docker system prune -a

# Build with no cache
docker build --no-cache -t packet-simulator .

# Check Docker version
docker --version  # Should be 20.0+

# Free up disk space
docker system df
docker system prune
```

#### 3. File Upload Issues
**Problem:** File uploads fail or packets not recognized

**Solutions:**
```bash
# Check file format
file sample-packets.txt  # Should show text file

# Verify .js file syntax
node -c sample-packets.js

# Check file size (limit: 10MB)
ls -lh sample-packets.txt

# Verify file permissions
chmod 644 sample-packets.txt
```

#### 4. TCP Connection Failures
**Problem:** TCP simulation fails to connect

**Solutions:**
```bash
# Test target connectivity
telnet 192.168.1.100 19999
nc -zv 192.168.1.100 19999

# Check firewall rules
sudo ufw status
sudo iptables -L

# Verify target service is running
netstat -tlnp | grep 19999

# Use localhost for testing
Host: 127.0.0.1, Port: 8080
```

#### 5. HTTP Request Failures
**Problem:** HTTP simulation returns errors

**Solutions:**
```bash
# Test URL manually
curl -X POST http://target-url/api/test -d "test-packet"

# Check URL format
# Correct: http://example.com/api/endpoint
# Incorrect: example.com/api/endpoint

# Verify headers format
# Correct: {"Content-Type": "application/json"}
# Incorrect: {Content-Type: application/json}

# Test with simple GET request first
Method: GET, URL: http://httpbin.org/get
```

#### 6. Log Streaming Issues
**Problem:** Real-time logs not updating

**Solutions:**
```bash
# Check browser console for errors
# Open Developer Tools > Console

# Verify EventSource support
# Modern browsers support SSE

# Test log endpoint directly
curl http://localhost:8080/api/logs/stream

# Restart container
docker restart packet-simulator
```

#### 7. Configuration Not Saving
**Problem:** Settings reset after restart

**Solutions:**
```bash
# Check volume mounts
docker inspect packet-simulator | grep Mounts

# Verify config directory permissions
ls -la config/
chmod 755 config/

# Check disk space
df -h

# Manual config backup
cp config/config.json config/config.json.backup
```

### Performance Issues

#### High Memory Usage
```bash
# Check container resources
docker stats packet-simulator

# Limit container memory
docker run -m 512m -p 8080:8080 packet-simulator

# Monitor Node.js memory
docker exec packet-simulator node -e "console.log(process.memoryUsage())"
```

#### Slow Packet Transmission
```bash
# Reduce interval for faster transmission
Interval: 1 second (minimum)

# Check network latency
ping target-host

# Monitor packet queue
# Check logs for transmission delays

# Use smaller packet batches
# Split large files into smaller chunks
```

### Debug Mode

**Enable Debug Logging:**
```bash
# Backend debug mode
cd backend
DEBUG=* npm run dev

# Container debug mode
docker run -e DEBUG=* -p 8080:8080 packet-simulator

# Frontend debug mode
# Open browser Developer Tools > Console
```

**Log Analysis:**
```bash
# View detailed logs
docker logs -f packet-simulator

# Search logs for errors
docker logs packet-simulator 2>&1 | grep ERROR

# Export logs for analysis
docker logs packet-simulator > debug.log 2>&1
```

### Getting Help

**Check Application Health:**
```bash
# Health endpoint
curl http://localhost:8080/api/health

# System information
curl http://localhost:8080/api/system/info

# Current configuration
curl http://localhost:8080/api/config
```

**Collect Debug Information:**
```bash
# System info
uname -a
docker --version
node --version

# Container info
docker ps -a
docker logs packet-simulator

# Network info
netstat -tlnp
ss -tlnp
```

## 🚀 Advanced Usage

### Custom Packet Formats

**GPS Tracking Packets:**
```javascript
// GPS NMEA format
module.exports = [
  "$GPRMC,123519,A,4807.038,N,01131.000,E,022.4,084.4,230394,003.1,W*6A",
  "$GPGGA,123519,4807.038,N,01131.000,E,1,08,0.9,545.4,M,46.9,M,,*47"
];
```

**IoT Device Data:**
```javascript
// JSON format packets
module.exports = [
  '{"deviceId":"DEV001","temperature":23.5,"humidity":65,"timestamp":"2025-01-21T12:00:00Z"}',
  '{"deviceId":"DEV001","temperature":24.1,"humidity":63,"timestamp":"2025-01-21T12:01:00Z"}'
];
```

**Vehicle Tracking:**
```javascript
// CSV format packets
module.exports = [
  "vehicle_id,7002238281,lat,40.7128,lon,-74.0060,speed,25,heading,90",
  "vehicle_id,7002238281,lat,40.7129,lon,-74.0061,speed,26,heading,91"
];
```

### Automation Scripts

**Batch Testing:**
```bash
#!/bin/bash
# test-multiple-endpoints.sh

endpoints=(
  "192.168.1.100:19999"
  "192.168.1.101:19999"
  "192.168.1.102:19999"
)

for endpoint in "${endpoints[@]}"; do
  host=$(echo $endpoint | cut -d: -f1)
  port=$(echo $endpoint | cut -d: -f2)
  
  echo "Testing $host:$port"
  # Use API to start simulation for each endpoint
  curl -X POST http://localhost:8080/api/simulation/start \
    -F "protocol=tcp" \
    -F "host=$host" \
    -F "port=$port" \
    -F "inputType=text" \
    -F "textInput=test,packet,data"
  
  sleep 10
  
  curl -X POST http://localhost:8080/api/simulation/stop
  sleep 5
done
```

**Continuous Monitoring:**
```bash
#!/bin/bash
# monitor-simulation.sh

while true; do
  status=$(curl -s http://localhost:8080/api/simulation/status)
  echo "$(date): $status"
  sleep 5
done
```

### Integration Examples

**CI/CD Pipeline:**
```yaml
# .github/workflows/test.yml
name: Test Packet Simulator
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build Docker image
        run: docker build -t packet-simulator .
      - name: Start container
        run: docker run -d -p 8080:8080 --name test-container packet-simulator
      - name: Wait for startup
        run: sleep 10
      - name: Test health endpoint
        run: curl -f http://localhost:8080/api/health
      - name: Test simulation
        run: |
          curl -X POST http://localhost:8080/api/simulation/start \
            -F "protocol=tcp" \
            -F "host=127.0.0.1" \
            -F "port=8080" \
            -F "inputType=text" \
            -F "textInput=test"
```

**Monitoring Integration:**
```bash
# Prometheus metrics endpoint (custom implementation)
GET /api/metrics
# Returns:
# packet_simulator_packets_sent_total 150
# packet_simulator_simulations_active 1
# packet_simulator_errors_total 2
```

### Performance Optimization

**High-Volume Packet Transmission:**
```javascript
// Optimized packet file for high volume
const packets = [];
for (let i = 0; i < 10000; i++) {
  packets.push(`packet_${i},timestamp,${Date.now()},data,value_${i}`);
}
module.exports = packets;
```

**Concurrent Simulations:**
```bash
# Run multiple containers for load testing
for i in {1..5}; do
  docker run -d --name sim-$i -p $((8080+i)):8080 packet-simulator
done
```

## 🤝 Contributing

### Development Guidelines

**Code Style:**
- Backend: Follow Node.js best practices
- Frontend: Use React hooks and functional components
- Use ESLint and Prettier for code formatting
- Write descriptive commit messages

**Testing:**
- Add unit tests for new features
- Test both TCP and HTTP protocols
- Verify Docker builds work correctly
- Test file upload functionality

**Documentation:**
- Update README.md for new features
- Add inline code comments
- Update API documentation
- Include usage examples

### Submitting Changes

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Update documentation
6. Submit a pull request

### Feature Requests

Common enhancement ideas:
- WebSocket protocol support
- UDP packet transmission
- Packet scheduling/timing
- Advanced logging filters
- Multi-protocol simulations
- Packet encryption/decryption
- Performance metrics dashboard
- API rate limiting
- User authentication
- Packet templates library

---

## 📞 Support

For issues, questions, or contributions:
- Check the troubleshooting section above
- Review existing GitHub issues
- Create a new issue with detailed information
- Include logs and configuration details

**Quick Support Checklist:**
- [ ] Checked troubleshooting section
- [ ] Verified Docker and Node.js versions
- [ ] Tested with sample files
- [ ] Checked container logs
- [ ] Verified network connectivity

---

*This README provides comprehensive documentation for the Packet Simulator application. Keep it updated as the project evolves.*