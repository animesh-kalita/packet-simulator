import React, { useState } from "react";
import { AlertCircle } from "lucide-react";

// MUI Imports
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Alert,
  AlertTitle,
  Stack,
} from "@mui/material";

// Function to replace lucide-react icon with a corresponding MUI icon
// Since the prompt explicitly used AlertCircle from lucide, we'll map it.
import MuiAlertCircle from "@mui/icons-material/InfoOutlined";
// Note: If you want to use the lucide icon style, you'd need the @mui/icons-material and @mui/material/SvgIcon imports
// and a custom component, but for simplicity and using built-in MUI components, InfoOutlined is a good replacement.

export default function TeltonikaDecoder() {
  const [hexInput, setHexInput] = useState(
    "000000000000007a08010000019aed154ee0012b2fee7d0e694e6f00ed00c7140000f01a07ef00f000150545010100b300ca1b0eb50009b6000642300f180000cde77bce14f3430fa34400000900d911ffc412ffb813ffe8c90267cb000003f100009e32c700000000100585704b020b00000000359895a60e00000001641f11020100009ebe"
  );
  const [decodedData, setDecodedData] = useState(null);

  // --- START: Original Logic Functions (NO CHANGE) ---

  const decodePacket = (hexString) => {
    try {
      const hex = hexString.replace(/\s/g, "");
      const bytes = [];
      for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substr(i, 2), 16));
      }
      let offset = 0;

      // Preamble (4 bytes)
      offset += 4;

      // Data field length (4 bytes)
      const dataLength =
        (bytes[offset] << 24) |
        (bytes[offset + 1] << 16) |
        (bytes[offset + 2] << 8) |
        bytes[offset + 3];
      offset += 4;

      // Codec ID (1 byte)
      const codecId = bytes[offset];
      offset += 1;

      // Number of records (1 byte)
      const numRecords = bytes[offset];
      offset += 1;

      // Process first record
      // Timestamp (8 bytes)
      let timestamp = 0;
      for (let i = 0; i < 8; i++) {
        timestamp = timestamp * 256 + bytes[offset + i];
      }
      offset += 8;

      // Priority (1 byte)
      const priority = bytes[offset];
      offset += 1;

      // GPS Element
      const longitude =
        ((bytes[offset] << 24) |
          (bytes[offset + 1] << 16) |
          (bytes[offset + 2] << 8) |
          bytes[offset + 3]) /
        10000000;
      offset += 4;
      const latitude =
        ((bytes[offset] << 24) |
          (bytes[offset + 1] << 16) |
          (bytes[offset + 2] << 8) |
          bytes[offset + 3]) /
        10000000;
      offset += 4;
      const altitude = (bytes[offset] << 8) | bytes[offset + 1];
      offset += 2;
      const angle = (bytes[offset] << 8) | bytes[offset + 1];
      offset += 2;
      const satellites = bytes[offset];
      offset += 1;
      const speed = (bytes[offset] << 8) | bytes[offset + 1];
      offset += 2;

      // IO Element
      const eventId = bytes[offset];
      offset += 1;
      const totalElements = bytes[offset];
      offset += 1;

      // 1-byte IO elements
      const num1Byte = bytes[offset];
      offset += 1;
      const ioElements1Byte = {};
      for (let i = 0; i < num1Byte; i++) {
        const ioId = bytes[offset];
        offset += 1;
        const ioValue = bytes[offset];
        offset += 1;
        ioElements1Byte[ioId] = ioValue;
      }

      // 2-byte IO elements
      const num2Byte = bytes[offset];
      offset += 1;
      const ioElements2Byte = {};
      for (let i = 0; i < num2Byte; i++) {
        const ioId = bytes[offset];
        offset += 1;
        const ioValue = (bytes[offset] << 8) | bytes[offset + 1];
        offset += 2;
        ioElements2Byte[ioId] = ioValue;
      }

      // 4-byte IO elements
      const num4Byte = bytes[offset];
      offset += 1;
      const ioElements4Byte = {};
      for (let i = 0; i < num4Byte; i++) {
        const ioId = bytes[offset];
        offset += 1;
        const ioValue =
          (bytes[offset] << 24) |
          (bytes[offset + 1] << 16) |
          (bytes[offset + 2] << 8) |
          bytes[offset + 3];
        offset += 4;
        ioElements4Byte[ioId] = ioValue;
      }

      // 8-byte IO elements
      const num8Byte = bytes[offset];
      offset += 1;
      const ioElements8Byte = {};
      for (let i = 0; i < num8Byte; i++) {
        const ioId = bytes[offset];
        offset += 1;
        let ioValue = 0;
        for (let j = 0; j < 8; j++) {
          ioValue = ioValue * 256 + bytes[offset + j];
        }
        offset += 8;
        ioElements8Byte[ioId] = ioValue;
      }

      // Digital inputs are typically in IO ID 1 (binary representation of DIN1-DIN4)
      const digitalInputs = ioElements1Byte[1] || 0;
      const din1 = (digitalInputs & 0x01) !== 0;
      const din2 = (digitalInputs & 0x02) !== 0;
      const din3 = (digitalInputs & 0x04) !== 0;
      const din4 = (digitalInputs & 0x08) !== 0;

      return {
        codecId,
        numRecords,
        timestamp: new Date(timestamp).toISOString(),
        priority,
        gps: {
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
          altitude,
          angle,
          satellites,
          speed,
        },
        io: {
          eventId,
          totalElements,
          elements1Byte: ioElements1Byte,
          elements2Byte: ioElements2Byte,
          elements4Byte: ioElements4Byte,
          elements8Byte: ioElements8Byte,
        },
        digitalInputs: {
          raw: digitalInputs,
          din1,
          din2,
          din3,
          din4,
        },
        byteInfo: {
          ioId1Location: findIOId1Location(hex),
          currentValue: digitalInputs.toString(16).padStart(2, "0"),
        },
      };
    } catch (error) {
      throw new Error("Failed to decode packet: " + error.message);
    }
  };

  const findIOId1Location = (hex) => {
    // Find where IO ID 1 appears in the hex string
    const matches = [];
    for (let i = 0; i < hex.length - 4; i += 2) {
      if (hex.substr(i, 2) === "01" && hex.substr(i + 2, 2) === "01") {
        matches.push(i);
      }
    }
    return matches;
  };

  const handleDecode = () => {
    try {
      const decoded = decodePacket(hexInput);
      setDecodedData(decoded);
    } catch (error) {
      // Use MUI Alert for the error
      alert("Error: " + error.message);
    }
  };

  const toggleDIN1 = () => {
    try {
      const hex = hexInput.replace(/\s/g, "");
      const decoded = decodePacket(hex);
      const currentValue = decoded.digitalInputs.raw;

      // Toggle bit 0 (DIN1)
      const newValue = currentValue ^ 0x01;
      const newHex = newValue.toString(16).padStart(2, "0");

      // Find and replace the IO element value
      // Pattern: 0101XX where XX is the current value
      const pattern = "0101" + decoded.byteInfo.currentValue;
      const replacement = "0101" + newHex;

      const newHexString = hex.replace(pattern, replacement);
      setHexInput(newHexString);

      // Auto-decode the new packet
      setTimeout(() => {
        const newDecoded = decodePacket(newHexString);
        setDecodedData(newDecoded);
      }, 100);
    } catch (error) {
      // Use MUI Alert for the error
      alert("Error toggling DIN1: " + error.message);
    }
  };

  // --- END: Original Logic Functions (NO CHANGE) ---

  // Helper component to render key/value pairs
  const DataRow = ({ label, value }) => (
    <Grid item xs={12} sm={6}>
      <Typography variant="body2" component="span" fontWeight="medium">
        {label}:
      </Typography>
      <Typography variant="body2" component="span" sx={{ ml: 1 }}>
        {value}
      </Typography>
    </Grid>
  );

  return (
    <Box sx={{ minHeight: "100vh", py: 3, bgcolor: "background.default" }}>
      <Container maxWidth="md">
        {/* Input Card */}
        <Paper elevation={4} sx={{ p: 3, mb: 4 }}>
          <Typography
            variant="h5"
            component="h1"
            gutterBottom
            fontWeight="bold"
            color="text.primary"
          >
            Teltonika AVL Packet Decoder
          </Typography>

          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom>
              Hex Packet Data
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={hexInput}
              onChange={(e) => setHexInput(e.target.value)}
              placeholder="Enter hex packet data..."
              variant="outlined"
              size="small"
              inputProps={{
                style: { fontFamily: "monospace", fontSize: "0.875rem" },
              }}
            />
          </Box>

          <Stack direction="row" spacing={2}>
            <Button onClick={handleDecode} variant="contained" color="primary">
              Decode Packet
            </Button>
            <Button onClick={toggleDIN1} variant="contained" color="success">
              Toggle DIN1
            </Button>
          </Stack>
        </Paper>

        {/* Decoded Data Output */}
        {decodedData && (
          <Paper elevation={4} sx={{ p: 3 }}>
            <Typography
              variant="h6"
              component="h2"
              gutterBottom
              fontWeight="bold"
              color="text.primary"
            >
              Decoded Data
            </Typography>

            <Stack spacing={3}>
              {/* Digital Inputs Card */}
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  bgcolor: "primary.light",
                  border: "1px solid",
                  borderColor: "primary.main",
                  opacity: 0.9,
                }}
              >
                <Typography
                  variant="subtitle1"
                  fontWeight="semibold"
                  color="text.primary"
                  mb={1}
                >
                  Digital Inputs
                </Typography>
                <Grid container spacing={1} sx={{ fontSize: "0.875rem" }}>
                  {[
                    { key: "din1", label: "DIN1" },
                    { key: "din2", label: "DIN2" },
                    { key: "din3", label: "DIN3" },
                    { key: "din4", label: "DIN4" },
                  ].map(({ key, label }) => (
                    <Grid item xs={6} key={key}>
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 1,
                          bgcolor: decodedData.digitalInputs[key]
                            ? "success.main"
                            : "error.main",
                          color: "white",
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography variant="body2" fontWeight="medium">
                          {label}:
                        </Typography>
                        <Typography variant="body2">
                          {decodedData.digitalInputs[key] ? "TRUE" : "FALSE"}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: "block" }}
                >
                  Raw value: 0x
                  {decodedData.digitalInputs.raw.toString(16).padStart(2, "0")}
                </Typography>
              </Paper>

              {/* GPS Data Card */}
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  bgcolor: "success.light",
                  border: "1px solid",
                  borderColor: "success.main",
                  opacity: 0.9,
                }}
              >
                <Typography
                  variant="subtitle1"
                  fontWeight="semibold"
                  color="text.primary"
                  mb={1}
                >
                  GPS Data
                </Typography>
                <Grid container spacing={1}>
                  <DataRow
                    label="Latitude"
                    value={`${decodedData.gps.latitude}°`}
                  />
                  <DataRow
                    label="Longitude"
                    value={`${decodedData.gps.longitude}°`}
                  />
                  <DataRow
                    label="Altitude"
                    value={`${decodedData.gps.altitude}m`}
                  />
                  <DataRow
                    label="Speed"
                    value={`${decodedData.gps.speed} km/h`}
                  />
                  <DataRow label="Angle" value={`${decodedData.gps.angle}°`} />
                  <DataRow
                    label="Satellites"
                    value={decodedData.gps.satellites}
                  />
                </Grid>
              </Paper>

              {/* Packet Info Card */}
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  bgcolor: "warning.light",
                  border: "1px solid",
                  borderColor: "warning.main",
                  opacity: 0.9,
                }}
              >
                <Typography
                  variant="subtitle1"
                  fontWeight="semibold"
                  color="text.primary"
                  mb={1}
                >
                  Packet Info
                </Typography>
                <Stack spacing={0.5} sx={{ fontSize: "0.875rem" }}>
                  <DataRow label="Codec ID" value={decodedData.codecId} />
                  <DataRow label="Records" value={decodedData.numRecords} />
                  <DataRow label="Timestamp" value={decodedData.timestamp} />
                  <DataRow label="Priority" value={decodedData.priority} />
                </Stack>
              </Paper>

              {/* IO Elements Card */}
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  bgcolor: "grey.100",
                  border: "1px solid",
                  borderColor: "grey.500",
                  opacity: 0.9,
                }}
              >
                <Typography
                  variant="subtitle1"
                  fontWeight="semibold"
                  color="text.primary"
                  mb={1}
                >
                  IO Elements
                </Typography>
                <Stack spacing={1} sx={{ fontSize: "0.75rem" }}>
                  {Object.keys(decodedData.io.elements1Byte).length > 0 && (
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        1-byte elements:
                      </Typography>
                      <Box
                        component="pre"
                        sx={{
                          ml: 1,
                          overflowX: "auto",
                          bgcolor: "background.paper",
                          p: 1,
                          borderRadius: 1,
                        }}
                      >
                        {JSON.stringify(decodedData.io.elements1Byte, null, 2)}
                      </Box>
                    </Box>
                  )}
                  {Object.keys(decodedData.io.elements2Byte).length > 0 && (
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        2-byte elements:
                      </Typography>
                      <Box
                        component="pre"
                        sx={{
                          ml: 1,
                          overflowX: "auto",
                          bgcolor: "background.paper",
                          p: 1,
                          borderRadius: 1,
                        }}
                      >
                        {JSON.stringify(decodedData.io.elements2Byte, null, 2)}
                      </Box>
                    </Box>
                  )}
                  {Object.keys(decodedData.io.elements4Byte).length > 0 && (
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        4-byte elements:
                      </Typography>
                      <Box
                        component="pre"
                        sx={{
                          ml: 1,
                          overflowX: "auto",
                          bgcolor: "background.paper",
                          p: 1,
                          borderRadius: 1,
                        }}
                      >
                        {JSON.stringify(decodedData.io.elements4Byte, null, 2)}
                      </Box>
                    </Box>
                  )}
                </Stack>
              </Paper>
            </Stack>
          </Paper>
        )}

        {/* Instructions Alert */}
        <Alert
          severity="info"
          sx={{ mt: 4 }}
          icon={<MuiAlertCircle fontSize="inherit" />}
        >
          <AlertTitle sx={{ fontWeight: "bold" }}>How to use:</AlertTitle>
          <Box
            component="ul"
            sx={{ m: 0, pl: 2, "& li": { mt: 0.5, fontSize: "0.875rem" } }}
          >
            <li>Click **Decode Packet** to see the current state</li>
            <li>
              Click **Toggle DIN1** to change Digital Input 1 from FALSE to TRUE
              (or vice versa)
            </li>
            <li>The hex string will be automatically updated</li>
            <li>Copy the modified hex string to send to your device</li>
          </Box>
        </Alert>
      </Container>
    </Box>
  );
}
