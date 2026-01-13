import React, { useState } from "react";
import {
  TextField,
  Typography,
  Grid,
  Box,
  Button,
  Divider,
  Paper,
  MenuItem,
  Chip,
} from "@mui/material";

/* =====================
   Utilities
===================== */

const cleanHex = (h) => (h || "").replace(/\s/g, "").toUpperCase();
const hexToInt = (hex) => parseInt(hex || "0", 16) || 0;

const intToHex = (val, bytes) => {
  let num = Number(val);
  if (isNaN(num)) num = 0;
  // clip into unsigned range
  const max = Math.pow(2, bytes * 8);
  if (num < 0) {
    num = max + num; // two's complement conversion for negative numbers
  }
  num = Math.floor(num);
  num = Math.max(0, Math.min(max - 1, num));
  return num
    .toString(16)
    .padStart(bytes * 2, "0")
    .toUpperCase();
};

const hexToFloatLE = (hex) => {
  if (!hex || hex.length !== 8) return 0;
  const bytes = new Uint8Array(
    hex.match(/.{1,2}/g).map((b) => parseInt(b, 16))
  );
  const view = new DataView(bytes.buffer);
  return parseFloat(view.getFloat32(0, true).toFixed(6));
};

const floatToHexLE = (val) => {
  const view = new DataView(new ArrayBuffer(4));
  view.setFloat32(0, Number(val) || 0, true);
  let hex = "";
  for (let i = 0; i < 4; i++)
    hex += view.getUint8(i).toString(16).padStart(2, "0");
  return hex.toUpperCase();
};

const hexToDateBCD = (hex) => {
  if (!hex || hex.length !== 12) return "";
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
   Formulas (kept original formulas, made safer)
===================== */

const decodeBatStd = (hex) => ((200 + hexToInt(hex)) * 0.01).toFixed(2);
const encodeBatStd = (val) => intToHex(Math.round(Number(val) / 0.01 - 200), 1);

const decodeBatTire = (hex) => (1.22 + 0.01 * hexToInt(hex)).toFixed(2);
const encodeBatTire = (val) =>
  intToHex(Math.round((Number(val) - 1.22) / 0.01), 1);

const decodeTemp16 = (hex) => {
  let val = parseInt(hex || "0", 16);
  if ((val & 0x8000) > 0) val = val - 0x10000;
  return (val * 0.01).toFixed(2);
};
const encodeTemp16 = (val) => {
  let raw = Math.round(Number(val) / 0.01);
  if (raw < 0) raw = 0xffff + raw + 1;
  return intToHex(raw, 2);
};

const decodePress = (hex) => (1.572 * 2 * hexToInt(hex)).toFixed(2);
const encodePress = (val) => intToHex(Math.round(Number(val) / (1.572 * 2)), 1);

const decodeTempTire = (hex) => hexToInt(hex) - 55;
const encodeTempTire = (val) => intToHex(Math.round(Number(val) + 55), 1);

const decodeRssi = (hex) => hexToInt(hex) - 128;
const encodeRssi = (val) => intToHex(Math.round(Number(val) + 128), 1);

/* =====================
   Payload Definitions (normalized to `size`)
   NOTE: I converted your `s` keys to `size`. If you prefer `s`, change the code below accordingly.
===================== */
const PAYLOAD_DEFS = {
  "0001": {
    name: "Tire Pressure",
    size: 10,
    fields: [
      { l: "MAC", size: 6, t: "hex" },
      { l: "Volt (V)", size: 1, t: "bat_tire" },
      { l: "Press (kPa)", size: 1, t: "press" },
      { l: "Temp (°C)", size: 1, t: "temp_tire" },
      { l: "Status", size: 1, t: "hex", h: "00=Norm" },
    ],
  },
  "0002": {
    name: "SOS Tag",
    size: 25,
    fields: [
      { l: "MAC", size: 6, t: "hex" },
      { l: "Volt (3.xV)", size: 1, t: "hex" },
      { l: "Type", size: 1, t: "hex", h: "00=SOS, 01=LowBat" },
      { l: "GNSS Stat", size: 1, t: "hex" },
      { l: "Alt", size: 4, t: "float" },
      { l: "Lon", size: 4, t: "float" },
      { l: "Lat", size: 4, t: "float" },
      { l: "Speed", size: 2, t: "int" },
      { l: "Dir", size: 2, t: "int" },
    ],
  },
  "0003": {
    name: "Driver ID",
    size: 25,
    fields: [
      { l: "MAC", size: 6, t: "hex" },
      { l: "Volt (3.xV)", size: 1, t: "hex" },
      { l: "Type", size: 1, t: "hex", h: "00=ID, 01=LowBat" },
      { l: "GNSS Stat", size: 1, t: "hex" },
      { l: "Alt", size: 4, t: "float" },
      { l: "Lon", size: 4, t: "float" },
      { l: "Lat", size: 4, t: "float" },
      { l: "Speed", size: 2, t: "int" },
      { l: "Dir", size: 2, t: "int" },
    ],
  },
  "0004": {
    name: "Temp/Hum Sensor",
    size: 14,
    fields: [
      { l: "MAC", size: 6, t: "hex" },
      { l: "Volt (V)", size: 1, t: "bat_std" },
      { l: "Bat %", size: 1, t: "int" },
      { l: "Temp (°C)", size: 2, t: "temp16" },
      { l: "Hum %", size: 2, t: "float_01" },
      { l: "Light/Sts", size: 1, t: "hex" },
      { l: "RSSI", size: 1, t: "rssi" },
    ],
  },
  "0005": {
    name: "Door Sensor",
    size: 12,
    fields: [
      { l: "MAC", size: 6, t: "hex" },
      { l: "Volt (V)", size: 1, t: "bat_std" },
      { l: "Bat %", size: 1, t: "int" },
      { l: "Temp (°C)", size: 2, t: "temp16" },
      { l: "Door Sts", size: 1, t: "hex", h: "Bit0:1=Open" },
      { l: "RSSI", size: 1, t: "rssi" },
    ],
  },
  "0006": {
    name: "Relay",
    size: 12,
    fields: [
      { l: "MAC", size: 6, t: "hex" },
      { l: "Volt (V)", size: 1, t: "bat_std" },
      { l: "Ext Pwr %", size: 1, t: "int" },
      { l: "Temp (°C)", size: 2, t: "temp16" },
      { l: "Relay Sts", size: 1, t: "hex", h: "01=On" },
      { l: "RSSI", size: 1, t: "rssi" },
    ],
  },
  "0007": {
    name: "Fuel Sensor",
    size: 15,
    fields: [
      { l: "MAC", size: 6, t: "hex" },
      { l: "Volt (V)", size: 1, t: "bat_std" },
      { l: "ADC", size: 2, t: "int" },
      { l: "Temp (°C)", size: 2, t: "temp16" },
      { l: "Height", size: 2, t: "int", h: "Reserved" },
      { l: "State", size: 1, t: "hex", h: "01=Fill,02=Leak" },
      { l: "RSSI", size: 1, t: "rssi" },
    ],
  },
  "000A": {
    name: "Analog Sensor",
    size: 19,
    fields: [
      { l: "MAC", size: 6, t: "hex" },
      { l: "Bat %", size: 1, t: "int" },
      { l: "Type", size: 1, t: "hex", h: "0=V,1=A,2=T" },
      { l: "Value", size: 4, t: "int" },
      { l: "Hours", size: 4, t: "int" },
      { l: "Tx Pwr", size: 1, t: "int" },
      { l: "Status", size: 1, t: "hex" },
      { l: "RSSI", size: 1, t: "rssi" },
    ],
  },
  "000B": {
    name: "MiTag",
    size: 23,
    fields: [
      { l: "MAC", size: 6, t: "hex" },
      { l: "Volt (V)", size: 1, t: "bat_std" },
      { l: "Temp (°C)", size: 2, t: "temp16" },
      { l: "Hum %", size: 2, t: "float_01" },
      { l: "Press (Pa)", size: 2, t: "press_offset" },
      { l: "Lux", size: 2, t: "int" },
      { l: "Acc X", size: 2, t: "acc_mg" },
      { l: "Acc Y", size: 2, t: "acc_mg" },
      { l: "Acc Z", size: 2, t: "acc_mg" },
      { l: "Status", size: 1, t: "hex" },
      { l: "RSSI", size: 1, t: "rssi" },
    ],
  },
  "000C": { name: "Pass-Through", size: -1, varLen: true },
  "000D": { name: "Roambee/2397", size: -1, varLen: true },
  "000E": {
    name: "iBeacon",
    size: 28,
    fields: [
      { l: "MAC", size: 6, t: "hex" },
      { l: "RSSI 1m", size: 1, t: "rssi" },
      { l: "UUID", size: 16, t: "hex" },
      { l: "Major", size: 2, t: "int" },
      { l: "Minor", size: 2, t: "int" },
      { l: "RSSI", size: 1, t: "rssi" },
    ],
  },
  "000F": {
    name: "Eddystone UID",
    size: 7,
    fields: [
      { l: "MAC", size: 6, t: "hex" },
      { l: "RSSI", size: 1, t: "rssi" },
    ],
  },
  "0011": {
    name: "Eddystone TLM",
    size: 11,
    fields: [
      { l: "MAC", size: 6, t: "hex" },
      { l: "Bat (mV)", size: 2, t: "int" },
      { l: "Temp", size: 2, t: "eddystone_temp" },
      { l: "RSSI", size: 1, t: "rssi" },
    ],
  },
  "0014": { name: "UNO (Variable)", size: -1, varLen: true },
};

/* =====================
   Component
===================== */

export default function BleMessageDecoderFixed() {
  // default sample (your original)
  const [rawInput, setRawInput] = useState(
    "2525100027000b0867284063992640260113103324000007cf75c68ca511a000040708ffff0047"
  );
  const [newImei, setNewImei] = useState("");

  const clean = cleanHex(rawInput);

  // BLE code is at byte 23 (1-based) -> convert to string indices
  const bleCodeHex = clean.substring((23 - 1) * 2, 24 * 2);
  const definition = PAYLOAD_DEFS[bleCodeHex];
  const payloadHex = clean.substring((25 - 1) * 2); // bytes from 25 onward

  const getHexSegment = (s, e) => {
    // s,e are 1-based byte positions in whole message
    const neededLen = (e - s + 1) * 2;
    const startIndex = (s - 1) * 2;
    const endIndex = e * 2;
    if (clean.length < endIndex) {
      // pad with zeros if not enough bytes
      const actual = clean.substring(startIndex, clean.length);
      const missing =
        neededLen -
        (actual.length - Math.max(0, startIndex - Math.max(0, startIndex)));
      return (actual + "0".repeat(Math.max(0, missing)))
        .padEnd(neededLen, "0")
        .toUpperCase();
    }
    return clean.substring(startIndex, endIndex).toUpperCase();
  };

  const updateHexSegment = (s, e, newSegment) => {
    const startIndex = (s - 1) * 2;
    const endIndex = e * 2;
    const before = clean.substring(0, startIndex);
    const after = clean.substring(endIndex);
    setRawInput(before + newSegment + after);
  };

  const handleValueChange = (type, start, end, value) => {
    const byteLength = end - start + 1;
    let newHex = "";
    try {
      if (type === "int")
        newHex = intToHex(Math.round(Number(value) || 0), byteLength);
      else if (type === "float") newHex = floatToHexLE(Number(value) || 0);
      else if (type === "date") newHex = dateToHexBCD(value);
      else if (type === "bat_std") newHex = encodeBatStd(Number(value));
      else if (type === "bat_tire") newHex = encodeBatTire(Number(value));
      else if (type === "temp16") newHex = encodeTemp16(Number(value));
      else if (type === "press") newHex = encodePress(Number(value));
      else if (type === "temp_tire") newHex = encodeTempTire(Number(value));
      else if (type === "rssi") newHex = encodeRssi(Number(value));
      else if (type === "float_01")
        newHex = intToHex(Math.round((Number(value) || 0) / 0.01), byteLength);
      else if (type === "acc_mg")
        newHex = intToHex(Math.round(Number(value) || 0), byteLength);
      else if (type === "press_offset")
        newHex = intToHex(Math.round(Number(value) - 50000), byteLength);
      else if (type === "eddystone_temp")
        newHex = intToHex(Math.round(Number(value) * 256), byteLength);
      else if (type === "imei") {
        const imeiStr = value
          .toString()
          .replace(/\D/g, "")
          .padEnd(15, "0")
          .substring(0, 15);
        // Prepend 0 nibble then convert decimal digits 0-9 into hex nibbles
        // This follows your original behavior: one extra leading nibble '0'
        newHex =
          "0" +
          imeiStr
            .split("")
            .map((d) => parseInt(d, 10).toString(16))
            .join("")
            .toUpperCase();
        // ensure length equals byteLength*2
        newHex = newHex
          .padStart(byteLength * 2, "0")
          .substring(0, byteLength * 2);
      } else {
        // generic hex field: sanitize and pad/truncate
        newHex = String(value)
          .replace(/[^0-9A-Fa-f]/g, "")
          .toUpperCase();
        if (newHex.length > byteLength * 2)
          newHex = newHex.substring(0, byteLength * 2);
        else newHex = newHex.padStart(byteLength * 2, "0");
      }
      updateHexSegment(start, end, newHex);
    } catch (e) {
      console.error("encode error", e);
    }
  };

  const handleModifyImei = () => {
    if (newImei.length === 15) handleValueChange("imei", 8, 15, newImei);
  };

  const renderPayload = () => {
    if (!definition)
      return <Typography>Unknown BLE Code 0x{bleCodeHex}</Typography>;

    if (definition.varLen) {
      return (
        <Typography>
          Variable Length Payload (Pass-through/UNO). Edit via Raw Hex.
        </Typography>
      );
    }

    // records present from byte 25 onward
    const recordCount = Math.floor(payloadHex.length / (definition.size * 2));
    return (
      <Box>
        {Array.from({ length: Math.max(1, recordCount) }).map((_, i) => {
          const base = 25 + i * definition.size; // base byte index (1-based)
          return (
            <Paper key={i} variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography
                variant="caption"
                sx={{ fontWeight: "bold", display: "block", mb: 1 }}
              >
                {definition.name} #{i + 1}
              </Typography>
              <Grid container spacing={2}>
                {definition.fields.map((f, fi) => {
                  // support backwards-compatible key 's' if present
                  const fsize = f.size ?? f.s ?? 1;
                  const offset = definition.fields
                    .slice(0, fi)
                    .reduce((sum, ff) => sum + (ff.size ?? ff.s ?? 1), 0);
                  const start = base + offset;
                  const end = start + fsize - 1;
                  const hex = getHexSegment(start, end);

                  let val = hex;
                  if (f.t === "int") val = hexToInt(hex);
                  else if (f.t === "float") val = hexToFloatLE(hex);
                  else if (f.t === "bat_std") val = decodeBatStd(hex);
                  else if (f.t === "bat_tire") val = decodeBatTire(hex);
                  else if (f.t === "temp16") val = decodeTemp16(hex);
                  else if (f.t === "press") val = decodePress(hex);
                  else if (f.t === "temp_tire") val = decodeTempTire(hex);
                  else if (f.t === "rssi") val = decodeRssi(hex);
                  else if (f.t === "float_01")
                    val = (hexToInt(hex) * 0.01).toFixed(2);
                  else if (f.t === "acc_mg") {
                    let v = parseInt(hex || "0", 16);
                    if ((v & 0x8000) > 0) v = v - 0x10000;
                    val = v;
                  } else if (f.t === "press_offset")
                    val = hexToInt(hex) + 50000;
                  else if (f.t === "eddystone_temp")
                    val = (hexToInt(hex) / 256).toFixed(2);
                  // default: keep hex string (for MAC/UUID/Status etc.)
                  return (
                    <Grid item xs={6} sm={3} md={2} key={fi}>
                      <TextField
                        label={f.l}
                        fullWidth
                        size="small"
                        value={String(val)}
                        helperText={f.h}
                        onChange={(e) =>
                          handleValueChange(
                            f.t ?? "hex",
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
                          color: "text.secondary",
                          fontFamily: "monospace",
                          mt: 0.5,
                        }}
                      >
                        0x{hex}
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
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography
        variant="h5"
        sx={{ mb: 2, color: "secondary.main", fontWeight: "bold" }}
      >
        BLE Message Decoder (0x10) — Fixed
      </Typography>

      <TextField
        label="Raw Hex"
        fullWidth
        multiline
        minRows={3}
        value={rawInput}
        onChange={(e) =>
          setRawInput(e.target.value.replace(/[^0-9a-fA-F]/g, "").toUpperCase())
        }
        sx={{ mb: 2 }}
        InputProps={{ style: { fontFamily: "monospace" } }}
      />

      <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
        <Button
          variant="outlined"
          onClick={() => navigator.clipboard.writeText(cleanHex(rawInput))}
        >
          Copy Hex
        </Button>
      </Box>

      {/* IMEI */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Device IMEI
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={8}>
            <TextField
              label="New 15-digit IMEI"
              fullWidth
              size="small"
              value={newImei}
              onChange={(e) => setNewImei(e.target.value.replace(/\D/g, ""))}
              inputProps={{ maxLength: 15 }}
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
      </Paper>

      {/* HEADER */}
      <Typography
        variant="subtitle1"
        sx={{ fontWeight: "bold", mb: 1, color: "primary.main" }}
      >
        Message Header
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={2}>
          <TextField
            label="Type"
            value="0x10"
            disabled
            fullWidth
            size="small"
          />
        </Grid>
        <Grid item xs={6} sm={2}>
          <TextField
            label="Len"
            value={hexToInt(getHexSegment(4, 5))}
            disabled
            fullWidth
            size="small"
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            label="Serial"
            value={hexToInt(getHexSegment(6, 7))}
            disabled
            fullWidth
            size="small"
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            label="IMEI"
            value={getHexSegment(8, 15).substring(1)}
            disabled
            fullWidth
            size="small"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Time"
            fullWidth
            size="small"
            type="datetime-local"
            value={hexToDateBCD(getHexSegment(16, 21))}
            onChange={(e) => handleValueChange("date", 16, 21, e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Typography
            variant="caption"
            display="block"
            sx={{ color: "text.secondary", fontFamily: "monospace" }}
          >
            0x{getHexSegment(16, 21)}
          </Typography>
        </Grid>
        <Grid item xs={6} sm={2}>
          <TextField
            label="ACC"
            fullWidth
            size="small"
            value={getHexSegment(22, 22)}
            onChange={(e) => handleValueChange("hex", 22, 22, e.target.value)}
            helperText="00=OFF, 01=ON"
          />
        </Grid>
      </Grid>

      <Divider sx={{ mb: 4 }} />

      {/* BLE SELECTOR */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              select
              label="BLE Data Code"
              fullWidth
              size="small"
              value={bleCodeHex}
              onChange={(e) => handleValueChange("hex", 23, 24, e.target.value)}
            >
              {Object.keys(PAYLOAD_DEFS).map((k) => (
                <MenuItem key={k} value={k}>
                  0x{k} - {PAYLOAD_DEFS[k].name}
                </MenuItem>
              ))}
              <MenuItem value="FFFF">Custom</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Chip
              label={definition ? definition.name : "Unknown"}
              color={definition ? "success" : "default"}
            />
          </Grid>
        </Grid>
      </Box>

      {/* DYNAMIC PAYLOAD */}
      {renderPayload()}
    </Box>
  );
}
