import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Tabs,
  Tab,
  Alert,
  LinearProgress,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Upload as UploadIcon,
  Visibility as PreviewIcon,
} from "@mui/icons-material";
import {
  getConfig,
  saveConfig,
  startSimulation,
  stopSimulation,
  getSimulationStatus,
  previewPackets,
} from "../services/api";

function SimulationPanel({ systemInfo }) {
  const [config, setConfig] = useState({
    protocol: "tcp",
    host: "127.0.0.1",
    port: 19999,
    url: "http://localhost:3000/api/test",
    method: "POST",
    headers: "{}",
    delimiter: "\r\n",
    interval: 5,
  });

  const [inputType, setInputType] = useState("text");
  const [textInput, setTextInput] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState({ isRunning: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [convertToBinary, setConvertToBinary] = useState(false);

  useEffect(() => {
    loadConfig();
    checkStatus();
    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (systemInfo?.defaultIp && config.host === "127.0.0.1") {
      setConfig((prev) => ({ ...prev, host: systemInfo.defaultIp }));
    }
  }, [systemInfo]);

  const loadConfig = async () => {
    try {
      const savedConfig = await getConfig();
      setConfig(savedConfig);
    } catch (err) {
      console.error("Failed to load config:", err);
    }
  };

  const checkStatus = async () => {
    try {
      const currentStatus = await getSimulationStatus();
      setStatus(currentStatus);
    } catch (err) {
      console.error("Failed to get status:", err);
    }
  };

  const handleConfigChange = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    setPreview(null);
  };

  const handlePreview = async () => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("inputType", inputType);
      formData.append("convertToBinary", convertToBinary);

      if (inputType === "text") {
        formData.append("textInput", textInput);
      } else if (selectedFile) {
        formData.append("packetFile", selectedFile);
      }

      const result = await previewPackets(formData);
      setPreview(result);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to preview packets");
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    try {
      setLoading(true);

      // Save current config
      await saveConfig(config);

      const formData = new FormData();
      formData.append("protocol", config.protocol);
      formData.append("interval", config.interval);
      formData.append("inputType", inputType);
      formData.append("convertToBinary", convertToBinary);

      if (config.protocol === "tcp") {
        formData.append("host", config.host);
        formData.append("port", config.port);
        formData.append("delimiter", config.delimiter);
      } else {
        formData.append("url", config.url);
        formData.append("method", config.method);
        formData.append("headers", config.headers);
      }

      if (inputType === "text") {
        formData.append("textInput", textInput);
      } else if (selectedFile) {
        formData.append("packetFile", selectedFile);
      }

      const result = await startSimulation(formData);
      setSuccess(`Simulation started with ${result.packetCount} packets`);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to start simulation");
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    try {
      await stopSimulation();
      setSuccess("Simulation stopped");
      setError(null);
    } catch (err) {
      setError("Failed to stop simulation");
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Packet Simulation
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      {status.isRunning && (
        <Card
          sx={{
            mb: 2,
            bgcolor: "primary.light",
            color: "primary.contrastText",
          }}
        >
          <CardContent>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="h6">Simulation Running</Typography>
              <Chip
                label={`${status.progress?.current || 0}/${
                  status.progress?.total || 0
                }`}
                color="secondary"
              />
            </Box>
            {status.progress && (
              <LinearProgress
                variant="determinate"
                value={status.progress.percentage}
                sx={{ mt: 1 }}
              />
            )}
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Configuration
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Protocol</InputLabel>
                    <Select
                      value={config.protocol}
                      label="Protocol"
                      onChange={(e) =>
                        handleConfigChange("protocol", e.target.value)
                      }
                    >
                      <MenuItem value="tcp">TCP</MenuItem>
                      <MenuItem value="http">HTTP</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Interval (seconds)"
                    type="number"
                    value={config.interval}
                    onChange={(e) =>
                      handleConfigChange("interval", parseInt(e.target.value))
                    }
                    inputProps={{ min: 1 }}
                  />
                </Grid>

                {config.protocol === "tcp" ? (
                  <>
                    <Grid item xs={12} sm={8}>
                      <TextField
                        fullWidth
                        label="Host"
                        value={config.host}
                        onChange={(e) =>
                          handleConfigChange("host", e.target.value)
                        }
                        helperText={
                          systemInfo ? `Device IP: ${systemInfo.defaultIp}` : ""
                        }
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Port"
                        type="number"
                        value={config.port}
                        onChange={(e) =>
                          handleConfigChange("port", parseInt(e.target.value))
                        }
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Line Delimiter</InputLabel>
                        <Select
                          value={config.delimiter}
                          label="Line Delimiter"
                          onChange={(e) =>
                            handleConfigChange("delimiter", e.target.value)
                          }
                        >
                          <MenuItem value="\r\n">\r\n (CRLF)</MenuItem>
                          <MenuItem value="\n">\n (LF)</MenuItem>
                          <MenuItem value="">None</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </>
                ) : (
                  <>
                    <Grid item xs={12} sm={8}>
                      <TextField
                        fullWidth
                        label="URL"
                        value={config.url}
                        onChange={(e) =>
                          handleConfigChange("url", e.target.value)
                        }
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth>
                        <InputLabel>Method</InputLabel>
                        <Select
                          value={config.method}
                          label="Method"
                          onChange={(e) =>
                            handleConfigChange("method", e.target.value)
                          }
                        >
                          <MenuItem value="GET">GET</MenuItem>
                          <MenuItem value="POST">POST</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Headers (JSON)"
                        multiline
                        rows={3}
                        value={config.headers}
                        onChange={(e) =>
                          handleConfigChange("headers", e.target.value)
                        }
                        placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Packet Input
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Tabs value={inputType} onChange={(e, v) => setInputType(v)}>
                  <Tab label="Text Input" value="text" />
                  <Tab label="File Upload" value="file" />
                </Tabs>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={convertToBinary}
                      onChange={(e) => setConvertToBinary(e.target.checked)}
                    />
                  }
                  label="Binary"
                />
              </Box>

              {inputType === "text" ? (
                <TextField
                  fullWidth
                  multiline
                  rows={8}
                  label="Packets (one per line)"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Enter packets, one per line..."
                />
              ) : (
                <Box>
                  <input
                    accept=".txt,.js"
                    style={{ display: "none" }}
                    id="packet-file-input"
                    type="file"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="packet-file-input">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<UploadIcon />}
                      fullWidth
                      sx={{ mb: 1 }}
                    >
                      Choose File (.txt or .js)
                    </Button>
                  </label>
                  {selectedFile && (
                    <Typography variant="body2" color="text.secondary">
                      Selected: {selectedFile.name}
                    </Typography>
                  )}
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    .js files should export an array: module.exports =
                    ["packet1", "packet2"]
                  </Typography>
                </Box>
              )}

              <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<PreviewIcon />}
                  onClick={handlePreview}
                  disabled={loading || (!textInput && !selectedFile)}
                >
                  Preview Packets
                </Button>

                <Button
                  variant="contained"
                  startIcon={status.isRunning ? <StopIcon /> : <PlayIcon />}
                  onClick={status.isRunning ? handleStop : handleStart}
                  disabled={
                    loading ||
                    (!status.isRunning && !textInput && !selectedFile)
                  }
                  color={status.isRunning ? "secondary" : "primary"}
                >
                  {status.isRunning ? "Stop Simulation" : "Start Simulation"}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          {preview && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Packet Preview
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total packets: {preview.total}
                  {preview.preview && " (showing first 10)"}
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{ maxHeight: 300, overflow: "auto" }}
                >
                  <List dense>
                    {preview.packets.map((packet, index) => (
                      <React.Fragment key={index}>
                        <ListItem>
                          <ListItemText
                            primary={`Packet ${index + 1}`}
                            secondary={
                              packet.length > 100
                                ? `${packet.substring(0, 100)}...`
                                : packet
                            }
                          />
                        </ListItem>
                        {index < preview.packets.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </Paper>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

export default SimulationPanel;
