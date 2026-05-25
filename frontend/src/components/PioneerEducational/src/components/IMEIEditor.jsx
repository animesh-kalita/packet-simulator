import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Stack,
  Tooltip,
  Chip,
  Divider,
  Alert,
  Grid,
  IconButton,
} from "@mui/material";
import {
  Edit,
  ContentCopy,
  RestartAlt as Reset,
  Save as SaveAlt,
} from "@mui/icons-material";
import { decodeBCD, encodeBCD } from "../utils/bytesOperation";

const IMEIEditor = ({ packetBytes, onIMEIChange, onPacketUpdate }) => {
  const [imeiValue, setIMEIValue] = useState("");
  const [originalIMEI, setOriginalIMEI] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const extractIMEI = (bytes) => {
    if (!bytes || bytes.length < 16) return "";
    const imeiBytes = bytes.slice(8, 16);
    return decodeBCD(imeiBytes);
  };

  React.useEffect(() => {
    if (packetBytes && packetBytes.length >= 16) {
      const imei = extractIMEI(packetBytes);
      setIMEIValue(imei);
      setOriginalIMEI(imei);
      setError("");
      setSuccessMsg("");
    }
  }, [packetBytes]);

  const handleIMEIChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setIMEIValue(value);
    setError("");
    setSuccessMsg("");
    if (value.length > 15) {
      setError("IMEI must be 15 digits or less");
    }
  };

  const validateIMEI = () => {
    if (!imeiValue) {
      setError("IMEI cannot be empty");
      return false;
    }
    if (imeiValue.length !== 15) {
      setError("IMEI must be exactly 15 digits");
      return false;
    }
    if (!isValidIMEI(imeiValue)) {
      setError("Invalid IMEI (failed Luhn check)");
      return false;
    }
    setError("");
    return true;
  };

  const isValidIMEI = (imei) => {
    let sum = 0;
    let shouldDouble = false;
    for (let i = imei.length - 1; i >= 0; i--) {
      let digit = parseInt(imei.charAt(i));
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) {
          digit = digit - 9;
        }
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  };

  const handleSave = () => {
    if (!validateIMEI()) return;

    try {
      const imeiBytes = encodeBCD(imeiValue);
      const newBytes = [...packetBytes];
      imeiBytes.forEach((byte, index) => {
        newBytes[8 + index] = byte;
      });
      onPacketUpdate(newBytes);
      onIMEIChange(imeiValue);
      setOriginalIMEI(imeiValue);
      setIsEditing(false);
      setSuccessMsg("IMEI updated successfully!");
      setError("");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError("Failed to update IMEI: " + err.message);
    }
  };

  const handleReset = () => {
    setIMEIValue(originalIMEI);
    setError("");
    setSuccessMsg("");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(imeiValue).then(() => {
      setSuccessMsg("IMEI copied to clipboard!");
      setTimeout(() => setSuccessMsg(""), 2000);
    });
  };

  if (!packetBytes || packetBytes.length < 16) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary">
          No packet data available for IMEI editing
        </Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={3}>
      <Box p={3}>
        <Typography variant="h5" gutterBottom>
          IMEI Editor
        </Typography>

        {/* Info */}
        <Box mb={3}>
          <Typography variant="body2" color="text.secondary">
            The IMEI (International Mobile Equipment Identity) is a 15-digit
            unique identifier stored in BCD format in bytes 8-15 of the packet.
          </Typography>
        </Box>

        {/* Current IMEI Display */}
        <Box mb={3} p={2} sx={{ bgcolor: "action.selected", borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            Current IMEI in Packet
          </Typography>
          <Typography variant="h4" sx={{ fontFamily: "monospace" }}>
            {imeiValue || "Not available"}
          </Typography>
          <Box mt={2} display="flex" gap={2}>
            <Tooltip title="Copy IMEI">
              <IconButton onClick={handleCopy} disabled={!imeiValue}>
                <ContentCopy />
              </IconButton>
            </Tooltip>
            <Tooltip title="Reset to Original">
              <IconButton
                onClick={handleReset}
                disabled={imeiValue === originalIMEI}
              >
                <Reset />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Editing Interface */}
        {!isEditing ? (
          <Box>
            <Button
              variant="outlined"
              onClick={() => setIsEditing(true)}
              sx={{ mb: 2 }}
            >
              Edit IMEI
            </Button>
          </Box>
        ) : (
          <Box>
            <TextField
              label="IMEI (15 digits)"
              value={imeiValue}
              onChange={handleIMEIChange}
              error={Boolean(error)}
              helperText={error}
              inputProps={{ maxLength: 15 }}
              sx={{ mb: 2 }}
            />

            {successMsg && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {successMsg}
              </Alert>
            )}

            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button variant="outlined" onClick={handleReset}>
                Cancel
              </Button>
              <Button variant="contained" color="primary" onClick={handleSave}>
                Save Changes
                <SaveAlt fontSize="small" sx={{ ml: 1 }} />
              </Button>
            </Box>
          </Box>
        )}

        {/* Technical Details */}
        <Box mt={3} p={2} sx={{ bgcolor: "action.selected", borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            Technical Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Byte Position
              </Typography>
              <Typography variant="body2">Bytes 8-15 (0-indexed)</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Encoding
              </Typography>
              <Typography variant="body2">
                BCD (Binary Coded Decimal)
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Length
              </Typography>
              <Typography variant="body2">8 bytes → 15 digits</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Purpose
              </Typography>
              <Typography variant="body2">Device Identification</Typography>
            </Grid>
          </Grid>

          <Divider mx={2} my={2} />

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            How BCD Encoding Works:
          </Typography>
          <Typography variant="body2" sx={{ ml: 2, fontFamily: "monospace" }}>
            Each decimal digit (0-9) is stored in 4 bits (a nibble). Two digits
            fit in one byte: high nibble = first digit, low nibble = second
            digit. Example: IMEI "35337700" → Bytes: 0x53 0x33 0x77 0x00
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default IMEIEditor;
