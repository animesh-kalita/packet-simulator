import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Stack,
  Divider,
  Tooltip,
  IconButton,
  CircularProgress,
  Grid,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { PACKET_TEMPLATES } from "../utils/constants";

const PacketInputPanel = ({ onPacketChange, onTemplateLoad }) => {
  const [inputData, setInputData] = useState("");
  const [inputType, setInputType] = useState("hex");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      setInputData(content.trim());
      onPacketChange(content.trim());
    };
    reader.onerror = () => {
      setError("Error reading file");
    };
    reader.readAsText(file);
  };

  const handleTemplateChange = (e) => {
    const templateId = e.target.value;
    if (templateId && PACKET_TEMPLATES[templateId]) {
      setSelectedTemplate(templateId);
      setInputData(PACKET_TEMPLATES[templateId].hex);
      onTemplateLoad(PACKET_TEMPLATES[templateId]);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value.trim();
    setInputData(value);
    // Validate based on input type
    if (inputType === "hex") {
      // Remove spaces and validate hex
      const cleaned = value.replace(/\s/g, "");
      if (/^[0-9A-Fa-f]*$/.test(cleaned) || cleaned === "") {
        setError("");
        onPacketChange(cleaned);
      } else {
        setError("Invalid hexadecimal characters");
      }
    } else {
      // ASCII input
      setError("");
      onPacketChange(value);
    }
  };

  const handleClear = () => {
    setInputData("");
    onPacketChange("");
  };

  const handleLoadSample = () => {
    if (selectedTemplate) {
      handleTemplateChange({ target: { value: selectedTemplate } });
    }
  };

  const validateInput = () => {
    if (!inputData) {
      setError("Please enter packet data");
      return false;
    }

    if (inputType === "hex") {
      const cleaned = inputData.replace(/\s/g, "");
      if (!/^[0-9A-Fa-f]+$/.test(cleaned)) {
        setError("Invalid hexadecimal data");
        return false;
      }
      if (cleaned.length % 2 !== 0) {
        setError("Hex data must have even number of characters");
        return false;
      }
    }

    setError("");
    return true;
  };

  return (
    <Paper elevation={3} sx={{ minHeight: 300 }}>
      <Box p={3}>
        <Typography variant="h5" gutterBottom>
          Packet Input Panel
        </Typography>

        {/* Input Type Selector */}
        <FormControl sx={{ minWidth: 150, mb: 2 }}>
          <InputLabel id="input-type-label">Input Type</InputLabel>
          <Select
            labelId="input-type-label"
            value={inputType}
            label="Input Type"
            onChange={(e) => setInputType(e.target.value)}
          >
            <MenuItem value="hex">Hexadecimal</MenuItem>
            <MenuItem value="ascii">ASCII/Text</MenuItem>
          </Select>
        </FormControl>

        {/* Template Selector */}
        <Box mb={2}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="template-label">Sample Packets</InputLabel>
            <Select
              labelId="template-label"
              value={selectedTemplate}
              label="Sample Packet"
              onChange={handleTemplateChange}
              MenuProps={{
                anchorOrigin: { vertical: "top", horizontal: "left" },
                transformOrigin: { vertical: "top", horizontal: "left" },
              }}
            >
              <MenuItem value="">-- Select Sample --</MenuItem>
              {Object.entries(PACKET_TEMPLATES).map(([id, template]) => (
                <MenuItem key={id} value={id}>
                  {template.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            size="small"
            onClick={handleLoadSample}
            disabled={!selectedTemplate}
          >
            Load Sample
          </Button>
        </Box>

        {/* Text Input */}
        <TextField
          label={
            inputType === "hex" ? "Packet Data (Hex)" : "Packet Data (ASCII)"
          }
          value={inputData}
          onChange={handleInputChange}
          error={Boolean(error)}
          helperText={error}
          multiline
          rows={4}
          placeholder="Enter hex data (e.g., 2323001e0100...) or ASCII text"
          sx={{ mb: 2 }}
        />

        {/* File Upload */}
        <Box mb={2}>
          <Tooltip title="Upload packet file">
            <Button variant="outlined" component="label">
              <UploadFileIcon fontSize="small" />
              Upload File
              <input
                type="file"
                style={{ display: "none" }}
                onChange={handleFileChange}
                accept=".txt,.log,.pcap"
              />
            </Button>
          </Tooltip>
          <Button
            variant="outlined"
            size="small"
            onClick={handleClear}
            sx={{ ml: 1 }}
          >
            Clear
          </Button>
        </Box>

        {/* Validation and Load Button */}
        <Box display="flex" justifyContent="flex-end" mt={2}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              if (validateInput()) {
                onPacketChange(inputData);
              }
            }}
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : undefined}
          >
            {isLoading ? "Loading..." : "Load Packet"}
          </Button>
        </Box>

        {/* Data Info */}
        {inputData && (
          <Box mt={3} p={2} sx={{ bgcolor: 'action.selected', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              Packet Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Length
                </Typography>
                <Typography variant="h6">
                  {inputData.length} {inputType === "hex" ? "chars" : "chars"}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Bytes
                </Typography>
                <Typography variant="h6">
                  {inputType === "hex"
                    ? Math.floor(inputData.replace(/\s/g, "").length / 2)
                    : inputData.length}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default PacketInputPanel;
