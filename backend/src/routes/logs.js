const express = require('express');
const logger = require('../utils/logger');

const router = express.Router();

// Stream logs via Server-Sent Events
router.get('/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Send existing logs
  const existingLogs = logger.getRecentLogs();
  existingLogs.forEach(log => {
    res.write(`data: ${JSON.stringify(log)}\n\n`);
  });

  // Listen for new logs
  const logHandler = (logEntry) => {
    res.write(`data: ${JSON.stringify(logEntry)}\n\n`);
  };

  logger.on('log', logHandler);

  // Clean up on client disconnect
  req.on('close', () => {
    logger.removeListener('log', logHandler);
  });
});

// Get recent logs
router.get('/recent', (req, res) => {
  res.json(logger.getRecentLogs());
});

// Download current session logs
router.get('/download', (req, res) => {
  try {
    const logs = logger.getRecentLogs();
    const logText = logs.map(log => 
      `[${log.timestamp}] ${log.message}`
    ).join('\n');

    const filename = `simulation-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.log`;
    
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(logText);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate log file' });
  }
});

// Clear logs
router.post('/clear', (req, res) => {
  logger.clearLogs();
  res.json({ success: true, message: 'Logs cleared' });
});

module.exports = router;