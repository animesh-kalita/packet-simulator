import React, { useState, useEffect } from "react";
import { TextField, Paper, Typography, Box, Chip } from "@mui/material";

const ConcoxLoginPacketGenerator = () => {
  const [imei, setImei] = useState("");
  const [loginPacket, setLoginPacket] = useState("");
  const [error, setError] = useState("");

  const encodeImei = (imeiStr) => {
    // Remove any non-digit characters
    const cleanImei = imeiStr.replace(/\D/g, "");

    if (cleanImei.length === 0) {
      return null;
    }

    // Pad IMEI to 15 digits with leading zeros if shorter
    const paddedImei = cleanImei.padStart(15, "0");

    // If longer than 15, truncate to 15 digits
    const finalImei = paddedImei.substring(0, 15);

    let encoded = "";

    // First byte: high nibble is 0, low nibble is first digit
    encoded += "0" + finalImei[0];

    // Remaining 7 bytes: pack two digits per byte
    for (let i = 1; i < 15; i += 2) {
      encoded += finalImei[i] + finalImei[i + 1];
    }

    return { encoded, finalImei };
  };

  const calculateCRC = (data) => {
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

    const bytes = [];
    for (let i = 0; i < data.length; i += 2) {
      bytes.push(parseInt(data.substr(i, 2), 16));
    }

    let crc = 0xffff;
    for (let i = 0; i < bytes.length; i++) {
      const j = (crc ^ bytes[i]) & 0xff;
      crc = (crc >> 8) ^ table[j];
    }

    crc = crc ^ 0xffff;
    return crc.toString(16).padStart(4, "0");
  };

  const generateLoginPacket = (imeiStr) => {
    const result = encodeImei(imeiStr);

    if (!result) {
      setError("Please enter at least one digit");
      setLoginPacket("");
      return;
    }

    const { encoded: encodedImei, finalImei } = result;
    const cleanImei = imeiStr.replace(/\D/g, "");

    // Show info about padding/truncation
    if (cleanImei.length < 15) {
      setError(`IMEI padded with leading zeros: ${cleanImei} → ${finalImei}`);
    } else if (cleanImei.length > 15) {
      setError(`IMEI truncated to 15 digits: ${cleanImei} → ${finalImei}`);
    } else {
      setError("");
    }

    // Packet structure
    const startBits = "7878";
    const length = "11";
    const packetType = "01";
    const terminalInfo = "8066";
    const reserved = "0001";
    const serialNo = "0001";
    const endBits = "0d0a";

    // Data for CRC calculation (length + type + imei + info + reserved + serial)
    const crcData =
      length + packetType + encodedImei + terminalInfo + reserved + serialNo;
    const crc = calculateCRC(crcData);

    // Complete packet
    const packet = startBits + crcData + crc + endBits;
    setLoginPacket(packet);
  };

  useEffect(() => {
    if (imei) {
      generateLoginPacket(imei);
    } else {
      setLoginPacket("");
      setError("");
    }
  }, [imei]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(loginPacket);
  };

  return (
    <Box sx={{ maxWidth: 600, margin: "40px auto", padding: 2 }}>
      <Paper elevation={3} sx={{ padding: 3 }}>
        <Typography variant="h5" gutterBottom>
          Concox Login Packet Generator
        </Typography>

        <TextField
          fullWidth
          label="IMEI (any length)"
          variant="outlined"
          value={imei}
          onChange={(e) => setImei(e.target.value)}
          placeholder="867440066769878"
          helperText={
            error || "Enter IMEI (will be padded/truncated to 15 digits)"
          }
          sx={{ marginTop: 2, marginBottom: 3 }}
        />

        {loginPacket && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Generated Login Packet:
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                padding: 2,
                // backgroundColor: "#f5f5f5",
                wordBreak: "break-all",
                fontFamily: "monospace",
                fontSize: "14px",
                cursor: "pointer",
                "&:hover": {
                  //   backgroundColor: "#eeeeee",
                },
              }}
              onClick={copyToClipboard}
            >
              {loginPacket}
            </Paper>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ marginTop: 1, display: "block" }}
            >
              Click to copy
            </Typography>

            <Box sx={{ marginTop: 3 }}>
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
                <Chip
                  label={`Start: ${loginPacket.substring(0, 4)}`}
                  size="small"
                />
                <Chip
                  label={`Length: ${loginPacket.substring(4, 6)}`}
                  size="small"
                />
                <Chip
                  label={`Type: ${loginPacket.substring(6, 8)}`}
                  size="small"
                />
                <Chip
                  label={`IMEI: ${loginPacket.substring(8, 24)}`}
                  size="small"
                  color="primary"
                />
                <Chip
                  label={`Info: ${loginPacket.substring(24, 28)}`}
                  size="small"
                />
                <Chip
                  label={`Reserved: ${loginPacket.substring(28, 32)}`}
                  size="small"
                />
                <Chip
                  label={`Serial: ${loginPacket.substring(32, 36)}`}
                  size="small"
                />
                <Chip
                  label={`CRC: ${loginPacket.substring(36, 40)}`}
                  size="small"
                  color="secondary"
                />
                <Chip
                  label={`End: ${loginPacket.substring(40, 44)}`}
                  size="small"
                />
              </Box>

              <Box
                sx={{
                  marginTop: 2,
                  padding: 1.5,
                  //   backgroundColor: "#e3f2fd",
                  borderRadius: 1,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  <strong>Input IMEI:</strong>{" "}
                  {imei.replace(/\D/g, "") || "(empty)"} (
                  {imei.replace(/\D/g, "").length} digits)
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ConcoxLoginPacketGenerator;
