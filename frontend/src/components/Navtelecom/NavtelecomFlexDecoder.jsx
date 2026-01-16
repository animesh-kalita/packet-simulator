import React, { useState, useMemo } from "react";
import {
  TextField,
  Typography,
  Grid,
  Box,
  Button,
  Paper,
  Divider,
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

/* =====================
   Utilities
===================== */

const cleanHex = (h) => (h || "").replace(/\s/g, "").toUpperCase();

const hexToIntLE = (hex, signed = false) => {
  if (!hex) return 0;
  // Convert hex string to byte array
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
    if (bytes.length === 8) return Number(view.getBigUint64(0, true)); // Precision loss > 2^53
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
   Field Definitions (Annex A)
   ID: 1-based index in the bitmask
   Size: Bytes
   Type: Decoder function key
   Name: Description
===================== */
const FIELD_DEFS = {
  1: { s: 4, t: "u32", n: "Record Index" },
  2: { s: 2, t: "u16", n: "Event ID" },
  3: { s: 4, t: "time", n: "Event Time" },
  4: { s: 1, t: "u8", n: "Device Status" },
  5: { s: 1, t: "u8", n: "Sim/GSM Status" },
  6: { s: 1, t: "u8", n: "Jamming/Bat Status" },
  7: { s: 1, t: "u8", n: "GSM Level" },
  8: { s: 1, t: "u8", n: "GNSS Status (Sats)" },
  9: { s: 4, t: "time", n: "Coords Time" },
  10: { s: 4, t: "latlon", n: "Latitude" },
  11: { s: 4, t: "latlon", n: "Longitude" },
  12: { s: 4, t: "alt", n: "Altitude (m)" },
  13: { s: 4, t: "float", n: "Speed (km/h)" }, // Wait, Doc says Float? Previous analysis said U16?
  // Re-checking Doc provided: "13 Speed 4 Float". OK, Netty code was RIGHT about Float, but maybe wrong endian/offset?
  // Let's stick to Doc: Float.
  14: { s: 2, t: "u16", n: "Course" },
  15: { s: 4, t: "float", n: "Mileage (km)" },
  19: { s: 2, t: "mv", n: "Main Power (mV)" },
  20: { s: 2, t: "mv", n: "Backup Power (mV)" },
  21: { s: 2, t: "mv", n: "Analog 1 (mV)" },
  22: { s: 2, t: "mv", n: "Analog 2 (mV)" },
  // ... (Add ranges as needed)
  29: { s: 1, t: "u8", n: "Inputs 1-8" },
  30: { s: 1, t: "u8", n: "Inputs 9-16" },
  31: { s: 1, t: "u8", n: "Outputs 1-8" },
  33: { s: 4, t: "u32", n: "Pulse Cnt 1" },
  // ...
  53: { s: 2, t: "u16", n: "Fuel Level (CAN)" },
  54: { s: 4, t: "float", n: "Total Fuel (CAN)" },
  55: { s: 2, t: "u16", n: "RPM" },
  56: { s: 1, t: "i8", n: "Coolant Temp" },
  57: { s: 4, t: "float", n: "Total Mileage (CAN)" },
  69: { s: 1, t: "u8", n: "Speed (CAN)" },
  // ...
  // User Params
  238: { s: 4, t: "u32", n: "User Param 1 (4B)" },
  // ...
};

// Helper to fill gaps (simplified)
const getFieldDef = (id) => {
  if (FIELD_DEFS[id]) return FIELD_DEFS[id];
  // Defaults based on ranges in Doc
  if (id >= 21 && id <= 28) return { s: 2, t: "mv", n: `Analog ${id - 20}` };
  if (id >= 238 && id <= 252)
    return { s: 4, t: "u32", n: `User Param ${id - 237} (4B)` };
  if (id >= 223 && id <= 237)
    return { s: 2, t: "u16", n: `User Param ${id - 222} (2B)` };
  if (id >= 207 && id <= 222)
    return { s: 1, t: "u8", n: `User Param ${id - 206} (1B)` };
  return { s: 0, t: "unk", n: `Unknown Field ${id}` }; // Skip unknown
};

export default function NavtelecomFlexDecoder() {
  // Sample: FLEX Packet (Header + Body)
  // Header: @NTC... (Skipped usually, we focus on Body)
  // Body: ~A (7E 41) + Count (1 Byte) + [Bitmask + Data]...
  // Let's assume input is the BODY hex starting with 7E
  // Example: ~A, 1 Record.
  // Bitmask: Coords(10,11), Speed(13), Time(3).
  // Bytes: 7E 41 01 (Count) ... [Bitmask] ... [Data]
  // Complex to synthesize manually. Let's provide a parser for the "Data Part" mainly.

  const [rawInput, setRawInput] = useState(
    "7E4101070000000062D53338E40CFC01288B19010000803F"
    // Mock: ~A, 1 Rec. Mask 0x00...07 (Bits 1,2,3 set -> ID 1,2,3 active?)
    // Actually FLEX mask is variable length.
  );

  const parsedData = useMemo(() => {
    const clean = cleanHex(rawInput);
    if (!clean.startsWith("7E"))
      return { error: "Not a FLEX packet (must start with 7E)" };

    let ptr = 2; // Skip 7E
    const type = clean.substring(2, 4); // 41=A, 54=T
    ptr += 2;

    // ~A has "Record Count" byte. ~T does not (usually 1 rec).
    // Let's assume standard ~A structure for list.
    // If ~T (54), count is always 1? Doc: "Structure of FLEX telemetry records" applies to payload.

    // Parsing Logic
    const records = [];
    let recordCount = 1;

    if (type === "41") {
      // ~A Archive
      recordCount = parseInt(clean.substring(ptr, ptr + 2), 16);
      ptr += 2;
    }

    // Loop Records
    for (let r = 0; r < recordCount; r++) {
      if (ptr >= clean.length) break;

      // 1. Parse Bitmask (Variable Length)
      // The header (bitmask) is a sequence of bytes.
      // Bit 7 of each byte indicates if there is a next byte.
      // Bits 0-6 are the actual mask bits.
      // This maps to Field IDs.

      const activeFieldIds = [];
      let headerByte = 0;
      let byteIndex = 0;

      do {
        if (ptr + 2 > clean.length) break;
        headerByte = parseInt(clean.substring(ptr, ptr + 2), 16);
        ptr += 2;

        // Process 7 bits (0..6)
        for (let bit = 0; bit < 7; bit++) {
          if ((headerByte >> bit) & 1) {
            // Field ID = (byteIndex * 7) + bit + 1
            const fieldId = byteIndex * 7 + bit + 1;
            activeFieldIds.push(fieldId);
          }
        }
        byteIndex++;
      } while ((headerByte & 0x80) !== 0); // Continue if MSB is 1

      // 2. Parse Data Fields based on IDs
      const fields = [];
      for (let id of activeFieldIds) {
        const def = getFieldDef(id);
        if (def.s === 0) continue; // Skip unknown size? Risk of desync.

        if (ptr + def.s * 2 > clean.length) {
          fields.push({ name: def.n, val: "EOF Error", hex: "" });
          break;
        }

        const valHex = clean.substring(ptr, ptr + def.s * 2);
        ptr += def.s * 2;

        let val = valHex;
        if (def.t === "u8") val = hexToIntLE(valHex);
        else if (def.t === "u16") val = hexToIntLE(valHex);
        else if (def.t === "u32") val = hexToIntLE(valHex);
        else if (def.t === "i32") val = hexToIntLE(valHex, true);
        else if (def.t === "float") val = hexToFloatLE(valHex).toFixed(2);
        else if (def.t === "time") {
          const ts = hexToIntLE(valHex);
          val = new Date(ts * 1000)
            .toISOString()
            .replace("T", " ")
            .substring(0, 19);
        } else if (def.t === "latlon") {
          // Signed Int32: Minutes * 10000
          const raw = hexToIntLE(valHex, true);
          val = (raw / 10000 / 60).toFixed(6); // Deg
        } else if (def.t === "alt") {
          // Signed Int32: Decimeters (0.1m)
          val = (hexToIntLE(valHex, true) / 10).toFixed(1);
        } else if (def.t === "mv") val = hexToIntLE(valHex) + " mV";

        fields.push({ id, name: def.n, val, hex: valHex });
      }
      records.push({ index: r + 1, fields });
    }

    return { records };
  }, [rawInput]);

  return (
    <Box sx={{ p: 2 }}>
      <Typography
        variant="h5"
        sx={{ mb: 2, fontWeight: "bold", color: "#673ab7" }}
      >
        Navtelecom FLEX Decoder
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Parses the <b>Variable Length Bitmask</b> of FLEX packets (~A, ~T).
        Paste the body hex starting with 7E.
      </Typography>

      <TextField
        label="FLEX Packet Body (Hex)"
        fullWidth
        multiline
        minRows={2}
        value={rawInput}
        onChange={(e) =>
          setRawInput(e.target.value.replace(/[^0-9a-fA-F]/g, ""))
        }
        sx={{ mb: 2 }}
        InputProps={{ style: { fontFamily: "monospace" } }}
      />

      {parsedData.error ? (
        <Typography color="error">{parsedData.error}</Typography>
      ) : (
        <Box>
          <Typography
            variant="subtitle1"
            gutterBottom
            sx={{ fontWeight: "bold" }}
          >
            Decoded Records ({parsedData.records.length})
          </Typography>

          {parsedData.records.map((rec) => (
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
                      <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                        <TableCell>
                          <strong>ID</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Field Name</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Value</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Raw Hex</strong>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rec.fields.map((f, i) => (
                        <TableRow key={i} hover>
                          <TableCell>{f.id}</TableCell>
                          <TableCell>{f.name}</TableCell>
                          <TableCell
                            sx={{ color: "primary.main", fontWeight: "bold" }}
                          >
                            {f.val}
                          </TableCell>
                          <TableCell
                            sx={{
                              fontFamily: "monospace",
                              color: "text.secondary",
                            }}
                          >
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
      )}
    </Box>
  );
}
