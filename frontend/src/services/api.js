import axios from 'axios'

const API_BASE = '/api'

// System Info
export const getSystemInfo = async () => {
  const response = await axios.get(`${API_BASE}/system/info`)
  return response.data
}

// Configuration
export const getConfig = async () => {
  const response = await axios.get(`${API_BASE}/config`)
  return response.data
}

export const saveConfig = async (config) => {
  const response = await axios.post(`${API_BASE}/config`, config)
  return response.data
}

export const resetConfig = async () => {
  const response = await axios.post(`${API_BASE}/config/reset`)
  return response.data
}

// Simulation
export const startSimulation = async (formData) => {
  const response = await axios.post(`${API_BASE}/simulation/start`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}

export const stopSimulation = async () => {
  const response = await axios.post(`${API_BASE}/simulation/stop`)
  return response.data
}

export const getSimulationStatus = async () => {
  const response = await axios.get(`${API_BASE}/simulation/status`)
  return response.data
}

export const previewPackets = async (formData) => {
  const response = await axios.post(`${API_BASE}/simulation/preview`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}

// Logs
export const getRecentLogs = async () => {
  const response = await axios.get(`${API_BASE}/logs/recent`)
  return response.data
}

export const downloadLogs = async () => {
  const response = await axios.get(`${API_BASE}/logs/download`, {
    responseType: 'blob'
  })
  
  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `simulation-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.log`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export const clearLogs = async () => {
  const response = await axios.post(`${API_BASE}/logs/clear`)
  return response.data
}

// Create EventSource for log streaming
export const createLogStream = (onMessage, onError) => {
  const eventSource = new EventSource(`${API_BASE}/logs/stream`)
  
  eventSource.onmessage = (event) => {
    try {
      const logEntry = JSON.parse(event.data)
      onMessage(logEntry)
    } catch (err) {
      console.error('Error parsing log entry:', err)
    }
  }
  
  eventSource.onerror = (error) => {
    console.error('EventSource error:', error)
    if (onError) onError(error)
  }
  
  return eventSource
}