import React, { useState } from "react";
import {
  TextField,
  Typography,
  Grid,
  Box,
  Button,
  InputAdornment,
} from "@mui/material";

/* =====================
   Utilities
===================== */

const cleanHex = (h) => (h || "").replace(/\s/g, "").toUpperCase();

// Float <-> Hex (Little Endian)
const hexToFloatLE = (hex) => {
  if (!hex || hex.length !== 8) return 0;
  const bytes = new Uint8Array(
    hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
  );
  const view = new DataView(bytes.buffer);
  return parseFloat(view.getFloat32(0, true).toFixed(6));
};

const floatToHexLE = (val) => {
  const view = new DataView(new ArrayBuffer(4));
  view.setFloat32(0, Number(val), true);
  let hex = "";
  for (let i = 0; i < 4; i++) {
    hex += view.getUint8(i).toString(16).padStart(2, "0");
  }
  return hex.toUpperCase();
};

// Int <-> Hex
const hexToInt = (hex) => parseInt(hex, 16) || 0;

const intToHex = (val, bytes) => {
  let num = Number(val);
  if (isNaN(num)) num = 0;
  return Math.max(0, Math.min(Math.pow(2, bytes * 8) - 1, Math.floor(num)))
    .toString(16)
    .padStart(bytes * 2, "0")
    .toUpperCase();
};

// BCD Date <-> Hex
const hexToDateBCD = (hex) => {
  if (hex.length !== 12) return "";
  const yy = hex.substring(0, 2);
  const mm = hex.substring(2, 4);
  const dd = hex.substring(4, 6);
  const h = hex.substring(6, 8);
  const m = hex.substring(8, 10);
  const s = hex.substring(10, 12);
  return `20${yy}-${mm}-${dd}T${h}:${m}:${s}`;
};

const dateToHexBCD = (isoString) => {
  if (!isoString) return "000000000000";
  const d = new Date(isoString);
  const pad = (n) => n.toString().padStart(2, "0");
  return (
    pad(d.getFullYear() % 100) +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
};

/* =====================
   Schema (0x05 Driver Behaviour)
===================== */
const SCHEMA = [
  // --- Header ---
  { label: "Header", start: 1, end: 2, type: "hex", readOnly: true },
  { label: "Msg Type (0x05)", start: 3, end: 3, type: "hex", readOnly: true },
  { label: "Length", start: 4, end: 5, type: "int" },
  { label: "Serial", start: 6, end: 7, type: "int" },
  { label: "IMEI (15 digit)", start: 8, end: 15, type: "imei", readOnly: true }, // Use Button

  // --- Behavior ---
  { label: "Behavior Type", start: 16, end: 16, type: "hex" },

  // --- Data Set 1 ---
  { label: "Date (Set 1)", start: 17, end: 22, type: "date" },
  { label: "Altitude 1 (m)", start: 23, end: 26, type: "float" },
  { label: "Longitude 1", start: 27, end: 30, type: "float" },
  { label: "Latitude 1", start: 31, end: 34, type: "float" },
  { label: "Speed 1 (km/h)", start: 35, end: 36, type: "int" },
  { label: "Direction 1 (°)", start: 37, end: 38, type: "int" },

  // --- Data Set 2 ---
  { label: "Date (Set 2)", start: 39, end: 44, type: "date" },
  { label: "Altitude 2 (m)", start: 45, end: 48, type: "float" },
  { label: "Longitude 2", start: 49, end: 52, type: "float" },
  { label: "Latitude 2", start: 53, end: 56, type: "float" },
  { label: "Speed 2 (km/h)", start: 57, end: 58, type: "int" },
  { label: "Direction 2 (°)", start: 59, end: 60, type: "int" },
];

export default function DriverBehaviourDecoder() {
  // Sample based on your documentation table
  const [rawInput, setRawInput] = useState(
    "252505003C000101234567891011120126010914060958866B4276D6E342912AB4411115050526010916020358866B4276D6E342912AB44111150505"
  );
  const [newImei, setNewImei] = useState("");

  const getHexSegment = (start, end) => {
    const clean = cleanHex(rawInput);
    if (clean.length < end * 2) return "00".repeat(end - start + 1);
    return clean.substring((start - 1) * 2, end * 2);
  };

  const updateHexSegment = (start, end, newSegment) => {
    const clean = cleanHex(rawInput);
    const startIndex = (start - 1) * 2;
    const endIndex = end * 2;
    const before = clean.substring(0, startIndex);
    const after = clean.substring(endIndex);
    setRawInput(before + newSegment + after);
  };

  const handleFieldChange = (item, value) => {
    const byteLength = item.end - item.start + 1;
    let newHex = "";

    try {
      if (item.type === "int") {
        newHex = intToHex(value, byteLength);
      } else if (item.type === "float") {
        newHex = floatToHexLE(value);
      } else if (item.type === "date") {
        newHex = dateToHexBCD(value);
      } else if (item.type === "imei") {
        const imeiStr = value
          .toString()
          .replace(/\D/g, "")
          .padEnd(15, "0")
          .substring(0, 15);
        newHex =
          "0" +
          imeiStr
            .split("")
            .map((d) => parseInt(d, 10).toString(16))
            .join("")
            .toUpperCase();
      } else {
        newHex = value.replace(/[^0-9A-Fa-f]/g, "").toUpperCase();
        if (newHex.length > byteLength * 2) {
          newHex = newHex.substring(0, byteLength * 2);
        } else {
          newHex = newHex.padStart(byteLength * 2, "0");
        }
      }
      updateHexSegment(item.start, item.end, newHex);
    } catch (e) {
      console.error("Encoding error", e);
    }
  };

  const handleModifyImei = () => {
    const imeiField = SCHEMA.find((f) => f.type === "imei");
    if (imeiField && newImei.replace(/\D/g, "").length === 15) {
      handleFieldChange(imeiField, newImei);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cleanHex(rawInput));
  };

  const canModifyImei = newImei.replace(/\D/g, "").length === 15;

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, color: "text.primary" }}>
        Driver Behaviour Decoder (0x25 0x25 0x05)
      </Typography>

      {/* RAW HEX INPUT */}
      <TextField
        label="Raw Hex"
        fullWidth
        multiline
        minRows={3}
        value={rawInput}
        onChange={(e) =>
          setRawInput(e.target.value.replace(/[^0-9a-fA-F]/g, ""))
        }
        sx={{ mb: 2 }}
        InputProps={{
          style: { fontFamily: "monospace" },
        }}
      />

      <Button variant="outlined" onClick={copyToClipboard} sx={{ mb: 4 }}>
        Copy Hex
      </Button>

      {/* IMEI MODIFIER */}
      <Box
        sx={{
          mb: 4,
          p: 2,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
        }}
      >
        <Typography variant="subtitle2" gutterBottom>
          Modify IMEI
        </Typography>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} sm={8}>
            <TextField
              label="New 15-digit IMEI"
              fullWidth
              size="small"
              value={newImei}
              onChange={(e) => {
                const onlyDigits = e.target.value.replace(/\D/g, "");
                setNewImei(onlyDigits);
              }}
              inputProps={{ maxLength: 15 }}
              placeholder="e.g., 354812061234567"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {newImei.length}/15
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant="contained"
              fullWidth
              disabled={!canModifyImei}
              onClick={handleModifyImei}
            >
              Apply
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* DECODED FIELDS */}
      <Grid container spacing={2}>
        {SCHEMA.map((item, index) => {
          const currentHex = getHexSegment(item.start, item.end);
          let displayValue = "";

          // Decoding Logic
          if (item.type === "int") {
            displayValue = hexToInt(currentHex);
          } else if (item.type === "float") {
            displayValue = hexToFloatLE(currentHex);
          } else if (item.type === "date") {
            displayValue = hexToDateBCD(currentHex);
          } else if (item.type === "imei") {
            const bcdHex = currentHex.substring(1);
            let imei = "";
            for (const ch of bcdHex) {
              imei += parseInt(ch, 16).toString();
            }
            displayValue = imei.substring(0, 15);
          } else {
            displayValue = currentHex;
          }

          return (
            <Grid item xs={6} sm={4} md={3} key={index}>
              <TextField
                label={item.label}
                fullWidth
                size="small"
                disabled={item.readOnly || item.type === "imei"}
                type={
                  item.type === "int" ||
                  item.type === "float" ||
                  item.type === "imei"
                    ? "number"
                    : item.type === "date"
                    ? "datetime-local"
                    : "text"
                }
                value={displayValue}
                onChange={(e) => handleFieldChange(item, e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  step:
                    item.type === "date"
                      ? "1"
                      : item.type === "float"
                      ? "0.000001"
                      : "1",
                }}
              />
              <Typography
                variant="caption"
                display="block"
                sx={{
                  mt: 0.5,
                  color: "text.secondary",
                  fontFamily: "monospace",
                }}
              >
                [{item.start}-{item.end}] 0x{currentHex}
              </Typography>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
