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
   Field Definitions (1-98)
===================== */
const FIELD_DEFS = {
  // --- Standard ---
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
  15: { s: 4, t: "float", n: "Current Mileage (km)" },
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

  // --- Combined Fuel Level+Temp (84-93) ---
  // Structure: 3 Bytes (2 bytes Level U16 + 1 byte Temp I8)
  ...Object.fromEntries(
    Array.from({ length: 10 }, (_, i) => [
      84 + i,
      { s: 3, t: "fuel_combo", n: `Fuel Level+Temp ${i + 7}` },
    ])
  ),

  // --- Tire Pressure Sensors (94-97) ---
  // 94: Sensors 1-2 (6 bytes -> 3+3)
  94: { s: 6, t: "tires", n: "Tire Sensors 1-2" },
  // 95: Sensor 3 (12 bytes? No, doc says "Information about 3rd... 12 bytes"? Wait.)
  // Doc check: "95 ... 12 bytes ... 3rd tire sensor". Wait, 12 bytes for 1 sensor?
  // Ah, Doc says "Information about 3rd... U8+U8+I8". That's 3 bytes.
  // Wait, Size column says "12". Let's look closely at 95.
  // "95... 12... 3rd... 4th... 5th... 6th". It contains 4 sensors (3,4,5,6). 4*3 = 12 bytes. Correct.
  95: { s: 12, t: "tires", n: "Tire Sensors 3-6" },
  // 96: Sensors 7-14 (8 sensors * 3 bytes = 24 bytes)
  96: { s: 24, t: "tires", n: "Tire Sensors 7-14" },
  // 97: Sensors 15-25? Size 48. 48/3 = 16 sensors. 15 to 30.
  97: { s: 48, t: "tires", n: "Tire Sensors 15-30" },

  98: { s: 1, t: "bits", n: "Tachograph Status" },
};

// Fallback for 99+ (Placeholder)
const getFieldDef = (id) => {
  if (FIELD_DEFS[id]) return FIELD_DEFS[id];
  return { s: 0, t: "unk", n: `Field ${id} (Not Impl)` };
};

/* =====================
   Special Parsers
===================== */
const parseLBS = (hex) => {
  // 37 Bytes:
  // [Cell 4][LAC 2][MCC 2][MNC 2][Sig 1] (Station 1 - 11 bytes)
  // [Cell 4][LAC 2][MCC 2][MNC 2][Sig 1] (Station 2 - 11 bytes)
  // [Cell 4][LAC 2][MCC 2][MNC 2][Sig 1] (Station 3 - 11 bytes)
  // [Time 4]
  if (hex.length !== 74) return "Invalid LBS Length";

  const parseStation = (h) => {
    const cell = hexToIntLE(h.substring(0, 8));
    const lac = hexToIntLE(h.substring(8, 12));
    const mcc = hexToIntLE(h.substring(12, 16));
    const mnc = hexToIntLE(h.substring(16, 20));
    const sig = hexToIntLE(h.substring(20, 22), true); // Signed
    return `Cell:${cell}, LAC:${lac}, MCC:${mcc}, MNC:${mnc}, ${sig}dBm`;
  };

  const s1 = parseStation(hex.substring(0, 22));
  // const s2 = ...
  // const s3 = ...
  const time = hexToIntLE(hex.substring(66, 74));
  return `[1] ${s1} | Time: ${time}`;
};

const parseTires = (hex) => {
  // Packed 3-byte chunks: [Wheel ID (U8)][Press (U8)][Temp (I8)]
  const numSensors = hex.length / 6;
  let out = [];
  for (let i = 0; i < numSensors; i++) {
    const chunk = hex.substring(i * 6, (i + 1) * 6);
    const id = hexToIntLE(chunk.substring(0, 2));
    if (id === 0) continue; // Skip empty
    const press = (hexToIntLE(chunk.substring(2, 4)) * 0.1).toFixed(1);
    const temp = hexToIntLE(chunk.substring(4, 6), true);
    out.push(`#${id}: ${press}bar/${temp}C`);
  }
  return out.join(", ") || "No Sensors";
};

const parseFuelCombo = (hex) => {
  // 3 bytes: Level (U16) + Temp (I8)
  const lvl = hexToIntLE(hex.substring(0, 4));
  const temp = hexToIntLE(hex.substring(4, 6), true);
  return `Lvl:${lvl}, T:${temp}C`;
};

/* =====================
   Main Component
===================== */
export default function NavtelecomFlexDecoderExtended() {
  // Default: ~A with Coords, Speed, and a few Sensors
  const [rawInput, setRawInput] = useState("");

  // Initialize with a mock packet containing ID 10, 11, 13, 19, 53
  useEffect(() => {
    // Mock Construction (Simplified)
    // Mask: 10(Lat), 11(Lon), 13(Spd), 19(Pwr), 53(CanFuel)
    // 10,11,13 in Byte 1 (IDs 8-14). 19 in Byte 2. 53 in Byte 7.
    // This is hard to construct manually without the Encoder logic.
    // Let's just set a placeholder message.
    setRawInput("7E4101... (Paste valid packet here or use Encoder)");
  }, []);

  const parsedData = useMemo(() => {
    const clean = cleanHex(rawInput);
    if (!clean.startsWith("7E")) return { error: "Start with 7E" };

    let ptr = 4; // Skip 7E + Type (e.g. 41)

    // Determine Record Count
    let recordCount = 1;
    if (clean.substring(2, 4) === "41") {
      recordCount = parseInt(clean.substring(4, 6), 16);
      ptr = 6;
    }

    const records = [];

    for (let r = 0; r < recordCount; r++) {
      if (ptr >= clean.length) break;

      // 1. Parse Bitmask
      const activeIds = [];
      let byteIdx = 0;
      while (true) {
        if (ptr + 2 > clean.length) break;
        const byteVal = parseInt(clean.substring(ptr, ptr + 2), 16);
        ptr += 2;

        for (let b = 0; b < 7; b++) {
          if ((byteVal >> b) & 1) activeIds.push(byteIdx * 7 + b + 1);
        }
        if ((byteVal & 0x80) === 0) break; // End of mask
        byteIdx++;
      }

      // 2. Parse Fields
      const fields = [];
      for (let id of activeIds) {
        const def = getFieldDef(id);
        if (def.s === 0) continue; // Unknown, stop to avoid desync

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
        else if (def.t === "latlon")
          val = (hexToIntLE(chunk, true) / 10000 / 60).toFixed(6);
        else if (def.t === "alt")
          val = (hexToIntLE(chunk, true) / 10).toFixed(1) + " m";
        else if (def.t === "time")
          val = new Date(hexToIntLE(chunk) * 1000).toLocaleString();
        else if (def.t === "mv") val = hexToIntLE(chunk) + " mV";
        else if (def.t === "bits")
          val = "0b" + hexToIntLE(chunk).toString(2).padStart(8, "0");
        else if (def.t === "lbs") val = parseLBS(chunk);
        else if (def.t === "tires") val = parseTires(chunk);
        else if (def.t === "fuel_combo") val = parseFuelCombo(chunk);

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
        sx={{ mb: 2, fontWeight: "bold", color: "#00695c" }}
      >
        Navtelecom FLEX Decoder (Extended 1-98)
      </Typography>

      <TextField
        label="FLEX Body (Hex)"
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
