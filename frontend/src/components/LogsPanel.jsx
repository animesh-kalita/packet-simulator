import React, { useState, useEffect, useRef } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
  Toolbar,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  Download as DownloadIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import {
  getRecentLogs,
  downloadLogs,
  clearLogs,
  createLogStream
} from '../services/api'

function LogsPanel() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const logStreamRef = useRef(null)
  const logsEndRef = useRef(null)

  useEffect(() => {
    loadLogs()
    startLogStream()
    
    return () => {
      if (logStreamRef.current) {
        logStreamRef.current.close()
      }
    }
  }, [])

  useEffect(() => {
    // Auto-scroll to bottom when new logs arrive
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs])

  const loadLogs = async () => {
    try {
      setLoading(true)
      const recentLogs = await getRecentLogs()
      setLogs(recentLogs)
    } catch (err) {
      setError('Failed to load logs')
    } finally {
      setLoading(false)
    }
  }

  const startLogStream = () => {
    if (logStreamRef.current) {
      logStreamRef.current.close()
    }

    logStreamRef.current = createLogStream(
      (logEntry) => {
        setLogs(prev => [...prev, logEntry])
        setIsStreaming(true)
      },
      (error) => {
        console.error('Log stream error:', error)
        setIsStreaming(false)
        // Try to reconnect after 5 seconds
        setTimeout(startLogStream, 5000)
      }
    )
  }

  const handleDownload = async () => {
    try {
      await downloadLogs()
      setSuccess('Logs downloaded successfully')
    } catch (err) {
      setError('Failed to download logs')
    }
  }

  const handleClear = async () => {
    try {
      await clearLogs()
      setLogs([])
      setSuccess('Logs cleared successfully')
    } catch (err) {
      setError('Failed to clear logs')
    }
  }

  const getLogLevelColor = (level) => {
    switch (level) {
      case 'ERROR':
        return 'error'
      case 'WARN':
        return 'warning'
      case 'INFO':
        return 'info'
      default:
        return 'default'
    }
  }

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Simulation Logs
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Card>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Live Logs
            {isStreaming && (
              <Chip 
                label="Live" 
                color="success" 
                size="small" 
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
          
          <Tooltip title="Refresh">
            <IconButton onClick={loadLogs} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Download Logs">
            <IconButton onClick={handleDownload}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Clear Logs">
            <IconButton onClick={handleClear}>
              <ClearIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>

        <CardContent sx={{ pt: 0 }}>
          <Paper 
            variant="outlined" 
            sx={{ 
              height: 500, 
              overflow: 'auto',
              bgcolor: 'grey.50'
            }}
          >
            {logs.length === 0 ? (
              <Box 
                display="flex" 
                justifyContent="center" 
                alignItems="center" 
                height="100%"
              >
                <Typography color="text.secondary">
                  No logs available
                </Typography>
              </Box>
            ) : (
              <List dense>
                {logs.map((log, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="caption" color="text.secondary">
                            {formatTimestamp(log.timestamp)}
                          </Typography>
                          <Chip 
                            label={log.level} 
                            size="small" 
                            color={getLogLevelColor(log.level)}
                            variant="outlined"
                          />
                          <Typography variant="body2" component="span">
                            {log.message}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
                <div ref={logsEndRef} />
              </List>
            )}
          </Paper>
        </CardContent>
      </Card>
    </Box>
  )
}

export default LogsPanel