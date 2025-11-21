const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const CONFIG_DIR = path.join(__dirname, '../config');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// Ensure config directory exists
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

// Default configuration
const defaultConfig = {
  protocol: 'tcp',
  host: '127.0.0.1',
  port: 19999,
  url: 'http://localhost:3000/api/test',
  method: 'POST',
  headers: {},
  delimiter: '\r\n',
  interval: 5,
  lastInputType: 'text'
};

// Load configuration
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return { ...defaultConfig, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error('Error loading config:', error.message);
  }
  return defaultConfig;
}

// Save configuration
function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving config:', error.message);
    return false;
  }
}

// Get current configuration
router.get('/', (req, res) => {
  res.json(loadConfig());
});

// Update configuration
router.post('/', (req, res) => {
  try {
    const currentConfig = loadConfig();
    const updatedConfig = { ...currentConfig, ...req.body };
    
    if (saveConfig(updatedConfig)) {
      res.json({ success: true, config: updatedConfig });
    } else {
      res.status(500).json({ error: 'Failed to save configuration' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Reset to default configuration
router.post('/reset', (req, res) => {
  if (saveConfig(defaultConfig)) {
    res.json({ success: true, config: defaultConfig });
  } else {
    res.status(500).json({ error: 'Failed to reset configuration' });
  }
});

module.exports = router;