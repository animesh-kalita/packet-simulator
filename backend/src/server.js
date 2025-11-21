const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
const simulationRoutes = require('./routes/simulation');
const configRoutes = require('./routes/config');
const logsRoutes = require('./routes/logs');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Determine frontend path (different for Docker vs local development)
const frontendPath = process.env.NODE_ENV === 'production'
  ? path.join(__dirname, '../frontend/dist')  // In Docker: /app/src -> /app/frontend/dist
  : path.join(__dirname, '../../frontend/dist'); // Local: backend/src -> frontend/dist
// Serve static files from frontend build
app.use(express.static(frontendPath));

// API Routes
app.use('/api/simulation', simulationRoutes);
app.use('/api/config', configRoutes);
app.use('/api/logs', logsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get system info (IP addresses)
app.get('/api/system/info', (req, res) => {
  const networkInterfaces = os.networkInterfaces();
  const ips = [];
  
  Object.keys(networkInterfaces).forEach(interfaceName => {
    networkInterfaces[interfaceName].forEach(interface => {
      if (interface.family === 'IPv4' && !interface.internal) {
        ips.push({
          interface: interfaceName,
          address: interface.address
        });
      }
    });
  });
  
  res.json({
    hostname: os.hostname(),
    platform: os.platform(),
    ips: ips,
    defaultIp: ips.length > 0 ? ips[0].address : '127.0.0.1'
  });
});

// Catch all handler for React Router
app.get('*', (req, res) => {
  const indexPath = path.join(frontendPath, 'index.html');
  res.sendFile(indexPath);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Packet Simulator running on http://localhost:${PORT}`);
});