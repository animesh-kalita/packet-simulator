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
  MenuItem,
  Chip,
} from "@mui/material";

/* =====================
   Utilities
===================== */

const cleanHex = (h) => (h || "").replace(/\s/g, "").toUpperCase();
const hexToInt = (hex) => parseInt(hex, 16) || 0;

const intToHex = (val, bytes) => {
  let num = Number(val);
  if (isNaN(num)) num = 0;
  // Handle signed 16-bit for Temp
  if (bytes === 2 && num < 0) {
    num = 0xffff + num + 1;
  }
  return Math.max(0, Math.min(Math.pow(2, bytes * 8) - 1, Math.floor(num)))
    .toString(16)
    .padStart(bytes * 2, "0")
    .toUpperCase();
};

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

const hexToSpeedNibble = (hex) => {
  if (!hex || hex.length !== 4) return 0;
  const chars = hex.split("");
  return parseFloat(`${chars[0]}${chars[1]}${chars[2]}.${chars[3]}`);
};

const speedToHexNibble = (val) => {
  let s = parseFloat(val).toFixed(1).replace(".", "");
  return s.padStart(4, "0").substring(0, 4).toUpperCase();
};

// --- BCD Date ---
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
   Domain Formulas
===================== */

// --- Battery ---
// Tire: 1.22 + 0.01 * val
const decodeBatTire = (hex) => (1.22 + 0.01 * hexToInt(hex)).toFixed(2);
const encodeBatTire = (val) => intToHex(Math.round((val - 1.22) / 0.01), 1);

// Standard: (200 + val) * 0.01
const decodeBatStd = (hex) => ((200 + hexToInt(hex)) * 0.01).toFixed(2);
const encodeBatStd = (val) => intToHex(val / 0.01 - 200, 1);

// --- Temp (Signed 16-bit, 0.01 scale) ---
const decodeTemp = (hex) => {
  let val = parseInt(hex, 16);
  if ((val & 0x8000) > 0) val = val - 0x10000; // Sign extend
  return (val * 0.01).toFixed(2);
};
const encodeTemp = (val) => {
  let raw = Math.round(parseFloat(val) / 0.01);
  if (raw < 0) raw = 0xffff + raw + 1;
  return intToHex(raw, 2);
};

// --- Tire Specifics ---
const decodePress = (hex) => (1.572 * 2 * hexToInt(hex)).toFixed(2);
const encodePress = (val) => intToHex(Math.round(val / (1.572 * 2)), 1);
const decodeTireTemp = (hex) => hexToInt(hex) - 55;
const encodeTireTemp = (val) => intToHex(parseInt(val) + 55, 1);

// --- RSSI ---
const decodeRssi = (hex) => hexToInt(hex) - 128;
const encodeRssi = (val) => intToHex(parseInt(val) + 128, 1);

/* =====================
   PAYLOAD DEFINITIONS
===================== */
const PAYLOAD_DEFS = {
  "0001": {
    name: "Tire Sensor",
    size: 10,
    fields: [
      { label: "MAC", size: 6, type: "hex" },
      { label: "Voltage (V)", size: 1, type: "bat_tire" },
      { label: "Pressure (kPa)", size: 1, type: "press" },
      { label: "Temp (°C)", size: 1, type: "temp_tire" },
      { label: "Status", size: 1, type: "hex" },
    ],
  },
  "0002": {
    name: "SOS Button",
    size: 8,
    fields: [
      { label: "MAC", size: 6, type: "hex" },
      { label: "Voltage (V)", size: 1, type: "bat_tire" }, // Usually similar range
      {
        label: "Alarm Type",
        size: 1,
        type: "hex",
        helper: "00=SOS, 01=LowBat",
      },
    ],
  },
  "0003": {
    name: "Driver ID",
    size: 8,
    fields: [
      { label: "MAC", size: 6, type: "hex" },
      { label: "Voltage (V)", size: 1, type: "bat_tire" },
      { label: "ID Type", size: 1, type: "hex", helper: "00=ID, 01=LowBat" },
    ],
  },
  "0004": {
    name: "Temp/Hum Sensor",
    size: 14, // Assuming 6 byte MAC variant
    fields: [
      { label: "MAC", size: 6, type: "hex" },
      { label: "Voltage (V)", size: 1, type: "bat_std" },
      { label: "Battery (%)", size: 1, type: "int" },
      { label: "Temp (°C)", size: 2, type: "temp_std" },
      { label: "Humidity (%)", size: 2, type: "float_01" }, // 0.01 scale
      { label: "Light Status", size: 1, type: "hex" },
      { label: "RSSI (dBm)", size: 1, type: "rssi" },
    ],
  },
  "0005": {
    name: "Door Sensor",
    size: 13,
    fields: [
      { label: "MAC", size: 6, type: "hex" },
      { label: "Voltage (V)", size: 1, type: "bat_std" },
      { label: "Battery (%)", size: 1, type: "int" },
      { label: "Temp (°C)", size: 2, type: "temp_std" },
      {
        label: "Door Status",
        size: 1,
        type: "hex",
        helper: "Bit0: 0=Close, 1=Open",
      },
      { label: "RSSI (dBm)", size: 1, type: "rssi" },
    ],
  },
  "0006": {
    name: "Relay",
    size: 13,
    fields: [
      { label: "MAC", size: 6, type: "hex" },
      { label: "Voltage (V)", size: 1, type: "bat_std" },
      { label: "Ext. Power (%)", size: 1, type: "int" },
      { label: "Temp (°C)", size: 2, type: "temp_std" },
      { label: "Relay Status", size: 1, type: "hex", helper: "00=Off, 01=On" },
      { label: "RSSI (dBm)", size: 1, type: "rssi" },
    ],
  },
  "0007": {
    name: "Fuel Sensor",
    size: 15,
    fields: [
      { label: "MAC", size: 6, type: "hex" },
      { label: "Voltage (V)", size: 1, type: "bat_std" },
      { label: "Fuel ADC", size: 2, type: "int" },
      { label: "Temp (°C)", size: 2, type: "temp_std" },
      { label: "Height", size: 2, type: "int" },
      { label: "State", size: 1, type: "hex", helper: "00=Norm, 01=Fill" },
      { label: "RSSI (dBm)", size: 1, type: "rssi" },
    ],
  },
  "000A": {
    name: "Analog Sensor",
    size: 18,
    fields: [
      { label: "MAC", size: 6, type: "hex" },
      { label: "Battery (%)", size: 1, type: "int" },
      { label: "Type", size: 1, type: "hex", helper: "00=V, 01=A, 02=T" },
      { label: "Value (Raw)", size: 4, type: "int" },
      { label: "Hours (s)", size: 4, type: "int" },
      { label: "Tx Power", size: 1, type: "int" },
      { label: "Status", size: 1, type: "hex" },
      { label: "RSSI (dBm)", size: 1, type: "rssi" },
    ],
  },
};

const PAYLOAD_START = 42; // Byte index where payload begins

export default function BleLocationDecoder_V2() {
  const [rawInput, setRawInput] = useState(
    "252512003600010880616898888888000000000000010058866B4276D6E342912AB44111150505000104B3EC0024CE9F0F680004B3EC0024CE9F0F6800"
  );
  const [newImei, setNewImei] = useState("");

  const clean = cleanHex(rawInput);
  const bleCodeHex = clean.substring((40 - 1) * 2, 41 * 2);
  const definition = PAYLOAD_DEFS[bleCodeHex];

  // Calculate how many records fit
  const payloadHex = clean.substring((PAYLOAD_START - 1) * 2);
  const recordCount = definition
    ? Math.floor(payloadHex.length / (definition.size * 2))
    : 0;

  // --- Generic Helpers ---
  const getHexSegment = (start, end) => {
    if (clean.length < end * 2) return "00".repeat(end - start + 1);
    return clean.substring((start - 1) * 2, end * 2);
  };

  const updateHexSegment = (start, end, newSegment) => {
    const startIndex = (start - 1) * 2;
    const endIndex = end * 2;
    const before = clean.substring(0, startIndex);
    const after = clean.substring(endIndex);
    setRawInput(before + newSegment + after);
  };

  const handleValueChange = (type, start, end, value) => {
    const byteLength = end - start + 1;
    let newHex = "";
    try {
      if (type === "int") newHex = intToHex(value, byteLength);
      else if (type === "float") newHex = floatToHexLE(value);
      else if (type === "float_01") newHex = intToHex(value / 0.01, byteLength);
      else if (type === "date") newHex = dateToHexBCD(value);
      else if (type === "speed_nibble") newHex = speedToHexNibble(value);
      else if (type === "bat_tire") newHex = encodeBatTire(value);
      else if (type === "bat_std") newHex = encodeBatStd(value);
      else if (type === "temp_std") newHex = encodeTemp(value);
      else if (type === "press") newHex = encodePress(value);
      else if (type === "temp_tire") newHex = encodeTireTemp(value);
      else if (type === "rssi") newHex = encodeRssi(value);
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
        if (newHex.length > byteLength * 2)
          newHex = newHex.substring(0, byteLength * 2);
        else newHex = newHex.padStart(byteLength * 2, "0");
      }
      updateHexSegment(start, end, newHex);
    } catch (e) {
      console.error("Error", e);
    }
  };

  const handleModifyImei = () => {
    if (newImei.replace(/\D/g, "").length === 15)
      handleValueChange("imei", 8, 15, newImei);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, color: "text.primary" }}>
        BLE Multi-Sensor Decoder (0x12)
      </Typography>

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
        InputProps={{ style: { fontFamily: "monospace" } }}
      />
      <Button
        variant="outlined"
        onClick={() => navigator.clipboard.writeText(cleanHex(rawInput))}
        sx={{ mb: 4 }}
      >
        Copy Hex
      </Button>

      {/* IMEI */}
      <Box
        sx={{
          mb: 4,
          p: 2,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
        }}
      >
        <Typography variant="subtitle2">Modify IMEI</Typography>
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
              disabled={newImei.length !== 15}
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
        Header & Location
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { l: "Length", s: 4, e: 5, t: "int" },
          { l: "Serial", s: 6, e: 7, t: "int" },
          { l: "IMEI", s: 8, e: 15, t: "imei", r: true },
          { l: "Time", s: 16, e: 21, t: "date" },
          { l: "ACC", s: 22, e: 22, t: "hex" },
          { l: "Alt", s: 24, e: 27, t: "float" },
          { l: "Lon", s: 28, e: 31, t: "float" },
          { l: "Lat", s: 32, e: 35, t: "float" },
          { l: "Speed", s: 36, e: 37, t: "speed_nibble" },
          { l: "Dir", s: 38, e: 39, t: "int" },
        ].map((f, i) => {
          const hex = getHexSegment(f.s, f.e);
          let val = hex;
          if (f.t === "int") val = hexToInt(hex);
          if (f.t === "float") val = hexToFloatLE(hex);
          if (f.t === "date") val = hexToDateBCD(hex);
          if (f.t === "speed_nibble") val = hexToSpeedNibble(hex);
          if (f.t === "imei") val = hex.substring(1);

          return (
            <Grid item xs={6} sm={4} md={2} key={i}>
              <TextField
                label={f.l}
                fullWidth
                size="small"
                value={val}
                type={f.t === "date" ? "datetime-local" : "text"}
                disabled={f.r}
                onChange={(e) =>
                  handleValueChange(f.t, f.s, f.e, e.target.value)
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          );
        })}
      </Grid>

      <Divider sx={{ mb: 3 }} />

      {/* BLE SELECTOR */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <TextField
            label="BLE Data Code"
            select
            fullWidth
            size="small"
            value={bleCodeHex}
            onChange={(e) => handleValueChange("hex", 40, 41, e.target.value)}
          >
            {Object.keys(PAYLOAD_DEFS).map((k) => (
              <MenuItem key={k} value={k}>
                0x{k} ({PAYLOAD_DEFS[k].name})
              </MenuItem>
            ))}
            <MenuItem value="0000">Unknown / Other</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Chip
            label={`Detected: ${definition?.name || "Unknown"}`}
            color={definition ? "success" : "default"}
            variant="outlined"
          />
        </Grid>
      </Grid>

      {/* DYNAMIC PAYLOAD */}
      {definition ? (
        <Box>
          {Array.from({ length: recordCount }).map((_, rIdx) => {
            const base = PAYLOAD_START + rIdx * definition.size;
            return (
              <Paper key={rIdx} variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: "bold", display: "block", mb: 1 }}
                >
                  Record #{rIdx + 1} (Bytes {base}-{base + definition.size - 1})
                </Typography>
                <Grid container spacing={2}>
                  {definition.fields.map((field, fIdx) => {
                    // Calculate exact start byte for this field
                    // Offset is the sum of sizes of previous fields
                    let offset = 0;
                    for (let k = 0; k < fIdx; k++)
                      offset += definition.fields[k].size;

                    const start = base + offset;
                    const end = start + field.size - 1;
                    const hex = getHexSegment(start, end);

                    let val = hex;
                    if (field.type === "bat_tire") val = decodeBatTire(hex);
                    if (field.type === "bat_std") val = decodeBatStd(hex);
                    if (field.type === "press") val = decodePress(hex);
                    if (field.type === "temp_tire") val = decodeTireTemp(hex);
                    if (field.type === "temp_std") val = decodeTemp(hex);
                    if (field.type === "rssi") val = decodeRssi(hex);
                    if (field.type === "int") val = hexToInt(hex);
                    if (field.type === "float_01")
                      val = (hexToInt(hex) * 0.01).toFixed(2);

                    return (
                      <Grid item xs={6} sm={3} key={fIdx}>
                        <TextField
                          label={field.label}
                          fullWidth
                          size="small"
                          helperText={field.helper}
                          value={val}
                          onChange={(e) =>
                            handleValueChange(
                              field.type,
                              start,
                              end,
                              e.target.value
                            )
                          }
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                    );
                  })}
                </Grid>
              </Paper>
            );
          })}
          {recordCount === 0 && (
            <Typography>No valid records found for this code.</Typography>
          )}
        </Box>
      ) : (
        <Typography color="text.secondary">
          Select a valid BLE Code to parse payload.
        </Typography>
      )}
    </Box>
  );
}
