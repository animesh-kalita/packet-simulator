import React, { useState } from "react";
import {
  Paper,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Alert,
} from "@mui/material";

/* =====================
   Decoder Logic
===================== */

// Big endian hex to float
// const hexToFloat = (hex) => {
//   if (!hex || hex.length !== 8) return 0;
//   const bytes = new Uint8Array(
//     hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
//   );
//   const view = new DataView(bytes.buffer);
//   return view.getFloat32(0, false).toFixed(6); // Big Endian
// };

// Little Endian hex to float
const hexToFloat = (hex) => {
  if (!hex || hex.length !== 8) return 0;

  // Convert hex string to a byte array
  const bytes = new Uint8Array(
    hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
  );

  const view = new DataView(bytes.buffer);

  // Changing the second parameter to TRUE for Little Endian
  // This matches your Java readFloatLE()
  return view.getFloat32(0, true).toFixed(6);
};
// Hex to Int big endian
const hexToInt = (hex) => parseInt(hex, 16);

// Hex to int litle endian
const hexToIntLE = (hex) => {
  const bytes = new Uint8Array(
    hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
  );
  const view = new DataView(bytes.buffer);

  // Use 16 for Short (2 bytes) or 32 for Int (4 bytes)
  if (hex.length === 4) return view.getUint16(0, true);
  if (hex.length === 8) return view.getUint32(0, true);
  return parseInt(hex, 16);
};

const decodePioneer = (raw) => {
  const clean = raw.replace(/\s/g, "");
  if (clean.length < 178) return null; // 89 bytes * 2 chars = 178

  // Helper to slice by byte index (1-based from your doc)
  const get = (start, end) => clean.substring((start - 1) * 2, end * 2);

  return [
    { field: "Header", hex: get(1, 2), val: "%%" },
    {
      field: "Msg Type",
      hex: get(3, 3),
      val: get(3, 3) === "13" ? "Position" : get(3, 3),
    },
    { field: "Length", hex: get(4, 5), val: hexToInt(get(4, 5)) + " bytes" },
    { field: "Serial", hex: get(6, 7), val: hexToInt(get(6, 7)) },
    { field: "IMEI", hex: get(8, 15), val: get(8, 15).replace(/^0/, "") },
    {
      field: "Ignition ON Interval",
      hex: get(16, 17),
      val: hexToInt(get(16, 17)) + "s",
    },
    {
      field: "Signal Strength",
      hex: get(24, 24),
      val: hexToInt(get(24, 24)) + "%",
    },
    {
      field: "Heartbeat",
      hex: get(28, 28),
      val: hexToInt(get(28, 28)) + " min",
    },
    {
      field: "Odometer",
      hex: get(48, 51),
      val: hexToInt(get(48, 51)) + " m",
    },
    {
      field: "Date/Time",
      hex: get(53, 58),
      val: `20${get(53, 53)}-${get(54, 54)}-${get(55, 55)} ${get(56, 56)}:${get(
        57,
        57
      )}:${get(58, 58)}`,
    },
    {
      field: "Altitude",
      hex: get(59, 62),
      val: hexToFloat(get(59, 62)) + " m",
    },
    { field: "Longitude", hex: get(63, 66), val: hexToFloat(get(63, 66)) },
    { field: "Latitude", hex: get(67, 70), val: hexToFloat(get(67, 70)) },
    { field: "Speed", hex: get(71, 72), val: hexToInt(get(71, 72)) + " km/h" },
    { field: "Direction", hex: get(73, 74), val: hexToInt(get(73, 74)) + "°" },
    {
      field: "Int. Battery",
      hex: get(75, 76),
      val: (hexToInt(get(75, 76)) / 100).toFixed(2) + " V",
    },
    {
      field: "Ext. Power",
      hex: get(77, 78),
      val: (hexToInt(get(77, 78)) / 100).toFixed(2) + " V",
    },
    {
      field: "Temperature",
      hex: get(84, 84),
      val: hexToInt(get(84, 84)) + " °C",
    },
  ];
};

/* =====================
   UI Component
===================== */

export default function PioneerDecoder() {
  const [rawInput, setRawInput] = useState("");
  const decodedData = decodePioneer(rawInput);

  return (
    <Box sx={{ p: 4, pt: 10, maxWidth: 900, margin: "auto" }}>
      <Typography variant="h4" gutterBottom weight="bold">
        Pioneer Protocol Hex Decoder
      </Typography>

      <TextField
        fullWidth
        multiline
        rows={3}
        label="Paste Raw Hex String"
        placeholder="2525130059..."
        value={rawInput}
        onChange={(e) =>
          setRawInput(e.target.value.replace(/[^0-9a-fA-F]/g, ""))
        }
        sx={{ mb: 3 }}
      />

      {!decodedData && rawInput.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          String length is {Math.floor(rawInput.length / 2)} bytes. Minimum 89
          bytes required for full decoding.
        </Alert>
      )}

      {decodedData && (
        <TableContainer component={Paper} elevation={3}>
          <Table size="small">
            <TableHead sx={{ bgcolor: "#eee" }}>
              <TableRow>
                <TableCell>
                  <strong>Field Name</strong>
                </TableCell>
                <TableCell>
                  <strong>Hex Segment</strong>
                </TableCell>
                <TableCell>
                  <strong>Decoded Value</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {decodedData.map((row, index) => (
                <TableRow key={index} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{row.field}</TableCell>
                  <TableCell
                    sx={{ fontFamily: "monospace", color: "primary.main" }}
                  >
                    {row.hex}
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: "bold", color: "secondary.main" }}
                  >
                    {row.val}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
