import React, { useState, useMemo, useEffect } from "react";
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
  Tooltip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RefreshIcon from "@mui/icons-material/Refresh";

/* =====================
   Utilities
===================== */

const cleanHex = (h) => (h || "").replace(/\s/g, "").toUpperCase();

const intToHexLE = (val, bytes) => {
  const view = new DataView(new ArrayBuffer(bytes));
  if (bytes === 1) view.setUint8(0, val);
  else if (bytes === 2) view.setUint16(0, val, true);
  else if (bytes === 4) view.setUint32(0, val, true);

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
===================== */
const FIELD_DEFS = {
  1: { s: 4, t: "u32", n: "Record Index" },
  2: { s: 2, t: "u16", n: "Event ID" },
  3: { s: 4, t: "time", n: "Event Time" },
  4: { s: 1, t: "u8", n: "Device Status" },
  8: { s: 1, t: "u8", n: "GNSS Status (Sats)" },
  9: { s: 4, t: "time", n: "Coords Time" },
  10: { s: 4, t: "latlon", n: "Latitude" },
  11: { s: 4, t: "latlon", n: "Longitude" },
  12: { s: 4, t: "alt", n: "Altitude (dm)" },
  13: { s: 4, t: "float", n: "Speed (km/h)" },
  14: { s: 2, t: "u16", n: "Course" },
  15: { s: 4, t: "float", n: "Mileage (km)" },
  19: { s: 2, t: "mv", n: "Main Power (mV)" },
  20: { s: 2, t: "mv", n: "Backup Power (mV)" },
};

const getFieldDef = (id) => {
  if (FIELD_DEFS[id]) return FIELD_DEFS[id];
  if (id >= 21 && id <= 28) return { s: 2, t: "mv", n: `Analog ${id - 20}` };
  return { s: 0, t: "unk", n: `Unknown Field ${id}` };
};

/* =====================
   Packet Generator (The "Encoder")
===================== */
const generateRealPacket = () => {
  // 1. Current Real Values
  const now = Math.floor(Date.now() / 1000); // Current UNIX time
  const lat = 40.7128; // New York Latitude
  const lon = -74.006; // New York Longitude
  const speed = 65.5; // km/h
  const alt = 150.0; // meters
  const course = 180; // South
  const voltage = 12500; // 12.5V
  const recordIndex = 105;

  // 2. Target Fields to Include (Standard GPS Set)
  // IDs: 1(Idx), 2(Evt), 3(Time), 8(Sats), 10(Lat), 11(Lon), 12(Alt), 13(Spd), 14(Dir), 19(Pwr)
  const activeIDs = [1, 2, 3, 8, 10, 11, 12, 13, 14, 19];

  // 3. Construct FLEX Bitmask (Variable Length Header)
  // We need to set bits corresponding to IDs.
  // Byte 0: IDs 1-7
  // Byte 1: IDs 8-14
  // Byte 2: IDs 15-21
  let headerBytes = [0, 0, 0]; // Enough for up to ID 21

  activeIDs.forEach((id) => {
    const byteIndex = Math.floor((id - 1) / 7);
    const bitIndex = (id - 1) % 7;
    if (headerBytes[byteIndex] !== undefined) {
      headerBytes[byteIndex] |= 1 << bitIndex;
    }
  });

  // Set Extension Bits (Bit 7) if next byte exists and has data
  // Simplified: We know we used 3 bytes (IDs go up to 19).
  headerBytes[0] |= 0x80; // More coming
  headerBytes[1] |= 0x80; // More coming
  // headerBytes[2] MSB is 0 (End)

  const headerHex = headerBytes
    .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
    .join("");

  // 4. Construct Data Payload
  let dataHex = "";

  // ID 1: Index (U32)
  dataHex += intToHexLE(recordIndex, 4);
  // ID 2: Event (U16) - 1 (Periodic)
  dataHex += intToHexLE(1, 2);
  // ID 3: Time (U32)
  dataHex += intToHexLE(now, 4);
  // ID 8: Sats (U8) - 10 sats + Valid(Bit1) + On(Bit0) -> 10<<2 | 3 = 43 -> 0x2B
  dataHex += intToHexLE(0x2b, 1);
  // ID 10: Lat (I32) -> Minutes * 10000
  dataHex += intToHexLE(Math.round(lat * 60 * 10000), 4);
  // ID 11: Lon (I32) -> Minutes * 10000
  dataHex += intToHexLE(Math.round(lon * 60 * 10000), 4);
  // ID 12: Alt (I32) -> Decimeters (m * 10)
  dataHex += intToHexLE(Math.round(alt * 10), 4);
  // ID 13: Speed (Float)
  dataHex += floatToHexLE(speed);
  // ID 14: Course (U16)
  dataHex += intToHexLE(course, 2);
  // ID 19: Power (U16) -> mV
  dataHex += intToHexLE(voltage, 2);

  // 5. Final Wrapper (~A Archive Structure)
  // 7E (Pre) + 41 (Type=A) + 01 (Count) + Header + Data
  return `7E4101${headerHex}${dataHex}`;
};

export default function NavtelecomFlexDecoderReal() {
  // Initialize with REAL values generated at runtime
  const [rawInput, setRawInput] = useState("");

  // Run once on mount
  useEffect(() => {
    setRawInput(generateRealPacket());
  }, []);

  const handleRegenerate = () => {
    setRawInput(generateRealPacket());
  };

  const parsedData = useMemo(() => {
    const clean = cleanHex(rawInput);
    if (!clean.startsWith("7E"))
      return { error: "Packet must start with 7E (~)" };

    let ptr = 2; // Skip 7E
    const type = clean.substring(2, 4); // 41=A
    ptr += 2;

    let recordCount = 1;
    if (type === "41") {
      // ~A Archive
      if (ptr + 2 > clean.length)
        return { error: "Packet too short for Count" };
      recordCount = parseInt(clean.substring(ptr, ptr + 2), 16);
      ptr += 2;
    }

    const records = [];

    // Loop Records
    for (let r = 0; r < recordCount; r++) {
      if (ptr >= clean.length) break;

      // 1. Parse Bitmask (Header)
      const activeFieldIds = [];
      let headerByte = 0;
      let byteIndex = 0;

      do {
        if (ptr + 2 > clean.length) break;
        headerByte = parseInt(clean.substring(ptr, ptr + 2), 16);
        ptr += 2;

        for (let bit = 0; bit < 7; bit++) {
          if ((headerByte >> bit) & 1) {
            const fieldId = byteIndex * 7 + bit + 1;
            activeFieldIds.push(fieldId);
          }
        }
        byteIndex++;
      } while ((headerByte & 0x80) !== 0);

      // 2. Parse Data
      const fields = [];
      for (let id of activeFieldIds) {
        const def = getFieldDef(id);
        if (def.s === 0) continue;

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
          val = new Date(ts * 1000).toLocaleString(); // System Local Time
        } else if (def.t === "latlon") {
          // Signed Int32: Minutes * 10000 -> Deg
          // Formula: Int / 10000 / 60
          const raw = hexToIntLE(valHex, true);
          val = (raw / 10000 / 60).toFixed(6);
        } else if (def.t === "alt") {
          // Signed Int32: Decimeters -> Meters
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
        Navtelecom FLEX Decoder (Real Values)
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
          Update Time
        </Button>
      </Box>

      {parsedData.error ? (
        <Typography color="error">{parsedData.error}</Typography>
      ) : (
        <Box>
          <Typography
            variant="subtitle1"
            gutterBottom
            sx={{ fontWeight: "bold" }}
          >
            Decoded Payload ({parsedData.records.length} Record)
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
                          <strong>Field ID</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Description</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Decoded Value</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Raw Hex (LE)</strong>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rec.fields.map((f, i) => (
                        <TableRow key={i} hover>
                          <TableCell>{f.id}</TableCell>
                          <TableCell>{f.name}</TableCell>
                          <TableCell>
                            <Chip
                              label={f.val}
                              color={
                                f.name.includes("Time") ? "primary" : "default"
                              }
                              variant={
                                f.name.includes("Time") ? "filled" : "outlined"
                              }
                              size="small"
                            />
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
