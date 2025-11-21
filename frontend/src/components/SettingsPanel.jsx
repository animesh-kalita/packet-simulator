import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import {
  Save as SaveIcon,
  RestoreFromTrash as ResetIcon
} from '@mui/icons-material'
import {
  getConfig,
  saveConfig,
  resetConfig,
  getSystemInfo
} from '../services/api'

function SettingsPanel() {
  const [config, setConfig] = useState({})
  const [systemInfo, setSystemInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    loadConfig()
    loadSystemInfo()
  }, [])

  const loadConfig = async () => {
    try {
      const currentConfig = await getConfig()
      setConfig(currentConfig)
    } catch (err) {
      setError('Failed to load configuration')
    }
  }

  const loadSystemInfo = async () => {
    try {
      const info = await getSystemInfo()
      setSystemInfo(info)
    } catch (err) {
      console.error('Failed to load system info:', err)
    }
  }

  const handleConfigChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      await saveConfig(config)
      setSuccess('Configuration saved successfully')
      setError(null)
    } catch (err) {
      setError('Failed to save configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    try {
      setLoading(true)
      const defaultConfig = await resetConfig()
      setConfig(defaultConfig.config)
      setSuccess('Configuration reset to defaults')
      setError(null)
    } catch (err) {
      setError('Failed to reset configuration')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
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

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Default TCP Settings
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Default Host"
                    value={config.host || ''}
                    onChange={(e) => handleConfigChange('host', e.target.value)}
                    helperText={systemInfo ? `Current device IP: ${systemInfo.defaultIp}` : ''}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Default Port"
                    type="number"
                    value={config.port || ''}
                    onChange={(e) => handleConfigChange('port', parseInt(e.target.value))}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Default Line Delimiter</InputLabel>
                    <Select
                      value={config.delimiter || '\r\n'}
                      label="Default Line Delimiter"
                      onChange={(e) => handleConfigChange('delimiter', e.target.value)}
                    >
                      <MenuItem value="\r\n">\r\n (CRLF)</MenuItem>
                      <MenuItem value="\n">\n (LF)</MenuItem>
                      <MenuItem value="">None</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Default HTTP Settings
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Default URL"
                    value={config.url || ''}
                    onChange={(e) => handleConfigChange('url', e.target.value)}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Default Method</InputLabel>
                    <Select
                      value={config.method || 'POST'}
                      label="Default Method"
                      onChange={(e) => handleConfigChange('method', e.target.value)}
                    >
                      <MenuItem value="GET">GET</MenuItem>
                      <MenuItem value="POST">POST</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Default Headers (JSON)"
                    multiline
                    rows={4}
                    value={config.headers || '{}'}
                    onChange={(e) => handleConfigChange('headers', e.target.value)}
                    placeholder='{"Authorization": "Bearer token"}'
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                General Settings
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Default Interval (seconds)"
                    type="number"
                    value={config.interval || 5}
                    onChange={(e) => handleConfigChange('interval', parseInt(e.target.value))}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Default Protocol</InputLabel>
                    <Select
                      value={config.protocol || 'tcp'}
                      label="Default Protocol"
                      onChange={(e) => handleConfigChange('protocol', e.target.value)}
                    >
                      <MenuItem value="tcp">TCP</MenuItem>
                      <MenuItem value="http">HTTP</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {systemInfo && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  System Information
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Hostname: {systemInfo.hostname}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Platform: {systemInfo.platform}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Available IP Addresses:
                    </Typography>
                    {systemInfo.ips.map((ip, index) => (
                      <Typography key={index} variant="body2" color="text.secondary">
                        {ip.interface}: {ip.address}
                      </Typography>
                    ))}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={loading}
            >
              Save Configuration
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<ResetIcon />}
              onClick={handleReset}
              disabled={loading}
              color="secondary"
            >
              Reset to Defaults
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}

export default SettingsPanel