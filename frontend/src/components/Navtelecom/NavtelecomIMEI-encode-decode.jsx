import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Grid,
  Divider,
  Alert,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Container,
} from "@mui/material";
import { ContentCopy, SwapVert } from "@mui/icons-material";

export default function NavtelecomIMEITool() {
  const [imei, setImei] = useState("866795033323864");
  const [hexString, setHexString] = useState("");
  const [breakdown, setBreakdown] = useState(null);
  const [error, setError] = useState("");
  const [copySuccess, setCopySuccess] = useState("");

  const stringToHex = (str) => {
    return Array.from(str)
      .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("");
  };

  const hexToString = (hex) => {
    let str = "";
    for (let i = 0; i < hex.length; i += 2) {
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return str;
  };

  const encodeIMEI = () => {
    try {
      setError("");
      setCopySuccess("");

      if (!imei || imei.length < 15) {
        setError("IMEI must be at least 15 digits");
        return;
      }

      const prefix = "404e5443";
      const messageType = "01";
      const zeros = "00000000000000"; // 7 bytes = 14 hex chars
      const imeiPrefix = "FM*>S:";
      const imeiPrefixHex = stringToHex(imeiPrefix);
      const imeiHex = stringToHex(imei);

      // Length is stored as 16-bit value: low byte first, then high byte (little-endian)
      const totalLength = imei.length + 4; // IMEI length + 4
      const lengthLowByte = (totalLength & 0xff).toString(16).padStart(2, "0");
      const lengthHighByte = ((totalLength >> 8) & 0xff)
        .toString(16)
        .padStart(2, "0");
      const lengthField = lengthLowByte + lengthHighByte;

      const fullHex =
        prefix + messageType + zeros + lengthField + imeiPrefixHex + imeiHex;

      setHexString(fullHex);
      setBreakdown({
        prefix: {
          value: prefix,
          decoded: "@NTC",
          description: "Protocol Header",
        },
        messageType: {
          value: messageType,
          decoded: "01",
          description: "Set IMEI Command",
        },
        reserved: {
          value: zeros,
          decoded: "(empty)",
          description: "Reserved Bytes",
        },
        length: {
          value: lengthField,
          decoded: `${totalLength} (IMEI+4)`,
          description: "Length Field (Little-Endian)",
        },
        imeiPrefix: {
          value: imeiPrefixHex,
          decoded: imeiPrefix,
          description: "IMEI Prefix",
        },
        imei: { value: imeiHex, decoded: imei, description: "IMEI Data" },
      });
    } catch (err) {
      setError("Error encoding IMEI: " + err.message);
    }
  };

  const decodeHex = () => {
    try {
      setError("");
      setCopySuccess("");

      if (!hexString || hexString.length < 32) {
        setError("Invalid hex string format");
        return;
      }

      const hex = hexString.toLowerCase();

      const prefix = hex.substring(0, 8);
      const messageType = hex.substring(8, 10);
      const reserved = hex.substring(10, 24); // 7 bytes after message type
      const lengthHex = hex.substring(24, 28);
      const dataHex = hex.substring(28);

      const decodedPrefix = hexToString(prefix);

      // Length is little-endian 16-bit: low byte + high byte
      const lengthValue =
        parseInt(lengthHex.substring(0, 2), 16) +
        (parseInt(lengthHex.substring(2, 4), 16) << 8);

      const decodedData = hexToString(dataHex);

      if (decodedPrefix !== "@NTC") {
        setError("Invalid Navtelecom header. Expected @NTC");
        return;
      }

      const imeiPrefixStr = "FM*>S:";
      let decodedIMEI = decodedData;
      let imeiPrefixHex = "";
      let imeiHex = dataHex;

      if (decodedData.startsWith(imeiPrefixStr)) {
        decodedIMEI = decodedData.substring(imeiPrefixStr.length);
        imeiPrefixHex = stringToHex(imeiPrefixStr);
        imeiHex = dataHex.substring(imeiPrefixHex.length);
      }

      setImei(decodedIMEI);
      setBreakdown({
        prefix: {
          value: prefix,
          decoded: decodedPrefix,
          description: "Protocol Header",
        },
        messageType: {
          value: messageType,
          decoded: messageType,
          description: "Message Type",
        },
        reserved: {
          value: reserved,
          decoded: "(empty)",
          description: "Reserved Bytes",
        },
        length: {
          value: lengthHex,
          decoded: `${lengthValue} (IMEI+4)`,
          description: "Length Field (Little-Endian)",
        },
        ...(imeiPrefixHex && {
          imeiPrefix: {
            value: imeiPrefixHex,
            decoded: imeiPrefixStr,
            description: "IMEI Prefix",
          },
        }),
        imei: {
          value: imeiHex,
          decoded: decodedIMEI,
          description: "IMEI Data",
        },
      });
    } catch (err) {
      setError("Error decoding hex string: " + err.message);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess("Copied to clipboard!");
      setTimeout(() => setCopySuccess(""), 2000);
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{ mb: 3, fontWeight: 600, color: "primary.main" }}
        >
          Navtelecom IMEI Encoder/Decoder
        </Typography>

        <Grid container spacing={3}>
          {/* IMEI Input Section */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, bgcolor: "primary.50" }}>
              <Typography variant="h6" gutterBottom color="primary">
                IMEI Input
              </Typography>
              <TextField
                fullWidth
                label="IMEI Number"
                value={imei}
                onChange={(e) => setImei(e.target.value.replace(/\D/g, ""))}
                placeholder="866795033323864"
                sx={{ mb: 2 }}
                inputProps={{ style: { fontFamily: "monospace" } }}
              />
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={encodeIMEI}
                  startIcon={<SwapVert />}
                  sx={{ bgcolor: "primary.main" }}
                >
                  Encode to Hex
                </Button>
                <Tooltip title="Copy IMEI">
                  <IconButton
                    onClick={() => copyToClipboard(imei)}
                    color="primary"
                  >
                    <ContentCopy />
                  </IconButton>
                </Tooltip>
              </Box>
            </Paper>
          </Grid>

          {/* Hex String Section */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, bgcolor: "success.50" }}>
              <Typography variant="h6" gutterBottom color="success.main">
                Hex String Output
              </Typography>
              <TextField
                fullWidth
                label="Navtelecom Hex String"
                value={hexString}
                onChange={(e) =>
                  setHexString(
                    e.target.value.toLowerCase().replace(/[^0-9a-f]/g, "")
                  )
                }
                placeholder="404e544301000000000000001300..."
                sx={{ mb: 2 }}
                multiline
                rows={3}
                inputProps={{
                  style: { fontFamily: "monospace", fontSize: "0.9rem" },
                }}
              />
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={decodeHex}
                  startIcon={<SwapVert />}
                  sx={{ bgcolor: "success.main" }}
                >
                  Decode from Hex
                </Button>
                <Tooltip title="Copy Hex">
                  <IconButton
                    onClick={() => copyToClipboard(hexString)}
                    color="success"
                  >
                    <ContentCopy />
                  </IconButton>
                </Tooltip>
              </Box>
            </Paper>
          </Grid>

          {/* Alerts */}
          {error && (
            <Grid item xs={12}>
              <Alert severity="error" onClose={() => setError("")}>
                {error}
              </Alert>
            </Grid>
          )}

          {copySuccess && (
            <Grid item xs={12}>
              <Alert severity="success" onClose={() => setCopySuccess("")}>
                {copySuccess}
              </Alert>
            </Grid>
          )}

          {/* Breakdown Table */}
          {breakdown && (
            <Grid item xs={12}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Protocol Breakdown
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <strong>Field</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Hex Value</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Decoded</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Description</strong>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(breakdown).map(([key, data]) => (
                        <TableRow key={key} hover>
                          <TableCell
                            sx={{ fontWeight: 600, textTransform: "uppercase" }}
                          >
                            {key}
                          </TableCell>
                          <TableCell
                            sx={{
                              fontFamily: "monospace",
                              fontSize: "0.9rem",
                              wordBreak: "break-all",
                            }}
                          >
                            {data.value}
                          </TableCell>
                          <TableCell
                            sx={{ color: "primary.main", fontWeight: 500 }}
                          >
                            {data.decoded}
                          </TableCell>
                          <TableCell>{data.description}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          )}

          {/* Info Section */}
          <Grid item xs={12}>
            <Paper elevation={1} sx={{ p: 2, bgcolor: "info.50" }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Protocol Structure:</strong> @NTC (4 bytes) + Message
                Type (1 byte) + Reserved (7 bytes) + Length Field (2 bytes, LE)
                + FM*&gt;S: (6 bytes) + IMEI Data (variable)
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}
