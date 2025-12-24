// TeltonikaTools.jsx
import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  TextField,
  Button,
  IconButton,
  Snackbar,
  Typography,
  Alert,
  Chip,
  Divider,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

// Helper function to check if string is valid hex
function isHexString(str) {
  return /^[0-9a-fA-F]+$/.test(str) && str.length % 2 === 0;
}

function asciiToHex(str) {
  let hex = "";
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    hex += charCode.toString(16).padStart(2, "0");
  }
  return hex;
}

export function PrefixHexGenerator() {
  const [asciiInput, setAsciiInput] = useState("");
  const [asciiOutput, setAsciiOutput] = useState("");
  const [hexInput, setHexInput] = useState("");
  const [hexOutput, setHexOutput] = useState("");
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const handleAsciiConvert = () => {
    const trimmed = asciiInput.trim();
    if (!trimmed) {
      setAsciiOutput("");
      return;
    }

    const hex = asciiToHex(trimmed);
    const lengthBytes = hex.length / 2;
    const prefix = lengthBytes.toString(16).padStart(4, "0");
    setAsciiOutput(prefix + hex);
  };

  const handleHexConvert = () => {
    const cleaned = hexInput.replace(/\s+/g, "").toLowerCase();
    if (!cleaned) {
      setHexOutput("");
      return;
    }

    if (!/^[0-9a-f]+$/.test(cleaned)) {
      setHexOutput("Error: Invalid hex string");
      return;
    }

    const lengthBytes = cleaned.length / 2;
    const prefix = lengthBytes.toString(16).padStart(4, "0");
    setHexOutput(prefix + cleaned);
  };

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setToastMessage(`${label} copied to clipboard`);
    setToastOpen(true);
  };

  return (
    <Card variant="outlined" sx={{ p: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Prefix + Hex Generator
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Convert ASCII or HEX to prefixed hex format. Length prefix is
          automatically calculated.
        </Typography>

        <Stack spacing={3} mt={3}>
          {/* ASCII Section */}
          <Box>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              ASCII to Prefixed Hex
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Example: <b>7002238281</b> → <code>000a37303032323338323831</code>
            </Typography>
            <Stack spacing={2} mt={2}>
              <TextField
                label="ASCII Input (e.g. IMEI)"
                value={asciiInput}
                onChange={(e) => setAsciiInput(e.target.value)}
                fullWidth
                placeholder="7002238281"
              />
              <Box display="flex" justifyContent="center">
                <Button
                  variant="contained"
                  onClick={handleAsciiConvert}
                  sx={{ width: "180px" }}
                >
                  Convert ASCII
                </Button>
              </Box>
              {asciiOutput && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    label="Output"
                    value={asciiOutput}
                    InputProps={{
                      readOnly: true,
                      style: { fontFamily: "monospace" },
                    }}
                    fullWidth
                  />
                  <IconButton
                    onClick={() => handleCopy(asciiOutput, "ASCII output")}
                  >
                    <ContentCopyIcon />
                  </IconButton>
                </Stack>
              )}
            </Stack>
          </Box>

          <Divider />

          {/* HEX Section */}
          <Box>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              HEX to Prefixed Hex
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Example: <b>37303032323338323831</b> →{" "}
              <code>000a37303032323338323831</code>
            </Typography>
            <Stack spacing={2} mt={2}>
              <TextField
                label="HEX Input"
                value={hexInput}
                onChange={(e) => setHexInput(e.target.value)}
                fullWidth
                placeholder="37303032323338323831"
              />
              <Box display="flex" justifyContent="center">
                <Button
                  variant="contained"
                  onClick={handleHexConvert}
                  sx={{ width: "180px" }}
                >
                  Convert HEX
                </Button>
              </Box>
              {hexOutput && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    label="Output"
                    value={hexOutput}
                    InputProps={{
                      readOnly: true,
                      style: { fontFamily: "monospace" },
                    }}
                    fullWidth
                  />
                  <IconButton
                    onClick={() => handleCopy(hexOutput, "HEX output")}
                  >
                    <ContentCopyIcon />
                  </IconButton>
                </Stack>
              )}
            </Stack>
          </Box>
        </Stack>

        <Snackbar
          open={toastOpen}
          autoHideDuration={1400}
          onClose={() => setToastOpen(false)}
          message={toastMessage}
        />
      </CardContent>
    </Card>
  );
}

export function TeltonikaPacketSplitter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState([]);
  const [error, setError] = useState("");
  const [toastOpen, setToastOpen] = useState(false);

  const handleSplit = () => {
    setError("");
    setOutput([]);

    let raw = (input || "").replace(/\s+/g, "").toLowerCase();

    if (!raw) {
      setError("Input required (raw teltonika hex stream).");
      return;
    }

    if (!/^[0-9a-f]+$/.test(raw)) {
      setError("Input contains non-hex characters.");
      return;
    }

    const packets = [];
    let position = 0;

    // Remove IMEI if present at the beginning
    if (raw.length > 12) {
      const imeiLenBytes = parseInt(raw.slice(0, 4), 16);
      if (imeiLenBytes > 0 && imeiLenBytes < 20) {
        const imeiHexLen = imeiLenBytes * 2;
        const imeiPacket = raw.slice(0, 4 + imeiHexLen);
        const imeiAscii = raw
          .slice(4, 4 + imeiHexLen)
          .match(/.{2}/g)
          .map((h) => String.fromCharCode(parseInt(h, 16)))
          .join("");
        packets.push({
          type: "IMEI",
          hex: imeiPacket,
          imei: imeiAscii,
        });
        position = 4 + imeiHexLen;
      }
    }

    // Parse AVL packets
    while (position < raw.length - 16) {
      // Look for preamble 00000000
      const preambleIndex = raw.indexOf("00000000", position);

      if (preambleIndex === -1) {
        break;
      }

      // Read data length (4 bytes after preamble)
      const lengthHex = raw.slice(preambleIndex + 8, preambleIndex + 16);
      const dataLength = parseInt(lengthHex, 16);

      if (isNaN(dataLength) || dataLength <= 0 || dataLength > 10000) {
        position = preambleIndex + 8;
        continue;
      }

      // Calculate total packet size: preamble(4) + length(4) + data(dataLength) + crc(4)
      const totalBytes = 4 + 4 + dataLength + 4;
      const totalHexChars = totalBytes * 2;

      // Extract complete packet
      const packetHex = raw.slice(preambleIndex, preambleIndex + totalHexChars);

      if (packetHex.length === totalHexChars) {
        // Parse codec and record count
        const codecId = packetHex.slice(16, 18);
        const recordCount = parseInt(packetHex.slice(18, 20), 16);

        packets.push({
          type: "AVL",
          hex: packetHex,
          codec: codecId,
          records: recordCount,
          length: dataLength,
        });

        position = preambleIndex + totalHexChars;
      } else {
        position = preambleIndex + 8;
      }
    }

    if (packets.length === 0) {
      setError(
        "No valid packets found. Check if input is correct Teltonika format."
      );
      return;
    }

    setOutput(packets);
  };

  const handleCopy = async () => {
    const textToCopy = output.map((p) => p.hex).join("\n");
    await navigator.clipboard.writeText(textToCopy);
    setToastOpen(true);
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Teltonika Packet Splitter
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Paste concatenated Teltonika AVL hex stream. Extracts IMEI and
          individual AVL packets.
        </Typography>

        <Stack spacing={3} mt={2}>
          <TextField
            label="Raw Teltonika Hex Stream"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            fullWidth
            multiline
            minRows={4}
            placeholder="paste hex here (spaces/newlines allowed)"
            error={!!error}
            helperText={error || ""}
          />

          <Box display="flex" justifyContent="center">
            <Button
              variant="contained"
              onClick={handleSplit}
              sx={{ width: "220px" }}
            >
              Split Packets
            </Button>
          </Box>

          {output.length > 0 && (
            <Stack spacing={2}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="subtitle1">
                  Found {output.length} packet(s)
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<ContentCopyIcon />}
                  onClick={handleCopy}
                  size="small"
                >
                  Copy All
                </Button>
              </Box>

              {output.map((packet, idx) => (
                <Card key={idx} variant="outlined">
                  <CardContent>
                    <Stack spacing={1}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle2">
                          {packet.type === "IMEI"
                            ? "📱 IMEI Packet"
                            : `📦 AVL Packet ${idx}`}
                        </Typography>
                        {packet.type === "AVL" && (
                          <Stack direction="row" spacing={1}>
                            <Chip
                              label={`Codec: ${packet.codec}`}
                              size="small"
                            />
                            <Chip
                              label={`Records: ${packet.records}`}
                              size="small"
                              color="primary"
                            />
                            <Chip
                              label={`${packet.length} bytes`}
                              size="small"
                            />
                          </Stack>
                        )}
                        {packet.type === "IMEI" && (
                          <Chip
                            label={`IMEI: ${packet.imei}`}
                            size="small"
                            color="secondary"
                          />
                        )}
                      </Box>
                      <TextField
                        value={packet.hex}
                        InputProps={{
                          readOnly: true,
                          style: {
                            fontFamily: "monospace",
                            fontSize: "0.85rem",
                          },
                        }}
                        fullWidth
                        multiline
                        maxRows={6}
                      />
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Stack>

        <Snackbar
          open={toastOpen}
          autoHideDuration={2000}
          onClose={() => setToastOpen(false)}
          message="Copied to clipboard"
        />
      </CardContent>
    </Card>
  );
}

export default function TeltonikaTools() {
  return (
    <Stack spacing={4} mr={5}>
      <PrefixHexGenerator />
      <TeltonikaPacketSplitter />
    </Stack>
  );
}
