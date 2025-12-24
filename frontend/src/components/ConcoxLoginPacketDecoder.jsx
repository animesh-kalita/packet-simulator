import React, { useState, useEffect } from "react";
import { TextField, Paper, Typography, Box, Chip, Alert } from "@mui/material";

const ConcoxLoginPacketDecoder = () => {
  const [loginPacket, setLoginPacket] = useState("");
  const [decodedData, setDecodedData] = useState(null);
  const [error, setError] = useState("");

  const decodeImei = (imeiHex) => {
    try {
      // imeiHex should be 16 hex characters (8 bytes)
      if (imeiHex.length !== 16) {
        return null;
      }

      let imei = "";

      // First byte: extract lower nibble (first digit)
      const firstByte = parseInt(imeiHex.substring(0, 2), 16);
      imei += (firstByte & 0x0f).toString();

      // Remaining 7 bytes: extract both nibbles (2 digits per byte)
      for (let i = 2; i < 16; i += 2) {
        const byte = parseInt(imeiHex.substring(i, i + 2), 16);
        const highNibble = (byte & 0xf0) >> 4;
        const lowNibble = byte & 0x0f;
        imei += highNibble.toString() + lowNibble.toString();
      }

      return imei;
    } catch (e) {
      return null;
    }
  };

  const verifyCRC = (packet) => {
    try {
      const table = [
        0x0000, 0x1189, 0x2312, 0x329b, 0x4624, 0x57ad, 0x6536, 0x74bf, 0x8c48,
        0x9dc1, 0xaf5a, 0xbed3, 0xca6c, 0xdbe5, 0xe97e, 0xf8f7, 0x1081, 0x0108,
        0x3393, 0x221a, 0x56a5, 0x472c, 0x75b7, 0x643e, 0x9cc9, 0x8d40, 0xbfdb,
        0xae52, 0xdaed, 0xcb64, 0xf9ff, 0xe876, 0x2102, 0x308b, 0x0210, 0x1399,
        0x6726, 0x76af, 0x4434, 0x55bd, 0xad4a, 0xbcc3, 0x8e58, 0x9fd1, 0xeb6e,
        0xfae7, 0xc87c, 0xd9f5, 0x3183, 0x200a, 0x1291, 0x0318, 0x77a7, 0x662e,
        0x54b5, 0x453c, 0xbdcb, 0xac42, 0x9ed9, 0x8f50, 0xfbef, 0xea66, 0xd8fd,
        0xc974, 0x4204, 0x538d, 0x6116, 0x709f, 0x0420, 0x15a9, 0x2732, 0x36bb,
        0xce4c, 0xdfc5, 0xed5e, 0xfcd7, 0x8868, 0x99e1, 0xab7a, 0xbaf3, 0x5285,
        0x430c, 0x7197, 0x601e, 0x14a1, 0x0528, 0x37b3, 0x263a, 0xdecd, 0xcf44,
        0xfddf, 0xec56, 0x98e9, 0x8960, 0xbbfb, 0xaa72, 0x6306, 0x728f, 0x4014,
        0x519d, 0x2522, 0x34ab, 0x0630, 0x17b9, 0xef4e, 0xfec7, 0xcc5c, 0xddd5,
        0xa96a, 0xb8e3, 0x8a78, 0x9bf1, 0x7387, 0x620e, 0x5095, 0x411c, 0x35a3,
        0x242a, 0x16b1, 0x0738, 0xffcf, 0xee46, 0xdcdd, 0xcd54, 0xb9eb, 0xa862,
        0x9af9, 0x8b70, 0x8408, 0x9581, 0xa71a, 0xb693, 0xc22c, 0xd3a5, 0xe13e,
        0xf0b7, 0x0840, 0x19c9, 0x2b52, 0x3adb, 0x4e64, 0x5fed, 0x6d76, 0x7cff,
        0x9489, 0x8500, 0xb79b, 0xa612, 0xd2ad, 0xc324, 0xf1bf, 0xe036, 0x18c1,
        0x0948, 0x3bd3, 0x2a5a, 0x5ee5, 0x4f6c, 0x7df7, 0x6c7e, 0xa50a, 0xb483,
        0x8618, 0x9791, 0xe32e, 0xf2a7, 0xc03c, 0xd1b5, 0x2942, 0x38cb, 0x0a50,
        0x1bd9, 0x6f66, 0x7eef, 0x4c74, 0x5dfd, 0xb58b, 0xa402, 0x9699, 0x8710,
        0xf3af, 0xe226, 0xd0bd, 0xc134, 0x39c3, 0x284a, 0x1ad1, 0x0b58, 0x7fe7,
        0x6e6e, 0x5cf5, 0x4d7c, 0xc60c, 0xd785, 0xe51e, 0xf497, 0x8028, 0x91a1,
        0xa33a, 0xb2b3, 0x4a44, 0x5bcd, 0x6956, 0x78df, 0x0c60, 0x1de9, 0x2f72,
        0x3efb, 0xd68d, 0xc704, 0xf59f, 0xe416, 0x90a9, 0x8120, 0xb3bb, 0xa232,
        0x5ac5, 0x4b4c, 0x79d7, 0x685e, 0x1ce1, 0x0d68, 0x3ff3, 0x2e7a, 0xe70e,
        0xf687, 0xc41c, 0xd595, 0xa12a, 0xb0a3, 0x8238, 0x93b1, 0x6b46, 0x7acf,
        0x4854, 0x59dd, 0x2d62, 0x3ceb, 0x0e70, 0x1ff9, 0xf78f, 0xe606, 0xd49d,
        0xc514, 0xb1ab, 0xa022, 0x92b9, 0x8330, 0x7bc7, 0x6a4e, 0x58d5, 0x495c,
        0x3de3, 0x2c6a, 0x1ef1, 0x0f78,
      ];

      // Extract CRC data (from length to serial number, excluding start bits and end bits)
      const crcData = packet.substring(4, packet.length - 8);
      const providedCRC = packet.substring(
        packet.length - 8,
        packet.length - 4
      );

      const bytes = [];
      for (let i = 0; i < crcData.length; i += 2) {
        bytes.push(parseInt(crcData.substr(i, 2), 16));
      }

      let crc = 0xffff;
      for (let i = 0; i < bytes.length; i++) {
        const j = (crc ^ bytes[i]) & 0xff;
        crc = (crc >> 8) ^ table[j];
      }

      crc = crc ^ 0xffff;
      const calculatedCRC = crc.toString(16).padStart(4, "0");

      return {
        provided: providedCRC,
        calculated: calculatedCRC,
        valid: providedCRC.toLowerCase() === calculatedCRC.toLowerCase(),
      };
    } catch (e) {
      return { provided: "", calculated: "", valid: false };
    }
  };

  const decodeLoginPacket = (packet) => {
    try {
      // Remove spaces and convert to lowercase
      const cleanPacket = packet.replace(/\s/g, "").toLowerCase();

      // Validate minimum length (44 hex chars = 22 bytes)
      if (cleanPacket.length < 44) {
        setError("Packet too short. Expected at least 44 hex characters.");
        setDecodedData(null);
        return;
      }

      // Validate hex characters
      if (!/^[0-9a-f]+$/i.test(cleanPacket)) {
        setError("Invalid characters. Only hexadecimal characters allowed.");
        setDecodedData(null);
        return;
      }

      // Parse packet structure
      const startBits = cleanPacket.substring(0, 4);
      const length = cleanPacket.substring(4, 6);
      const packetType = cleanPacket.substring(6, 8);
      const imeiHex = cleanPacket.substring(8, 24);
      const terminalInfo = cleanPacket.substring(24, 28);
      const reserved = cleanPacket.substring(28, 32);
      const serialNo = cleanPacket.substring(32, 36);
      const crc = cleanPacket.substring(36, 40);
      const endBits = cleanPacket.substring(40, 44);

      // Validate start and end bits
      if (startBits !== "7878") {
        setError("Invalid start bits. Expected 7878, got " + startBits);
        setDecodedData(null);
        return;
      }

      if (endBits !== "0d0a") {
        setError("Invalid end bits. Expected 0d0a, got " + endBits);
        setDecodedData(null);
        return;
      }

      // Validate packet type
      if (packetType !== "01") {
        setError(
          "Not a login packet. Packet type: " + packetType + " (expected 01)"
        );
        setDecodedData(null);
        return;
      }

      // Decode IMEI
      const imei = decodeImei(imeiHex);
      if (!imei) {
        setError("Failed to decode IMEI from hex: " + imeiHex);
        setDecodedData(null);
        return;
      }

      // Verify CRC
      const crcCheck = verifyCRC(cleanPacket);

      setError("");
      setDecodedData({
        startBits,
        length: parseInt(length, 16),
        packetType,
        imeiHex,
        imei,
        terminalInfo,
        reserved,
        serialNo: parseInt(serialNo, 16),
        crc,
        crcCheck,
        endBits,
        rawPacket: cleanPacket,
      });
    } catch (e) {
      setError("Error decoding packet: " + e.message);
      setDecodedData(null);
    }
  };

  useEffect(() => {
    if (loginPacket.trim()) {
      decodeLoginPacket(loginPacket);
    } else {
      setDecodedData(null);
      setError("");
    }
  }, [loginPacket]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Box sx={{ maxWidth: 700, padding: 2 }}>
      <Paper elevation={3} sx={{ padding: 3 }}>
        <Typography variant="h5" gutterBottom>
          Concox Login Packet Decoder
        </Typography>

        <TextField
          fullWidth
          label="Login Packet (Hex)"
          variant="outlined"
          value={loginPacket}
          onChange={(e) => setLoginPacket(e.target.value)}
          placeholder="787811010867440066769878806600010479dae40d0a"
          multiline
          rows={2}
          helperText="Paste the hex login packet to decode"
          sx={{ marginTop: 2, marginBottom: 3 }}
        />

        {error && (
          <Alert severity="error" sx={{ marginBottom: 2 }}>
            {error}
          </Alert>
        )}

        {decodedData && (
          <Box>
            <Paper
              variant="outlined"
              sx={{
                padding: 2,
                // backgroundColor: "#e8f5e9",
                marginBottom: 3,
              }}
            >
              <Typography variant="h6" gutterBottom>
                Decoded IMEI
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontFamily: "monospace",
                  cursor: "pointer",
                  "&:hover": { backgroundColor: "#c8e6c9" },
                  padding: 1,
                  borderRadius: 1,
                }}
                onClick={() => copyToClipboard(decodedData.imei)}
              >
                {decodedData.imei}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Click to copy
              </Typography>
            </Paper>

            <Box sx={{ marginBottom: 3 }}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Packet Breakdown:
              </Typography>
              <Box
                sx={{ display: "flex", flexWrap: "wrap", gap: 1, marginTop: 1 }}
              >
                <Chip label={`Start: ${decodedData.startBits}`} size="small" />
                <Chip label={`Length: ${decodedData.length}`} size="small" />
                <Chip
                  label={`Type: ${decodedData.packetType} (Login)`}
                  size="small"
                />
                <Chip
                  label={`IMEI Hex: ${decodedData.imeiHex}`}
                  size="small"
                  color="primary"
                />
                <Chip
                  label={`Terminal Info: ${decodedData.terminalInfo}`}
                  size="small"
                />
                <Chip
                  label={`Reserved: ${decodedData.reserved}`}
                  size="small"
                />
                <Chip label={`Serial: ${decodedData.serialNo}`} size="small" />
                <Chip
                  label={`CRC: ${decodedData.crc}`}
                  size="small"
                  color={decodedData.crcCheck.valid ? "success" : "error"}
                />
                <Chip label={`End: ${decodedData.endBits}`} size="small" />
              </Box>
            </Box>

            <Box sx={{ marginBottom: 2 }}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                CRC Verification:
              </Typography>
              <Alert
                severity={decodedData.crcCheck.valid ? "success" : "error"}
              >
                <Typography variant="body2">
                  <strong>Provided CRC:</strong> {decodedData.crcCheck.provided}
                  <br />
                  <strong>Calculated CRC:</strong>{" "}
                  {decodedData.crcCheck.calculated}
                  <br />
                  <strong>Status:</strong>{" "}
                  {decodedData.crcCheck.valid ? "✓ Valid" : "✗ Invalid"}
                </Typography>
              </Alert>
            </Box>

            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                IMEI Decoding Process:
              </Typography>
              <Paper variant="outlined" sx={{ padding: 2 }}>
                <Typography
                  variant="body2"
                  sx={{ fontFamily: "monospace", fontSize: "12px" }}
                >
                  Hex: {decodedData.imeiHex}
                  <br />
                  First byte ({decodedData.imeiHex.substring(0, 2)}): Lower
                  nibble = {decodedData.imei[0]}
                  <br />
                  Remaining bytes: Each byte → 2 digits
                  <br />
                  Result: {decodedData.imei}
                </Typography>
              </Paper>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ConcoxLoginPacketDecoder;
