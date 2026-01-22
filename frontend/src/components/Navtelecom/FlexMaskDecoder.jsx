import React, { useState, useMemo } from "react";
import {
  Box,
  TextField,
  Typography,
  Paper,
  Divider,
  Chip,
  Stack,
} from "@mui/material";

/* =========================
   Helpers
========================= */

const hexToBytes = (hex) => {
  const clean = hex.replace(/\s+/g, "").toLowerCase();
  const bytes = [];
  for (let i = 0; i < clean.length; i += 2) {
    bytes.push(parseInt(clean.slice(i, i + 2), 16));
  }
  return bytes;
};

/* =========================
   FLEX Decoder (Correct)
========================= */

const decodeFlexMask = (hex) => {
  const bytes = hexToBytes(hex);

  // Locate ASCII "FLEX"
  const FLEX = [0x46, 0x4c, 0x45, 0x58];
  let flexIndex = -1;

  for (let i = 0; i <= bytes.length - 4; i++) {
    if (
      bytes[i] === FLEX[0] &&
      bytes[i + 1] === FLEX[1] &&
      bytes[i + 2] === FLEX[2] &&
      bytes[i + 3] === FLEX[3]
    ) {
      flexIndex = i;
      break;
    }
  }

  if (flexIndex === -1) {
    return { error: "FLEX marker not found" };
  }

  /*
    Layout after FLEX (based on Java code):

    FLEX
    +0 protocol
    +1 protocol version
    +2 struct version
    +3 bitCount
    +4... bitmask bytes
  */

  const protocol = bytes[flexIndex + 4];
  const protocolVersion = bytes[flexIndex + 5];
  const structVersion = bytes[flexIndex + 6];
  const bitCount = bytes[flexIndex + 7];

  const maskStart = flexIndex + 8;
  const maskByteLength = Math.ceil(bitCount / 8);
  const maskBytes = bytes.slice(maskStart, maskStart + maskByteLength);

  const enabledFeatures = [];

  let currentByte = 0;

  for (let i = 0; i < bitCount; i++) {
    if (i % 8 === 0) {
      currentByte = maskBytes[Math.floor(i / 8)];
    }

    // MSB-first: bit 7 → bit 0
    const bitSet = (currentByte >> (7 - (i % 8))) & 1;

    if (bitSet) {
      enabledFeatures.push(i + 1); // Feature ID = bit position + 1
    }
  }

  return {
    flexOffset: flexIndex,
    protocol,
    protocolVersion,
    structVersion,
    bitCount,
    enabledFeatures,
  };
};

/* =========================
   Component
========================= */

export default function FlexMaskDecoder() {
  const [hex, setHex] = useState(
    "404e544301000000000000002a00dbe92a3e464c4558b01e1efff3fe300a0e000000060600000000000800200000000000000107800000000000",
  );

  const decoded = useMemo(() => decodeFlexMask(hex), [hex]);

  return (
    <Box p={3} maxWidth={900} mx="auto">
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        FLEX Mask Decoder (Correct)
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          label="FLEX Hex String"
          fullWidth
          multiline
          minRows={3}
          value={hex}
          onChange={(e) => setHex(e.target.value)}
        />
      </Paper>

      {decoded?.error ? (
        <Typography color="error">{decoded.error}</Typography>
      ) : (
        <>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              FLEX Metadata
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Typography>FLEX Offset (byte): {decoded.flexOffset}</Typography>
            <Typography>Protocol: {decoded.protocol}</Typography>
            <Typography>Protocol Version: {decoded.protocolVersion}</Typography>
            <Typography>Struct Version: {decoded.structVersion}</Typography>
            <Typography>Total Feature Bits: {decoded.bitCount}</Typography>
            <Typography>
              Enabled Features Count: {decoded.enabledFeatures.length}
            </Typography>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Enabled Features
            </Typography>

            <Stack direction="row" flexWrap="wrap" gap={1}>
              {decoded.enabledFeatures.map((f) => (
                <Chip key={f} label={`#${f}`} />
              ))}
            </Stack>
          </Paper>
        </>
      )}
    </Box>
  );
}
