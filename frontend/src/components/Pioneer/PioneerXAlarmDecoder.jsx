import React, { useState } from "react";
import {
  TextField,
  Typography,
  Grid,
  Box,
  Button,
  Divider,
  Paper,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  MenuItem,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

/* =====================
   Utilities
===================== */

const cleanHex = (h) => (h || "").replace(/\s/g, "").toUpperCase();
const hexToInt = (hex) => parseInt(hex, 16) || 0;

// Int to Hex
const intToHex = (val, bytes) => {
  let num = Number(val);
  if (isNaN(num)) num = 0;
  if (num < 0) num = Math.pow(2, bytes * 8) + num; // 2's complement
  return Math.max(0, Math.min(Math.pow(2, bytes * 8) - 1, Math.floor(num)))
    .toString(16)
    .padStart(bytes * 2, "0")
    .toUpperCase();
};

// Float Little Endian
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

// Signed 16-bit
const hexToSignedInt = (hex) => {
  let val = parseInt(hex, 16);
  if ((val & 0x8000) > 0) val = val - 0x10000;
  return val;
};

// Date BCD
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

// Coolant (Offset -40)
const decodeTemp8 = (hex) => {
  let val = parseInt(hex, 16);
  return val > 127 ? val - 256 : val;
};
const encodeTemp8 = (val) => {
  let num = parseInt(val);
  if (num < 0) num = 256 + num;
  return intToHex(num, 1);
};

/* =====================
   Alarm Codes (0x34 Spec)
===================== */
const ALARM_TYPES = {
  "01": "SOS",
  "02": "External Power Cut",
  "03": "Vibration",
  "04": "Enter Fence",
  "05": "Exit Fence",
  "06": "Over Speed",
  "09": "Moving",
  "0A": "Enter GPS Dead Zone",
  "0B": "Exit GPS Dead Zone",
  "0C": "Power ON",
  "0D": "GPS First Fix",
  "0E": "Low Battery",
  "0F": "Low Ext Power",
  10: "SIM Changed",
  11: "Power OFF",
  12: "Airplane Mode",
  13: "Disassemble",
  14: "Door Open",
  15: "Movement (Ignition OFF)",
  16: "Fuel Low",
  17: "Fuel High",
  19: "Harsh Accel",
  "1A": "Harsh Brake",
  "1B": "Harsh Turn",
  "1C": "Harsh Lane Change",
  "1D": "Crash",
  "1E": "Rollover",
  41: "Digital Input 1 High",
  42: "Digital Input 1 Low",
  46: "Jamming Start",
  47: "Jamming Stop",
  49: "Device Removed",
  "4A": "Device Install",
  58: "Fatigue Driving",
  FE: "ACC ON",
  FF: "ACC OFF",
};

/* =====================
   Schema (0x34)
===================== */
const SCHEMA = [
  { label: "Header", s: 1, e: 2, t: "hex", r: true },
  { label: "Msg Type (0x34)", s: 3, e: 3, t: "hex", r: true },
  { label: "Packet Length", s: 4, e: 5, t: "int" },
  { label: "Serial", s: 6, e: 7, t: "int" },
  { label: "IMEI", s: 8, e: 15, t: "imei", r: true },

  // Configs
  { label: "Ign ON Int (s)", s: 16, e: 17, t: "int" },
  { label: "Ign OFF Int (s)", s: 18, e: 19, t: "int" },
  { label: "Angle Int (°)", s: 20, e: 20, t: "int" },
  { label: "Dist Int (m)", s: 21, e: 22, t: "int" },
  { label: "Speed Alm (%)", s: 23, e: 23, t: "hex" },

  // Status
  { label: "GNSS Status", s: 24, e: 24, t: "hex" },
  { label: "G-Sens Status", s: 25, e: 25, t: "hex" },
  { label: "Others", s: 26, e: 26, t: "hex" },

  { label: "Heartbeat", s: 27, e: 27, t: "int" },
  { label: "Relay/Speed", s: 28, e: 28, t: "int" },
  { label: "Drag Alarm", s: 29, e: 30, t: "int" },

  // IO
  { label: "Digital IN", s: 31, e: 31, t: "hex" },
  { label: "Digital OUT", s: 32, e: 32, t: "hex" },
  { label: "Reserved", s: 33, e: 33, t: "hex" },

  // Analog
  { label: "Analog 0", s: 34, e: 35, t: "int" },
  { label: "Analog 1", s: 36, e: 37, t: "int" },
  { label: "Analog 2", s: 38, e: 39, t: "int" },

  { label: "Multiplex", s: 40, e: 43, t: "int" },

  // ALARM TYPE (Critical Field for 0x34)
  { label: "ALARM TYPE", s: 44, e: 44, t: "alarm_type" },

  { label: "Reserved", s: 45, e: 45, t: "hex" },

  // GNSS
  { label: "Odometer", s: 46, e: 49, t: "int" },
  { label: "Bat %", s: 50, e: 50, t: "int" },
  { label: "Date/Time", s: 51, e: 56, t: "date" },
  { label: "Altitude", s: 57, e: 60, t: "float" },
  { label: "Longitude", s: 61, e: 64, t: "float" },
  { label: "Latitude", s: 65, e: 68, t: "float" },
  { label: "Speed", s: 69, e: 70, t: "int" },
  { label: "Direction", s: 71, e: 72, t: "int" },

  // Power / FMS
  { label: "Int Bat (V/100)", s: 73, e: 74, t: "float_div100" },
  { label: "Ext Pwr (V/100)", s: 75, e: 76, t: "float_div100" },
  { label: "RPM", s: 77, e: 78, t: "int" },
  { label: "FMS Speed", s: 79, e: 80, t: "int" },
  { label: "Bat Mon", s: 81, e: 82, t: "int" },
  { label: "Dev Temp", s: 83, e: 83, t: "temp8" },
  { label: "HDOP", s: 84, e: 85, t: "int" },
  { label: "Coolant", s: 86, e: 86, t: "coolant" }, // Special offset
  { label: "Fuel %", s: 87, e: 87, t: "int" },
  { label: "Eng Load", s: 88, e: 88, t: "int" },
  { label: "Fuel Total", s: 89, e: 92, t: "int" },

  // Raw G-Sensor
  { label: "Accel X", s: 93, e: 94, t: "signed_int" },
  { label: "Accel Y", s: 95, e: 96, t: "signed_int" },
  { label: "Accel Z", s: 97, e: 98, t: "signed_int" },
  { label: "Gyro X", s: 99, e: 100, t: "signed_int" },
  { label: "Gyro Y", s: 101, e: 102, t: "signed_int" },
  { label: "Gyro Z", s: 103, e: 104, t: "signed_int" },
];

export default function PioneerXAlarmDecoder() {
  const [rawInput, setRawInput] = useState(
    "252534005700010880616898888888000A00FF2001000020009600989910101010999905550155015500000150010000101005050005051010050558866B4276D6E342912AB441111505050410101003FFFFFFFF5002BC82FF0001E10500100001FC1700100001FC17"
  );
  const [newImei, setNewImei] = useState("");

  const clean = cleanHex(rawInput);

  const getHexSegment = (s, e) => {
    if (clean.length < e * 2) return "00".repeat(e - s + 1);
    return clean.substring((s - 1) * 2, e * 2);
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
      if (type === "int") newHex = intToHex(value, byteLength);
      else if (type === "float") newHex = floatToHexLE(value);
      else if (type === "date") newHex = dateToHexBCD(value);
      else if (type === "float_div100")
        newHex = intToHex(value * 100, byteLength);
      else if (type === "temp8") newHex = encodeTemp8(value);
      else if (type === "coolant") newHex = intToHex(parseInt(value) + 40, 1);
      else if (type === "signed_int") newHex = intToHex(value, byteLength);
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
      console.error(e);
    }
  };

  const handleModifyImei = () => {
    if (newImei.length === 15) handleValueChange("imei", 8, 15, newImei);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography
        variant="h5"
        sx={{ mb: 2, color: "error.main", fontWeight: "bold" }}
      >
        PioneerX 101 Alarm Decoder (0x34)
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

      {/* FIELDS */}
      <Grid container spacing={2}>
        {SCHEMA.map((f, i) => {
          const hex = getHexSegment(f.s, f.e);
          let val = hex;

          if (f.t === "int") val = hexToInt(hex);
          else if (f.t === "float") val = hexToFloatLE(hex);
          else if (f.t === "date") val = hexToDateBCD(hex);
          else if (f.t === "float_div100")
            val = (hexToInt(hex) / 100).toFixed(2);
          else if (f.t === "temp8") val = decodeTemp8(hex);
          else if (f.t === "coolant") val = hexToInt(hex) - 40;
          else if (f.t === "signed_int") val = hexToSignedInt(hex);
          else if (f.t === "imei") val = hex.substring(1);

          // Special Rendering: ALARM TYPE Dropdown
          if (f.t === "alarm_type") {
            return (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <TextField
                  select
                  label={f.label}
                  fullWidth
                  size="small"
                  value={hex}
                  onChange={(e) =>
                    handleValueChange("hex", f.s, f.e, e.target.value)
                  }
                  error={!ALARM_TYPES[hex]}
                  helperText={ALARM_TYPES[hex] || "Unknown Code"}
                  sx={{
                    "& .MuiInputBase-input": {
                      fontWeight: "bold",
                      color: "error.main",
                    },
                  }}
                >
                  {Object.entries(ALARM_TYPES).map(([code, desc]) => (
                    <MenuItem key={code} value={code}>
                      0x{code} - {desc}
                    </MenuItem>
                  ))}
                  <MenuItem value={hex}>Custom (0x{hex})</MenuItem>
                </TextField>
              </Grid>
            );
          }

          const isSectionHeader =
            i === 0 ||
            i === 5 ||
            i === 18 ||
            i === 30 ||
            i === 36 ||
            i === 51 ||
            i === 65 ||
            i === 73 ||
            i === 83;
          let sectionTitle = "";
          if (i === 0) sectionTitle = "Header";
          if (i === 5) sectionTitle = "Config";
          if (i === 18) sectionTitle = "IO & Status";
          if (i === 30) sectionTitle = "Analog & Alarm";
          if (i === 36) sectionTitle = "GNSS";
          if (i === 51) sectionTitle = "Power";
          if (i === 65) sectionTitle = "FMS / Engine";
          if (i === 73) sectionTitle = "Raw Sensors";

          return (
            <React.Fragment key={i}>
              {isSectionHeader && (
                <Grid item xs={12}>
                  <Divider textAlign="left" sx={{ mt: 2, mb: 1 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: "bold" }}
                    >
                      {sectionTitle}
                    </Typography>
                  </Divider>
                </Grid>
              )}
              <Grid item xs={6} sm={4} md={3} lg={2}>
                <Tooltip title={`Bytes ${f.s}-${f.e} (0x${hex})`}>
                  <TextField
                    label={f.label}
                    fullWidth
                    size="small"
                    value={val}
                    disabled={f.r}
                    type={
                      f.t === "int" ||
                      f.t.includes("float") ||
                      f.t === "signed_int"
                        ? "number"
                        : f.t === "date"
                        ? "datetime-local"
                        : "text"
                    }
                    onChange={(e) =>
                      handleValueChange(f.t, f.s, f.e, e.target.value)
                    }
                    InputLabelProps={{ shrink: true }}
                    inputProps={{
                      step: f.t.includes("float") ? "0.000001" : "1",
                      style: { fontSize: "0.85rem" },
                    }}
                  />
                </Tooltip>
              </Grid>
            </React.Fragment>
          );
        })}
      </Grid>

      {/* SENSOR VISUALIZER */}
      <Box sx={{ mt: 4 }}>
        <Accordion variant="outlined">
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: "bold" }}>
              G-Sensor & Gyro Data
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {[
                "Accel X",
                "Accel Y",
                "Accel Z",
                "Gyro X",
                "Gyro Y",
                "Gyro Z",
              ].map((axis, idx) => {
                const s = 93 + idx * 2;
                const hex = getHexSegment(s, s + 1);
                const val = hexToSignedInt(hex);
                const unit = idx < 3 ? "mg" : "dps";
                return (
                  <Grid item xs={6} sm={2} key={idx}>
                    <Paper
                      sx={{
                        p: 1,
                        textAlign: "center",
                        bgcolor: idx < 3 ? "#e3f2fd" : "#fff3e0",
                      }}
                    >
                      <Typography variant="caption" display="block">
                        {axis}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        {val} {unit}
                      </Typography>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Box>
  );
}
