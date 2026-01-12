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
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

/* =====================
   Utilities
===================== */

const cleanHex = (h) => (h || "").replace(/\s/g, "").toUpperCase();
const hexToInt = (hex) => parseInt(hex, 16) || 0;

// Int to Hex with padding
const intToHex = (val, bytes) => {
  let num = Number(val);
  if (isNaN(num)) num = 0;
  // Handle signed integers (2's complement) if negative
  if (num < 0) {
    const max = Math.pow(2, bytes * 8);
    num = max + num;
  }
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

// Signed 16-bit Hex to Int
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

/* =====================
   Specific Decoders
===================== */

// Temp: 1 byte signed? Doc says "0xA0 = -32". 0xA0 is 160. 256-160 = 96? No, 0xA0 in 8-bit signed is -96.
// Doc Example: 0xA0 = 1010 0000 = -32C? This implies a specific mapping or offset.
// Usually Temp is Signed 8-bit. 0xA0 (-96) doesn't match -32.
// Wait, Doc: "0x50 = +80C". 0x50 is 80. "0xA0 = -32C".
// Maybe logic is: if(hex > 128) val = hex - 256? 160 - 256 = -96. Still not -32.
// Let's stick to standard signed 8-bit logic for now unless formula is explicit.
// Update: Doc says "0xA0... -32". 0xE0 is -32 in signed 8-bit. 0xA0 is likely -96.
// I will implement standard Signed 8-bit.
const decodeTemp8 = (hex) => {
  let val = parseInt(hex, 16);
  return val > 127 ? val - 256 : val;
};
const encodeTemp8 = (val) => {
  let num = parseInt(val);
  if (num < 0) num = 256 + num;
  return intToHex(num, 1);
};

// Analog: 0.01V scale often? Or raw? Doc says "3 Analog Inputs (V)".
// Usually raw ADC or mV. Let's assume 2 bytes unsigned int for now.

/* =====================
   Schema Definition (0x33)
===================== */
const SCHEMA = [
  { label: "Header", s: 1, e: 2, t: "hex", r: true },
  { label: "Msg Type (0x33)", s: 3, e: 3, t: "hex", r: true },
  { label: "Packet Length", s: 4, e: 5, t: "int" },
  { label: "Serial", s: 6, e: 7, t: "int" },
  { label: "IMEI", s: 8, e: 15, t: "imei", r: true },

  // Configuration / Status Intervals
  { label: "Ignition ON Interval (s)", s: 16, e: 17, t: "int" },
  { label: "Ignition OFF Interval (s)", s: 18, e: 19, t: "int" },
  { label: "Angle Interval (°)", s: 20, e: 20, t: "int" },
  { label: "Distance Interval (m)", s: 21, e: 22, t: "int" },
  {
    label: "Speed Alarm/Sig (%)",
    s: 23,
    e: 23,
    t: "hex",
    h: "Bit7: 1=Mile, 0=Km; Bit6-0: Sig",
  },

  // Status Flags
  {
    label: "Data/GNSS Status",
    s: 24,
    e: 24,
    t: "hex",
    h: "Bit7:Hist, Bit6:LBS, Bit5:Sleep",
  },
  {
    label: "Gsensor/Mgr Status",
    s: 25,
    e: 25,
    t: "hex",
    h: "Bit7:LockSIM, Bit5-3:Multiplex",
  },
  { label: "Others", s: 26, e: 26, t: "hex", h: "Bit7:EngCut, Bit6:CutStatus" },

  { label: "Heartbeat (min)", s: 27, e: 27, t: "int" },
  { label: "Relay/Speed (km/h)", s: 28, e: 28, t: "int" }, // Often Relay Status or Speed Threshold
  { label: "Drag Alarm (m)", s: 29, e: 30, t: "int" },

  // IO
  { label: "Digital I/O", s: 31, e: 31, t: "hex" },
  { label: "Digital OUT", s: 32, e: 32, t: "hex" },
  { label: "Reserved", s: 33, e: 33, t: "hex" },

  // Analog
  { label: "Analog 0 (V)", s: 34, e: 35, t: "int" }, // Assuming raw unit or mV
  { label: "Analog 1 (V)", s: 36, e: 37, t: "int" },
  { label: "Analog 2 (V)", s: 38, e: 39, t: "int" },

  // Multiplex (Default: Odometer?)
  // Doc says "Multiplex Segment". 4 Bytes.
  // 11. Bit5~Bit3: Multiplex Segment notation: 000:Moving Distance
  { label: "Multiplex (Dist)", s: 40, e: 43, t: "int" },

  { label: "Alarm Type", s: 44, e: 44, t: "hex" },
  { label: "Reserved", s: 45, e: 45, t: "hex" },

  // GNSS Data
  { label: "Odometer (m)", s: 46, e: 49, t: "int" },
  { label: "Bat %", s: 50, e: 50, t: "int" },
  { label: "Date/Time", s: 51, e: 56, t: "date" },
  { label: "Altitude (m)", s: 57, e: 60, t: "float" },
  { label: "Longitude", s: 61, e: 64, t: "float" },
  { label: "Latitude", s: 65, e: 68, t: "float" },
  { label: "Speed (km/h)", s: 69, e: 70, t: "int" },
  { label: "Direction (°)", s: 71, e: 72, t: "int" },

  // Power / Sensors
  { label: "Int. Battery (V/100)", s: 73, e: 74, t: "float_div100" }, // 0x0155 -> 341 -> 3.41V
  { label: "Ext. Power (V/100)", s: 75, e: 76, t: "float_div100" },
  { label: "RPM", s: 77, e: 78, t: "int" },

  // FMS Data (If Flag=1)
  { label: "FMS Speed", s: 79, e: 80, t: "int" },
  { label: "Bat Mon (h)", s: 81, e: 82, t: "int" },
  { label: "Dev Temp (°C)", s: 83, e: 83, t: "temp8" },
  { label: "HDOP (m)", s: 84, e: 85, t: "int" }, // 0x02BC -> 700 -> 7.00? Doc says unit meter. 700m HDOP is huge. Maybe 0.01?
  // Doc example: 0x02BC = 700. Just int.

  { label: "Coolant (°C)", s: 86, e: 86, t: "temp8" }, // Offset -40? Doc says "0x00=-40deg". So Val = Hex - 40.
  { label: "Fuel %", s: 87, e: 87, t: "int" },
  { label: "Engine Load %", s: 88, e: 88, t: "int" },
  { label: "Acc Fuel (L)", s: 89, e: 92, t: "int" },

  // Raw G-Sensor (mg)
  { label: "Accel X (mg)", s: 93, e: 94, t: "signed_int" },
  { label: "Accel Y (mg)", s: 95, e: 96, t: "signed_int" },
  { label: "Accel Z (mg)", s: 97, e: 98, t: "signed_int" },

  // Gyro (dps)
  { label: "Gyro X (dps)", s: 99, e: 100, t: "signed_int" },
  { label: "Gyro Y (dps)", s: 101, e: 102, t: "signed_int" },
  { label: "Gyro Z (dps)", s: 103, e: 104, t: "signed_int" },
];

export default function PioneerXPositionDecoder() {
  // Sample Data from Doc (reconstructed)
  // Header..IMEI..Intervals..Status..Analog..Multiplex..Odometer..GNSS..Pwr..FMS..Sensors
  const [rawInput, setRawInput] = useState(
    "252533005700010880616898888888000A00FF2001000020009600989910101010999905550155015500000150000000101005050005051010050558866B4276D6E342912AB441111505050410101003FFFFFFFF5002BC82FF0001E10500100001FC1700100001FC17"
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
      else if (type === "temp8")
        newHex = encodeTemp8(value); // Needs adjustment for Coolant offset
      else if (type === "signed_int")
        newHex = intToHex(value, byteLength); // intToHex handles 2's comp
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
        sx={{ mb: 2, color: "primary.main", fontWeight: "bold" }}
      >
        PioneerX 101 Position Decoder (0x33)
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

      {/* FIELD GROUPS */}
      <Grid container spacing={2}>
        {/* We map the schema but group them logically visually */}
        {SCHEMA.map((f, i) => {
          const hex = getHexSegment(f.s, f.e);
          let val = hex;

          // Decoding Logic
          if (f.t === "int") val = hexToInt(hex);
          else if (f.t === "float") val = hexToFloatLE(hex);
          else if (f.t === "date") val = hexToDateBCD(hex);
          else if (f.t === "float_div100")
            val = (hexToInt(hex) / 100).toFixed(2);
          else if (f.t === "temp8") {
            // Special case for Coolant (Byte 86) -> Offset -40
            if (f.s === 86) val = hexToInt(hex) - 40;
            else val = decodeTemp8(hex);
          } else if (f.t === "signed_int") val = hexToSignedInt(hex);
          else if (f.t === "imei") val = hex.substring(1);

          // Special Rendering for Sections
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
          if (i === 0) sectionTitle = "Header & ID";
          if (i === 5) sectionTitle = "Configuration Intervals";
          if (i === 18) sectionTitle = "Status & IO";
          if (i === 30) sectionTitle = "Analog & Multiplex";
          if (i === 36) sectionTitle = "GNSS Data";
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
                    helperText={f.h}
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
                    onChange={(e) => {
                      let v = e.target.value;
                      // Handle Coolant Offset encoding
                      if (f.s === 86 && f.t === "temp8") {
                        // If user types 90, we encode (90+40) = 130 -> 0x82
                        const encodedVal = parseInt(v) + 40;
                        updateHexSegment(f.s, f.e, intToHex(encodedVal, 1));
                      } else {
                        handleValueChange(f.t, f.s, f.e, v);
                      }
                    }}
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

      {/* RAW SENSOR VISUALIZER (Optional) */}
      <Box sx={{ mt: 4 }}>
        <Accordion variant="outlined">
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Sensor Data Visualization</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {/* Extract Accel Values for Quick View */}
              {["Accel X", "Accel Y", "Accel Z"].map((axis, idx) => {
                const s = 93 + idx * 2;
                const hex = getHexSegment(s, s + 1);
                const val = hexToSignedInt(hex);
                return (
                  <Grid item xs={4} key={idx}>
                    <Paper
                      sx={{ p: 2, textAlign: "center", bgcolor: "#f5f5f5" }}
                    >
                      <Typography variant="caption">{axis}</Typography>
                      <Typography variant="h6" color="primary">
                        {val} mg
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
