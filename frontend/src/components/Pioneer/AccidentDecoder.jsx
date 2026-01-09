import React, { useState, useMemo } from "react";
import {
  TextField,
  Typography,
  Grid,
  Box,
  Button,
  InputAdornment,
  Divider,
  Paper,
} from "@mui/material";

/* =====================
   Utilities
===================== */

const cleanHex = (h) => (h || "").replace(/\s/g, "").toUpperCase();

// --- Float <-> Hex (Little Endian) ---
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

// --- Int <-> Hex ---
const hexToInt = (hex) => parseInt(hex, 16) || 0;

const intToHex = (val, bytes) => {
  let num = Number(val);
  if (isNaN(num)) num = 0;
  return Math.max(0, Math.min(Math.pow(2, bytes * 8) - 1, Math.floor(num)))
    .toString(16)
    .padStart(bytes * 2, "0")
    .toUpperCase();
};

// --- Speed Nibble Decoder (0x1115 -> 111.5) ---
const hexToSpeedNibble = (hex) => {
  if (!hex || hex.length !== 4) return 0;
  const chars = hex.split("");
  const val = `${chars[0]}${chars[1]}${chars[2]}.${chars[3]}`;
  return parseFloat(val);
};

const speedToHexNibble = (val) => {
  let s = parseFloat(val).toFixed(1).replace(".", "");
  s = s.padStart(4, "0").substring(0, 4);
  return s.toUpperCase();
};

// --- BCD Date <-> Hex ---
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
   Schemas
===================== */

// Bytes 1-16 (Fixed)
const HEADER_SCHEMA = [
  { label: "Header", start: 1, end: 2, type: "hex", readOnly: true },
  { label: "Msg Type (0x07)", start: 3, end: 3, type: "hex", readOnly: true },
  { label: "Length", start: 4, end: 5, type: "int" },
  { label: "Serial", start: 6, end: 7, type: "int" },
  { label: "IMEI (15 digit)", start: 8, end: 15, type: "imei", readOnly: true },
  { label: "Accident Code", start: 16, end: 16, type: "hex" },
];

// Relative offsets for a 28-byte record (0-based inside record)
const RECORD_TEMPLATE = [
  { label: "Date/Time", offset: 0, size: 6, type: "date" }, // Byte 1-6 relative
  { label: "Status", offset: 6, size: 1, type: "hex" }, // Byte 7
  { label: "Accel (5 Bytes)", offset: 7, size: 5, type: "hex" }, // Byte 8-12
  { label: "Altitude (m)", offset: 12, size: 4, type: "float" }, // Byte 13-16
  { label: "Longitude", offset: 16, size: 4, type: "float" }, // Byte 17-20
  { label: "Latitude", offset: 20, size: 4, type: "float" }, // Byte 21-24
  { label: "Speed (km/h)", offset: 24, size: 2, type: "speed_nibble" }, // Byte 25-26
  { label: "Direction (°)", offset: 26, size: 2, type: "int" }, // Byte 27-28
];

const RECORD_SIZE = 28;
const HEADER_SIZE = 16;

export default function AccidentDecoder() {
  // Sample: Header + 2 Records
  // Record 1: 00..Time.. Status.. Accel.. Alt.. Lon.. Lat.. Speed.. Dir
  const [rawInput, setRawInput] = useState(
    "252507003C000101234567891011128826010517042900000000000858866B4276D6E342912AB4411115050526020204492500890908998958866B4276D6E342912AB44111150505"
  );
  const [newImei, setNewImei] = useState("");

  // Calculate number of records based on length
  const recordCount = useMemo(() => {
    const clean = cleanHex(rawInput);
    const totalBytes = clean.length / 2;
    if (totalBytes < HEADER_SIZE) return 0;
    const dataBytes = totalBytes - HEADER_SIZE;
    return Math.floor(dataBytes / RECORD_SIZE);
  }, [rawInput]);

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

  // Generic Field Handler
  const handleValueChange = (type, start, end, value) => {
    const byteLength = end - start + 1;
    let newHex = "";
    try {
      if (type === "int") {
        newHex = intToHex(value, byteLength);
      } else if (type === "float") {
        newHex = floatToHexLE(value);
      } else if (type === "date") {
        newHex = dateToHexBCD(value);
      } else if (type === "speed_nibble") {
        newHex = speedToHexNibble(value);
      } else if (type === "imei") {
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
      updateHexSegment(start, end, newHex);
    } catch (e) {
      console.error("Encoding error", e);
    }
  };

  const handleModifyImei = () => {
    // IMEI is always fixed at 8-15
    const start = 8;
    const end = 15;
    if (newImei.replace(/\D/g, "").length === 15) {
      handleValueChange("imei", start, end, newImei);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cleanHex(rawInput));
  };

  const canModifyImei = newImei.replace(/\D/g, "").length === 15;

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, color: "text.primary" }}>
        Accident Decoder (0x25 0x25 0x07)
      </Typography>

      {/* RAW INPUT */}
      <TextField
        label={`Raw Hex String (${recordCount} Records)`}
        fullWidth
        multiline
        minRows={3}
        value={rawInput}
        onChange={(e) =>
          setRawInput(e.target.value.replace(/[^0-9a-fA-F]/g, ""))
        }
        sx={{ mb: 2 }}
        InputProps={{ style: { fontFamily: "monospace" } }}
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
              onChange={(e) => setNewImei(e.target.value.replace(/\D/g, ""))}
              inputProps={{ maxLength: 15 }}
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

      {/* HEADER FIELDS */}
      <Typography
        variant="subtitle1"
        sx={{ fontWeight: "bold", mb: 1, color: "primary.main" }}
      >
        Message Header
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {HEADER_SCHEMA.map((item, index) => {
          const currentHex = getHexSegment(item.start, item.end);
          let displayValue = "";
          if (item.type === "int") displayValue = hexToInt(currentHex);
          else if (item.type === "imei") {
            // Show raw digits without leading 0 for display
            const bcdHex = currentHex.substring(1);
            let imei = "";
            for (const ch of bcdHex) {
              imei += parseInt(ch, 16).toString();
            }
            displayValue = imei.substring(0, 15);
          } else displayValue = currentHex;

          return (
            <Grid item xs={6} sm={4} md={3} key={index}>
              <TextField
                label={item.label}
                fullWidth
                size="small"
                disabled={item.readOnly || item.type === "imei"}
                value={displayValue}
                onChange={(e) =>
                  handleValueChange(
                    item.type,
                    item.start,
                    item.end,
                    e.target.value
                  )
                }
                InputLabelProps={{ shrink: true }}
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

      <Divider sx={{ mb: 4 }} />

      {/* REPEATING RECORDS */}
      {Array.from({ length: recordCount }).map((_, rIndex) => {
        // Calculate absolute start byte for this record
        // Base = 16. Record 0 starts at 17.
        // Record r starts at 16 + (r * 28) + 1
        const recordBase = HEADER_SIZE + rIndex * RECORD_SIZE + 1;

        return (
          <Paper key={rIndex} variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography
              variant="subtitle2"
              sx={{ mb: 2, color: "secondary.main" }}
            >
              Position Record #{rIndex + 1} (Bytes {recordBase} -{" "}
              {recordBase + RECORD_SIZE - 1})
            </Typography>
            <Grid container spacing={2}>
              {RECORD_TEMPLATE.map((field, fIndex) => {
                const start = recordBase + field.offset;
                const end = start + field.size - 1;
                const currentHex = getHexSegment(start, end);

                let displayValue = "";
                if (field.type === "int") displayValue = hexToInt(currentHex);
                else if (field.type === "float")
                  displayValue = hexToFloatLE(currentHex);
                else if (field.type === "date")
                  displayValue = hexToDateBCD(currentHex);
                else if (field.type === "speed_nibble")
                  displayValue = hexToSpeedNibble(currentHex);
                else displayValue = currentHex;

                return (
                  <Grid item xs={6} sm={4} md={3} key={fIndex}>
                    <TextField
                      label={field.label}
                      fullWidth
                      size="small"
                      type={
                        field.type === "int" ||
                        field.type === "float" ||
                        field.type === "speed_nibble"
                          ? "number"
                          : field.type === "date"
                          ? "datetime-local"
                          : "text"
                      }
                      value={displayValue}
                      onChange={(e) =>
                        handleValueChange(
                          field.type,
                          start,
                          end,
                          e.target.value
                        )
                      }
                      InputLabelProps={{ shrink: true }}
                      inputProps={{
                        step:
                          field.type === "date"
                            ? "1"
                            : field.type === "float"
                            ? "0.000001"
                            : "0.1",
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
                      [{start}-{end}] 0x{currentHex}
                    </Typography>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        );
      })}
    </Box>
  );
}
