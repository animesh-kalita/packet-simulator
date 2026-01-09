import React, { useState, useMemo } from "react";
import {
  TextField,
  Typography,
  Grid,
  Box,
  Button,
  InputAdornment,
  Paper,
  Divider,
  MenuItem,
} from "@mui/material";

/* =====================
   Utilities
===================== */

const cleanHex = (h) => (h || "").replace(/\s/g, "").toUpperCase();

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

// --- Specific Tire Formulas ---
// Voltage: 1.22 + 0.01 * value
const decodeTireVolt = (hex) => (1.22 + 0.01 * hexToInt(hex)).toFixed(2);
const encodeTireVolt = (val) => {
  const v = parseFloat(val);
  const raw = Math.round((v - 1.22) / 0.01);
  return intToHex(raw, 1);
};

// Pressure: 1.572 * 2 * value
const decodeTirePress = (hex) => (1.572 * 2 * hexToInt(hex)).toFixed(2);
const encodeTirePress = (val) => {
  const v = parseFloat(val);
  const raw = Math.round(v / (1.572 * 2));
  return intToHex(raw, 1);
};

// Temp: 0x68(104) -> 49 means offset is -55
const decodeTireTemp = (hex) => hexToInt(hex) - 55;
const encodeTireTemp = (val) => intToHex(parseInt(val) + 55, 1);

/* =====================
   Fixed Header Schema (Bytes 1-22)
===================== */
const HEADER_SCHEMA = [
  { label: "Header", start: 1, end: 2, type: "hex", readOnly: true },
  { label: "Msg Type (0x10)", start: 3, end: 3, type: "hex", readOnly: true },
  { label: "Length", start: 4, end: 5, type: "int" },
  { label: "Serial", start: 6, end: 7, type: "int" },
  { label: "IMEI (15 digit)", start: 8, end: 15, type: "imei", readOnly: true },
  { label: "Date/Time", start: 16, end: 21, type: "date" },
  {
    label: "ACC Status",
    start: 22,
    end: 22,
    type: "hex",
    helper: "00=OFF, 01=ON",
  },
];

// BLE Data Code is Bytes 23-24
const BLE_CODE_START = 23;
const BLE_CODE_END = 24;

export default function BleDecoder() {
  // Sample: Header + 0001 (Tire) + 1 Tire Record (10 bytes)
  // Header(22) + Code(2) + Payload(10) = 34 bytes (68 chars)
  const [rawInput, setRawInput] = useState(
    "25251000220001088061689888888800000000000001000104B3EC0024CE9F0F6800"
  );
  const [newImei, setNewImei] = useState("");

  const clean = cleanHex(rawInput);

  // Detect BLE Type
  const bleCodeHex = clean.substring(
    (BLE_CODE_START - 1) * 2,
    BLE_CODE_END * 2
  );
  const isTireSensor = bleCodeHex === "0001";

  // Calculate Payload
  const payloadStartByte = 25;
  const payloadHex = clean.substring((payloadStartByte - 1) * 2);

  // For Tire Sensors (0x0001), records are 10 bytes each
  const tireRecordCount = isTireSensor ? Math.floor(payloadHex.length / 20) : 0;

  const getHexSegment = (start, end) => {
    const c = cleanHex(rawInput);
    if (c.length < end * 2) return "00".repeat(end - start + 1);
    return c.substring((start - 1) * 2, end * 2);
  };

  const updateHexSegment = (start, end, newSegment) => {
    const c = cleanHex(rawInput);
    const startIndex = (start - 1) * 2;
    const endIndex = end * 2;
    const before = c.substring(0, startIndex);
    const after = c.substring(endIndex);
    setRawInput(before + newSegment + after);
  };

  // Generic Field Handler
  const handleValueChange = (type, start, end, value) => {
    const byteLength = end - start + 1;
    let newHex = "";
    try {
      if (type === "int") newHex = intToHex(value, byteLength);
      else if (type === "date") newHex = dateToHexBCD(value);
      else if (type === "tire_volt") newHex = encodeTireVolt(value);
      else if (type === "tire_press") newHex = encodeTirePress(value);
      else if (type === "tire_temp") newHex = encodeTireTemp(value);
      else if (type === "imei") {
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
    if (newImei.replace(/\D/g, "").length === 15) {
      handleValueChange("imei", 8, 15, newImei);
    }
  };

  const canModifyImei = newImei.replace(/\D/g, "").length === 15;

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, color: "text.primary" }}>
        BLE Decoder (0x25 0x25 0x10)
      </Typography>

      {/* RAW INPUT */}
      <TextField
        label="Raw Hex String"
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
      <Button
        variant="outlined"
        onClick={() => navigator.clipboard.writeText(cleanHex(rawInput))}
        sx={{ mb: 4 }}
      >
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

      {/* FIXED HEADER */}
      <Typography
        variant="subtitle1"
        sx={{ fontWeight: "bold", mb: 1, color: "primary.main" }}
      >
        Packet Header
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {HEADER_SCHEMA.map((item, index) => {
          const currentHex = getHexSegment(item.start, item.end);
          let displayValue = currentHex;
          if (item.type === "int") displayValue = hexToInt(currentHex);
          else if (item.type === "date")
            displayValue = hexToDateBCD(currentHex);
          else if (item.type === "imei") {
            const bcdHex = currentHex.substring(1);
            let imei = "";
            for (const ch of bcdHex) {
              imei += parseInt(ch, 16).toString();
            }
            displayValue = imei.substring(0, 15);
          }

          return (
            <Grid item xs={6} sm={4} md={3} key={index}>
              <TextField
                label={item.label}
                fullWidth
                size="small"
                helperText={item.helper}
                disabled={item.readOnly || item.type === "imei"}
                value={displayValue}
                type={
                  item.type === "int"
                    ? "number"
                    : item.type === "date"
                    ? "datetime-local"
                    : "text"
                }
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

      {/* BLE DATA CODE */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              label="BLE Data Code"
              fullWidth
              select
              size="small"
              value={bleCodeHex}
              onChange={(e) =>
                handleValueChange(
                  "hex",
                  BLE_CODE_START,
                  BLE_CODE_END,
                  e.target.value
                )
              }
            >
              <MenuItem value="0001">0x0001 (Tire Sensor)</MenuItem>
              <MenuItem value="0002">0x0002 (SOS Tag)</MenuItem>
              <MenuItem value="000A">0x000A (Analog)</MenuItem>
              <MenuItem value={bleCodeHex}>Custom ({bleCodeHex})</MenuItem>
            </TextField>
            <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
              Bytes 23-24: 0x{bleCodeHex}
            </Typography>
          </Grid>
        </Grid>
      </Box>

      {/* DYNAMIC PAYLOAD: TIRE SENSORS */}
      {isTireSensor && (
        <Box>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: "bold", mb: 2, color: "secondary.main" }}
          >
            Tire Sensors (Payload)
          </Typography>
          {Array.from({ length: tireRecordCount }).map((_, i) => {
            // 10 bytes per record
            // Start Byte = Payload Start (25) + (i * 10)
            const base = payloadStartByte + i * 10;

            // Field Offsets relative to base
            const fields = [
              { label: "MAC Address", offset: 0, size: 6, type: "hex" },
              { label: "Voltage (V)", offset: 6, size: 1, type: "tire_volt" },
              {
                label: "Pressure (kPa)",
                offset: 7,
                size: 1,
                type: "tire_press",
              },
              { label: "Temp (°C)", offset: 8, size: 1, type: "tire_temp" },
              { label: "Status", offset: 9, size: 1, type: "hex" },
            ];

            return (
              <Paper key={i} variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography
                  variant="caption"
                  sx={{ mb: 1, display: "block", fontWeight: "bold" }}
                >
                  Sensor #{i + 1}
                </Typography>
                <Grid container spacing={2}>
                  {fields.map((f, idx) => {
                    const start = base + f.offset;
                    const end = start + f.size - 1;
                    const currentHex = getHexSegment(start, end);

                    let displayValue = currentHex;
                    if (f.type === "tire_volt")
                      displayValue = decodeTireVolt(currentHex);
                    else if (f.type === "tire_press")
                      displayValue = decodeTirePress(currentHex);
                    else if (f.type === "tire_temp")
                      displayValue = decodeTireTemp(currentHex);

                    return (
                      <Grid item xs={6} sm={4} md={idx === 0 ? 4 : 2} key={idx}>
                        <TextField
                          label={f.label}
                          fullWidth
                          size="small"
                          value={displayValue}
                          onChange={(e) =>
                            handleValueChange(
                              f.type,
                              start,
                              end,
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
                          0x{currentHex}
                        </Typography>
                      </Grid>
                    );
                  })}
                </Grid>
              </Paper>
            );
          })}
          {tireRecordCount === 0 && (
            <Typography color="text.secondary">
              No full sensor records found in payload.
            </Typography>
          )}
        </Box>
      )}

      {!isTireSensor && (
        <Typography color="text.secondary" sx={{ fontStyle: "italic" }}>
          Parser for BLE Code 0x{bleCodeHex} is not yet implemented. Edit Raw
          Hex directly.
        </Typography>
      )}
    </Box>
  );
}
