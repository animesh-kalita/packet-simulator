const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

class Logger extends EventEmitter {
  constructor() {
    super();
    this.logs = [];
    this.maxLogs = 1000;
    this.logDir = path.join(__dirname, '../logs');
    
    // Ensure logs directory exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    this.currentLogFile = null;
    this.startNewLogSession();
  }

  startNewLogSession() {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    this.currentLogFile = path.join(this.logDir, `sim-${timestamp}.log`);
    this.log('Logger initialized');
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message
    };

    // Add to memory buffer
    this.logs.push(logEntry);
    
    // Keep only recent logs in memory
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Write to file
    if (this.currentLogFile) {
      const logLine = `[${timestamp}] [${level}] ${message}\n`;
      fs.appendFileSync(this.currentLogFile, logLine);
    }

    // Emit event for real-time streaming
    this.emit('log', logEntry);
  }

  getRecentLogs(count = 100) {
    return this.logs.slice(-count);
  }

  clearLogs() {
    this.logs = [];
    this.startNewLogSession();
  }
}

const logger = new Logger();

// Connect simulation engine logs (will be connected when engine is imported)
// This prevents circular dependency issues

module.exports = logger;