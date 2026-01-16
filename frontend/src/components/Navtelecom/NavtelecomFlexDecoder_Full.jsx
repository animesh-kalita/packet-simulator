import React, { useState, useMemo, useEffect } from "react";
import {
  TextField,
  Typography,
  Grid,
  Box,
  Button,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RefreshIcon from "@mui/icons-material/Refresh";

/* =====================
   Utilities (Little Endian)
===================== */

const cleanHex = (h) => (h || "").replace(/\s/g, "").toUpperCase();

const intToHexLE = (val, bytes) => {
  let num = Number(val);
  if (isNaN(num)) num = 0;
  // Handle signed
  if (num < 0) {
    const max = Math.pow(2, bytes * 8);
    num = max + num;
  }
  const view = new DataView(new ArrayBuffer(bytes));
  if (bytes === 1) view.setUint8(0, num);
  else if (bytes === 2) view.setUint16(0, num, true);
  else if (bytes === 4) view.setUint32(0, num, true);
  else if (bytes === 8) view.setBigUint64(0, BigInt(num), true);

  let hex = "";
  for (let i = 0; i < bytes; i++) {
    hex += view.getUint8(i).toString(16).padStart(2, "0");
  }
  return hex.toUpperCase();
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

const hexToIntLE = (hex, signed = false) => {
  if (!hex) return 0;
  const match = hex.match(/.{1,2}/g);
  if (!match) return 0;
  const bytes = new Uint8Array(match.map((byte) => parseInt(byte, 16)));
  const view = new DataView(bytes.buffer);

  try {
    if (bytes.length === 1) return signed ? view.getInt8(0) : view.getUint8(0);
    if (bytes.length === 2)
      return signed ? view.getInt16(0, true) : view.getUint16(0, true);
    if (bytes.length === 4)
      return signed ? view.getInt32(0, true) : view.getUint32(0, true);
    if (bytes.length === 8) return Number(view.getBigInt64(0, true));
  } catch (e) {
    return 0;
  }
  return 0;
};

const hexToFloatLE = (hex) => {
  if (!hex || hex.length !== 8) return 0;
  const bytes = new Uint8Array(
    hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
  );
  const view = new DataView(bytes.buffer);
  return view.getFloat32(0, true);
};

/* =====================
   Field Definitions (1-145)
===================== */
const FIELD_DEFS = {
  // --- Standard (1-20) ---
  1: { s: 4, t: "u32", n: "Record Index" },
  2: { s: 2, t: "u16", n: "Event ID" },
  3: { s: 4, t: "time", n: "Event Time" },
  4: {
    s: 1,
    t: "bits",
    n: "Device Status",
    h: "0:Test, 1:AlmAlert, 2:Alm, 3-4:Mode, 5:Evac, 6:PwrSav, 7:AccCal",
  },
  5: {
    s: 1,
    t: "bits",
    n: "Modules 1",
    h: "0:GSM, 1:USB, 2:Nav, 3:Clock, 4:SIM, 5:Reg, 6:Roam, 7:Eng",
  },
  6: {
    s: 1,
    t: "bits",
    n: "Modules 2",
    h: "0-1:GSM Jam, 2:Ind Int, 3:GNSS Jam, 4:Avg, 5:Acc Err, 6:BT, 7:WiFi",
  },
  7: { s: 1, t: "gsm", n: "GSM Level" },
  8: { s: 1, t: "bits", n: "GNSS Status", h: "0:On, 1:Valid, 2-7:Sats" },
  9: { s: 4, t: "time", n: "Coords Time" },
  10: { s: 4, t: "latlon", n: "Latitude" },
  11: { s: 4, t: "latlon", n: "Longitude" },
  12: { s: 4, t: "alt", n: "Altitude (dm)" },
  13: { s: 4, t: "float", n: "Speed (km/h)" },
  14: { s: 2, t: "u16", n: "Course" },
  15: { s: 4, t: "float", n: "Mileage (km)" },
  16: { s: 4, t: "float", n: "Last Segment (km)" },
  17: { s: 2, t: "u16", n: "Segment Duration (s)" },
  18: { s: 2, t: "u16", n: "Valid Nav Duration (s)" },
  19: { s: 2, t: "mv", n: "Main Power (mV)" },
  20: { s: 2, t: "mv", n: "Backup Power (mV)" },

  // --- Analog Inputs (21-28) ---
  ...Object.fromEntries(
    Array.from({ length: 8 }, (_, i) => [
      21 + i,
      { s: 2, t: "mv", n: `Analog ${i + 1} (mV)` },
    ])
  ),

  // --- IO / Counters ---
  29: { s: 1, t: "bits", n: "Inputs 1-8" },
  30: { s: 1, t: "bits", n: "Inputs 9-16" },
  31: { s: 1, t: "bits", n: "Outputs 1-8" },
  32: { s: 1, t: "bits", n: "Outputs 9-16" },
  33: { s: 4, t: "u32", n: "Pulse Counter 1" },
  34: { s: 4, t: "u32", n: "Pulse Counter 2" },
  35: { s: 2, t: "u16", n: "Freq Fuel Sensor 1" },
  36: { s: 2, t: "u16", n: "Freq Fuel Sensor 2" },
  37: { s: 4, t: "u32", n: "Engine Hours (Gen)" },

  // --- RS-485 Fuel Levels (38-44) ---
  ...Object.fromEntries(
    Array.from({ length: 6 }, (_, i) => [
      38 + i,
      { s: 2, t: "u16", n: `Fuel Level ${i + 1} (RS485)` },
    ])
  ),
  44: { s: 2, t: "u16", n: "Fuel Level (RS232)" },

  // --- Digital Temps (45-52) ---
  ...Object.fromEntries(
    Array.from({ length: 8 }, (_, i) => [
      45 + i,
      { s: 1, t: "i8", n: `Temp Digital ${i + 1}` },
    ])
  ),

  // --- CAN Data (53-69) ---
  53: { s: 2, t: "u16", n: "CAN Fuel Level" },
  54: { s: 4, t: "float", n: "CAN Total Fuel" },
  55: { s: 2, t: "u16", n: "CAN RPM" },
  56: { s: 1, t: "i8", n: "CAN Coolant Temp" },
  57: { s: 4, t: "float", n: "CAN Total Mileage" },
  ...Object.fromEntries(
    Array.from({ length: 5 }, (_, i) => [
      58 + i,
      { s: 2, t: "u16", n: `CAN Axle Load ${i + 1}` },
    ])
  ),
  63: { s: 1, t: "u8", n: "Gas Pedal %" },
  64: { s: 1, t: "u8", n: "Brake Pedal %" },
  65: { s: 1, t: "u8", n: "Engine Load %" },
  66: { s: 2, t: "u16", n: "Diesel Exhaust Fluid" },
  67: { s: 4, t: "u32", n: "CAN Engine Hours" },
  68: { s: 2, t: "i16", n: "Service Distance (5km)" },
  69: { s: 1, t: "u8", n: "CAN Speed" },

  // --- FLEX 2.0 / Advanced ---
  70: { s: 8, t: "hex", n: "Visible Sats (Gl,GPS,Gal...)" },
  71: { s: 2, t: "hex", n: "HDOP/PDOP" },
  72: { s: 1, t: "bits", n: "RTK Status" },
  73: { s: 16, t: "latlon64", n: "Hi-Prec Lat/Lon (64bit)" },
  74: { s: 4, t: "i32", n: "Hi-Prec Alt (mm)" },
  75: { s: 2, t: "u16", n: "Hi-Prec Course (0.01)" },
  76: { s: 4, t: "float", n: "Hi-Prec Speed" },
  77: { s: 37, t: "lbs", n: "LBS Information" },

  // --- Fuel Temps (78-83) ---
  ...Object.fromEntries(
    Array.from({ length: 6 }, (_, i) => [
      78 + i,
      { s: 1, t: "i8", n: `Temp Fuel Sensor ${i + 1}` },
    ])
  ),

  // --- Combined Fuel (84-93) ---
  ...Object.fromEntries(
    Array.from({ length: 10 }, (_, i) => [
      84 + i,
      { s: 3, t: "fuel_combo", n: `Fuel Level+Temp ${i + 7}` },
    ])
  ),

  // --- Tire Sensors (94-97) ---
  94: { s: 6, t: "tires", n: "Tire Sensors 1-2" },
  95: { s: 12, t: "tires", n: "Tire Sensors 3-6" },
  96: { s: 24, t: "tires", n: "Tire Sensors 7-14" },
  97: { s: 48, t: "tires", n: "Tire Sensors 15-30" },

  // --- New Fields (98-145) ---
  98: {
    s: 1,
    t: "bits",
    n: "Tachograph Driver Activity",
    h: "0-1:Act1, 2-3:Slot1, 4-5:Act2, 6-7:Slot2",
  },
  99: {
    s: 1,
    t: "u8",
    n: "Tachograph Mode",
    h: "0:Dis, 1:Driver, 2:Master, 3:Insp, 4:Ent, 5:Crew",
  },
  100: {
    s: 2,
    t: "bits",
    n: "Tacho Flags",
    h: "0:Ign, 1:GND, 2:Ferry, 3:NA, 4:Backlight, 5:Err",
  },
  101: { s: 1, t: "u8", n: "Tacho Speed (km/h)" },
  102: { s: 4, t: "u32", n: "Tacho Odometer (0.1km)" },
  103: { s: 4, t: "time", n: "Tacho Time" },
  104: {
    s: 1,
    t: "u8",
    n: "Driver Status (Display)",
    h: "1:Call, 2:Road, 3:Avail, 7:Work, 8:Break",
  },
  105: { s: 4, t: "u32", n: "Last Msg Index" },
  106: { s: 2, t: "u16", n: "Time Increment (10ms)" },
  107: { s: 6, t: "accel3", n: "Linear Accel (X,Y,Z)" },
  108: { s: 2, t: "u16", n: "Eco: Thresh Duration (10ms)" },
  109: { s: 6, t: "accel3", n: "Eco: Max Accel (Pos,Neg,Lat)" },

  // Passenger Counters (110-117) -> 2 bytes each (2 counters)
  ...Object.fromEntries(
    Array.from({ length: 8 }, (_, i) => [
      110 + i,
      { s: 2, t: "passengers", n: `Pass Cnt ${i * 2 + 1}-${i * 2 + 2}` },
    ])
  ),

  118: {
    s: 1,
    t: "bits",
    n: "Autoinformer Status",
    h: "0:En, 1:Fence, 2:Route, 3:Err, 4:SD, 5:Viol, 6:Auto",
  },
  119: { s: 2, t: "u16", n: "Last Geofence ID" },
  120: { s: 2, t: "u16", n: "Last Stop ID" },
  121: { s: 2, t: "u16", n: "Current Route ID" },
  122: {
    s: 1,
    t: "bits",
    n: "Camera Status",
    h: "0:Avail, 1:Auto, 2:Space, 3:SD Err",
  },
  123: {
    s: 1,
    t: "bits",
    n: "Device 2 Status (FLEX 3.0)",
    h: "0:Tamper, 1-2:Antenna",
  },
  124: { s: 1, t: "bits", n: "Modules 3", h: "0:Iridium, 1:Inertial" },
  125: {
    s: 1,
    t: "bits",
    n: "Comm Status",
    h: "0-2:Type(GSM/WiFi/Iridium), 3-6:Servers",
  },
  126: { s: 1, t: "bits", n: "Inputs 17-24" },

  // Pulse Counters 3-8 (127-132)
  ...Object.fromEntries(
    Array.from({ length: 6 }, (_, i) => [
      127 + i,
      { s: 4, t: "u32", n: `Pulse Counter ${i + 3}` },
    ])
  ),

  // Freq Analog 3-8 (133-138)
  ...Object.fromEntries(
    Array.from({ length: 6 }, (_, i) => [
      133 + i,
      { s: 2, t: "u16", n: `Freq Analog ${i + 3}` },
    ])
  ),

  139: { s: 1, t: "bits", n: "Accel Virtual Sensor" },
  140: { s: 1, t: "u8", n: "Internal Tilt Angle (0.25deg)" },
  141: { s: 2, t: "tilt2", n: "Internal Tilt (Pitch,Roll)" },
  142: { s: 3, t: "tilt3", n: "External Tilt (X,Y,Z)" },
  143: { s: 2, t: "i16", n: "Eco: Max Vert Accel" },
  144: { s: 1, t: "u8", n: "Eco: Max Speed" },
  145: { s: 1, t: "bits", n: "Eco: Speed Thresholds" },
};

// Fallback
const getFieldDef = (id) => {
  if (FIELD_DEFS[id]) return FIELD_DEFS[id];
  return { s: 0, t: "unk", n: `Unknown ${id}` };
};

/* =====================
   Special Parsers
===================== */
const parseLBS = (hex) => `Len:${hex.length / 2} (Complex LBS)`; // Simplified for display
const parseTires = (hex) => `${hex.length / 6} Sensors`;
const parseFuelCombo = (hex) =>
  `Lvl:${hexToIntLE(hex.substring(0, 4))}, T:${hexToIntLE(
    hex.substring(4, 6),
    true
  )}`;
const parseAccel3 = (hex) => {
  const x = hexToIntLE(hex.substring(0, 4), true);
  const y = hexToIntLE(hex.substring(4, 8), true);
  const z = hexToIntLE(hex.substring(8, 12), true);
  return `X:${x}, Y:${y}, Z:${z}`;
};
const parsePassengers = (hex) =>
  `In:${hexToIntLE(hex.substring(0, 2))}, Out:${hexToIntLE(
    hex.substring(2, 4)
  )}`;
const parseTilt2 = (hex) =>
  `P:${hexToIntLE(hex.substring(0, 2), true)}, R:${hexToIntLE(
    hex.substring(2, 4),
    true
  )}`;
const parseTilt3 = (hex) =>
  `X:${hexToIntLE(hex.substring(0, 2))}, Y:${hexToIntLE(
    hex.substring(2, 4)
  )}, Z:${hexToIntLE(hex.substring(4, 6))}`;

/* =====================
   Packet Generator (Encoder)
===================== */
const generateRealPacket = () => {
  // 1. Current Values
  const now = Math.floor(Date.now() / 1000);

  // 2. Select IDs to include (Example: 1-20 Standard, 99-104 Tacho, 107 Accel)
  // We will generate a huge packet with ALL defined fields to test robust parsing
  const activeIDs = Object.keys(FIELD_DEFS)
    .map(Number)
    .sort((a, b) => a - b);

  // 3. Header Construction
  // Max ID is 145. Bytes needed: ceil(145/7) = 21 bytes.
  const headerBytes = new Array(21).fill(0);

  activeIDs.forEach((id) => {
    const byteIndex = Math.floor((id - 1) / 7);
    const bitIndex = (id - 1) % 7;
    if (headerBytes[byteIndex] !== undefined)
      headerBytes[byteIndex] |= 1 << bitIndex;
  });

  // Set extension bits
  for (let i = 0; i < headerBytes.length - 1; i++) headerBytes[i] |= 0x80;

  const headerHex = headerBytes
    .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
    .join("");

  // 4. Data Payload Construction
  let dataHex = "";

  activeIDs.forEach((id) => {
    const def = FIELD_DEFS[id];
    // Generate Default Real-World Data based on type
    if (def.t === "u32" || def.t === "time") dataHex += intToHexLE(now, 4);
    else if (def.t === "u16") dataHex += intToHexLE(1234, 2);
    else if (def.t === "u8" || def.t === "bits" || def.t === "gsm")
      dataHex += intToHexLE(10, 1);
    else if (def.t === "i8") dataHex += intToHexLE(25, 1); // 25C
    else if (def.t === "i16") dataHex += intToHexLE(-500, 2);
    else if (def.t === "i32") dataHex += intToHexLE(50000, 4);
    else if (def.t === "float") dataHex += floatToHexLE(123.45);
    else if (def.t === "latlon") dataHex += intToHexLE(33422389, 4); // 55 deg
    else if (def.t === "alt") dataHex += intToHexLE(1500, 4); // 150m
    else if (def.t === "mv") dataHex += intToHexLE(12500, 2); // 12.5V
    else if (def.t === "hex") dataHex += "00".repeat(def.s);
    // Complex
    else if (def.t === "latlon64") dataHex += "00".repeat(16);
    else if (def.t === "lbs") dataHex += "00".repeat(37);
    else if (def.t === "tires") dataHex += "00".repeat(def.s);
    else if (def.t === "fuel_combo") dataHex += "00".repeat(3);
    else if (def.t === "accel3")
      dataHex +=
        intToHexLE(100, 2) + intToHexLE(-50, 2) + intToHexLE(980, 2); // X,Y,Z
    else if (def.t === "passengers")
      dataHex += intToHexLE(5, 1) + intToHexLE(3, 1);
    else if (def.t === "tilt2") dataHex += intToHexLE(5, 1) + intToHexLE(-2, 1);
    else if (def.t === "tilt3")
      dataHex += intToHexLE(1, 1) + intToHexLE(2, 1) + intToHexLE(3, 1);
    else dataHex += "00".repeat(def.s);
  });

  return `7E4101${headerHex}${dataHex}`;
};

export default function NavtelecomFlexDecoderFull() {
  const [rawInput, setRawInput] = useState("");

  useEffect(() => {
    setRawInput(generateRealPacket());
  }, []);

  const handleRegenerate = () => setRawInput(generateRealPacket());

  const parsedData = useMemo(() => {
    const clean = cleanHex(rawInput);
    if (!clean.startsWith("7E")) return { error: "Start with 7E" };

    let ptr = 4; // Skip 7E + Type
    let recordCount = 1;
    if (clean.substring(2, 4) === "41") {
      recordCount = parseInt(clean.substring(4, 6), 16);
      ptr = 6;
    }

    const records = [];
    for (let r = 0; r < recordCount; r++) {
      if (ptr >= clean.length) break;

      const activeIds = [];
      let byteIdx = 0;
      while (true) {
        if (ptr + 2 > clean.length) break;
        const byteVal = parseInt(clean.substring(ptr, ptr + 2), 16);
        ptr += 2;
        for (let b = 0; b < 7; b++) {
          if ((byteVal >> b) & 1) activeIds.push(byteIdx * 7 + b + 1);
        }
        if ((byteVal & 0x80) === 0) break;
        byteIdx++;
      }

      const fields = [];
      for (let id of activeIds) {
        const def = getFieldDef(id);
        if (def.s === 0) continue;
        if (ptr + def.s * 2 > clean.length) {
          fields.push({ id, n: def.n, val: "EOF", hex: "" });
          break;
        }
        const chunk = clean.substring(ptr, ptr + def.s * 2);
        ptr += def.s * 2;

        let val = chunk;
        if (def.t === "u8") val = hexToIntLE(chunk);
        else if (def.t === "u16") val = hexToIntLE(chunk);
        else if (def.t === "u32") val = hexToIntLE(chunk);
        else if (def.t === "i8") val = hexToIntLE(chunk, true);
        else if (def.t === "i16") val = hexToIntLE(chunk, true);
        else if (def.t === "i32") val = hexToIntLE(chunk, true);
        else if (def.t === "float") val = hexToFloatLE(chunk).toFixed(2);
        else if (def.t === "time")
          val = new Date(hexToIntLE(chunk) * 1000).toLocaleString();
        else if (def.t === "latlon")
          val = (hexToIntLE(chunk, true) / 10000 / 60).toFixed(6);
        else if (def.t === "alt")
          val = (hexToIntLE(chunk, true) / 10).toFixed(1) + " m";
        else if (def.t === "mv") val = hexToIntLE(chunk) + " mV";
        else if (def.t === "bits")
          val = "0b" + hexToIntLE(chunk).toString(2).padStart(8, "0");
        else if (def.t === "lbs") val = parseLBS(chunk);
        else if (def.t === "tires") val = parseTires(chunk);
        else if (def.t === "fuel_combo") val = parseFuelCombo(chunk);
        else if (def.t === "accel3") val = parseAccel3(chunk);
        else if (def.t === "passengers") val = parsePassengers(chunk);
        else if (def.t === "tilt2") val = parseTilt2(chunk);
        else if (def.t === "tilt3") val = parseTilt3(chunk);

        fields.push({ id, n: def.n, val, hex: chunk });
      }
      records.push({ index: r + 1, fields });
    }
    return { records };
  }, [rawInput]);

  return (
    <Box sx={{ p: 2 }}>
      <Typography
        variant="h5"
        sx={{ mb: 2, fontWeight: "bold", color: "#0277bd" }}
      >
        Navtelecom FLEX Decoder (Full 1-145)
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 2, alignItems: "flex-start" }}>
        <TextField
          label="FLEX Packet Body (Hex)"
          fullWidth
          multiline
          minRows={2}
          value={rawInput}
          onChange={(e) =>
            setRawInput(e.target.value.replace(/[^0-9a-fA-F]/g, ""))
          }
          InputProps={{ style: { fontFamily: "monospace" } }}
        />
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={handleRegenerate}
          sx={{ height: 56, minWidth: 160 }}
        >
          Gen. Full Packet
        </Button>
      </Box>

      {parsedData.records &&
        parsedData.records.map((rec) => (
          <Accordion key={rec.index} defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: "bold" }}>
                Record #{rec.index}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#eee" }}>
                      <TableCell>ID</TableCell>
                      <TableCell>Field</TableCell>
                      <TableCell>Value</TableCell>
                      <TableCell>Hex</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rec.fields.map((f, i) => (
                      <TableRow key={i}>
                        <TableCell>{f.id}</TableCell>
                        <TableCell>{f.n}</TableCell>
                        <TableCell
                          sx={{ fontWeight: "bold", color: "primary.main" }}
                        >
                          {f.val}
                        </TableCell>
                        <TableCell sx={{ fontFamily: "monospace" }}>
                          {f.hex}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        ))}
    </Box>
  );
}
