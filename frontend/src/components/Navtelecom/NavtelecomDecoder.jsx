// // ------------------------------->>>>>>>>>>. CHATGPT
// import React, { useState } from "react";
// import {
//   Box,
//   TextField,
//   Typography,
//   Paper,
//   Divider,
//   Grid,
//   Chip,
// } from "@mui/material";

// /* =========================
//    HEX / BYTE UTILITIES
// ========================= */

// const cleanHex = (h) => (h || "").replace(/[^0-9A-Fa-f]/g, "").toUpperCase();

// const hexToBytes = (hex) =>
//   cleanHex(hex)
//     .match(/.{1,2}/g)
//     ?.map((b) => parseInt(b, 16)) || [];

// const bytesToHex = (arr) =>
//   arr
//     .map((b) => b.toString(16).padStart(2, "0"))
//     .join("")
//     .toUpperCase();

// /* =========================
//    CHECKSUMS
// ========================= */

// // XOR checksum (NTCB)
// const xorChecksum = (bytes) => bytes.reduce((a, b) => a ^ b, 0) & 0xff;

// // CRC8 (FLEX) – XOR variant as per Annex B
// const crc8 = (bytes) => xorChecksum(bytes);
// /* =========================
//    FLEX FIELD REGISTRY (v1)
//    Extend up to 255 safely
// ========================= */

// const FLEX_FIELDS_V1 = [
//   { id: 1, name: "Unix Time", size: 4, type: "u32" },
//   { id: 2, name: "Latitude", size: 4, type: "i32", scale: 1e-4 },
//   { id: 3, name: "Longitude", size: 4, type: "i32", scale: 1e-4 },
//   { id: 4, name: "Speed (km/h)", size: 2, type: "u16", scale: 0.1 },
//   { id: 5, name: "Course", size: 2, type: "u16" },
//   { id: 6, name: "Altitude (m)", size: 2, type: "i16" },
// ];
// /* =========================
//    FLEX RECORD DECODER
// ========================= */

// function readIntLE(bytes, signed = false) {
//   let val = 0;
//   bytes.forEach((b, i) => (val |= b << (8 * i)));

//   if (signed) {
//     const bits = bytes.length * 8;
//     const signBit = 1 << (bits - 1);
//     if (val & signBit) val = val - (1 << bits);
//   }
//   return val;
// }

// function decodeFlexRecord(recordBytes, bitmask, fields) {
//   let offset = 0;
//   const decoded = {};

//   fields.forEach((field, index) => {
//     const byteIndex = Math.floor(index / 8);
//     const bitIndex = 7 - (index % 8);

//     if (((bitmask[byteIndex] >> bitIndex) & 1) === 1) {
//       const slice = recordBytes.slice(offset, offset + field.size);
//       offset += field.size;

//       let value =
//         field.type === "i32" || field.type === "i16"
//           ? readIntLE(slice, true)
//           : readIntLE(slice, false);

//       if (field.scale) value *= field.scale;

//       decoded[field.name] = value;
//     }
//   });

//   return { decoded, bytesUsed: offset };
// }
// /* =========================
//    FLEX PACKET DECODER
// ========================= */

// function decodeFlexPacket(bytes, bitmask) {
//   const type = String.fromCharCode(bytes[0], bytes[1]);
//   let offset = 2;

//   let records = [];

//   if (type === "~A") {
//     const count = bytes[offset++];
//     for (let i = 0; i < count; i++) {
//       const res = decodeFlexRecord(
//         bytes.slice(offset),
//         bitmask,
//         FLEX_FIELDS_V1
//       );
//       records.push(res.decoded);
//       offset += res.bytesUsed;
//     }
//   }

//   if (type === "~C") {
//     const res = decodeFlexRecord(bytes.slice(offset), bitmask, FLEX_FIELDS_V1);
//     records.push(res.decoded);
//   }

//   return { type, records };
// }
// /* =========================
//    NTCB HEADER DECODER
// ========================= */

// function decodeNTCB(bytes) {
//   if (bytes.length < 16) return null;

//   const header = bytes.slice(0, 16);
//   const body = bytes.slice(16);

//   const preamble = String.fromCharCode(...header.slice(0, 4));
//   const dataLen = header[12] | (header[13] << 8);
//   const dataCRC = header[14];
//   const headerCRC = header[15];

//   const validHeaderCRC = xorChecksum(header.slice(0, 15)) === headerCRC;
//   const validDataCRC = xorChecksum(body.slice(0, dataLen)) === dataCRC;

//   return {
//     preamble,
//     dataLen,
//     validHeaderCRC,
//     validDataCRC,
//     body,
//   };
// }
// export default function NavtelecomDecoder() {
//   const [rawHex, setRawHex] = useState("");
//   const [bitmaskHex, setBitmaskHex] = useState("FF"); // example mask

//   const bytes = hexToBytes(rawHex);
//   const bitmask = hexToBytes(bitmaskHex);

//   let ntcb = null;
//   let flex = null;

//   if (bytes[0] === 0x40) {
//     ntcb = decodeNTCB(bytes);
//     if (ntcb && ntcb.body[0] === 0x7e) {
//       flex = decodeFlexPacket(ntcb.body, bitmask);
//     }
//   }

//   return (
//     <Box sx={{ p: 2 }}>
//       <Typography variant="h5" fontWeight="bold">
//         Navtelecom NTCB / FLEX Decoder
//       </Typography>

//       <Divider sx={{ my: 2 }} />

//       <TextField
//         label="Raw HEX Packet"
//         multiline
//         fullWidth
//         minRows={3}
//         value={rawHex}
//         onChange={(e) => setRawHex(e.target.value)}
//         InputProps={{ style: { fontFamily: "monospace" } }}
//       />

//       <TextField
//         sx={{ mt: 2 }}
//         label="FLEX Bitmask (HEX)"
//         value={bitmaskHex}
//         onChange={(e) => setBitmaskHex(e.target.value)}
//         InputProps={{ style: { fontFamily: "monospace" } }}
//       />

//       {ntcb && (
//         <Paper sx={{ p: 2, mt: 3 }} variant="outlined">
//           <Typography fontWeight="bold">NTCB Header</Typography>
//           <Typography>Preamble: {ntcb.preamble}</Typography>
//           <Chip
//             label={ntcb.validHeaderCRC ? "Header CRC OK" : "Header CRC FAIL"}
//             color={ntcb.validHeaderCRC ? "success" : "error"}
//             sx={{ mr: 1 }}
//           />
//           <Chip
//             label={ntcb.validDataCRC ? "Data CRC OK" : "Data CRC FAIL"}
//             color={ntcb.validDataCRC ? "success" : "error"}
//           />
//         </Paper>
//       )}

//       {flex && (
//         <Paper sx={{ p: 2, mt: 3 }} variant="outlined">
//           <Typography fontWeight="bold">FLEX Packet {flex.type}</Typography>

//           {flex.records.map((r, i) => (
//             <Box key={i} sx={{ mt: 2 }}>
//               <Typography fontWeight="bold">Record #{i + 1}</Typography>
//               <pre>{JSON.stringify(r, null, 2)}</pre>
//             </Box>
//           ))}
//         </Paper>
//       )}
//     </Box>
//   );
// }

// __________________________________________________>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> GEMINI

import React, { useState, useEffect, useMemo } from "react";
import {
  TextField,
  Typography,
  Grid,
  Box,
  Button,
  InputAdornment,
  Divider,
  Paper,
  Chip,
  Alert,
} from "@mui/material";

/* =====================
   Utilities
===================== */

const cleanHex = (h) => (h || "").replace(/\s/g, "").toUpperCase();

// XOR Checksum (NTCB Standard - Page 15)
const calcXorSum = (hexString) => {
  if (!hexString) return 0;
  const bytes = hexString.match(/.{1,2}/g) || [];
  let xor = 0;
  for (let b of bytes) {
    xor ^= parseInt(b, 16);
  }
  return xor;
};

// CRC8 (FLEX Standard - Annex B - Page 143)
const CRC8_TABLE = [
  0x00, 0x31, 0x62, 0x53, 0xc4, 0xf5, 0xa6, 0x97, 0xb9, 0x88, 0xdb, 0xea, 0x7d,
  0x4c, 0x1f, 0x2e, 0x43, 0x72, 0x21, 0x10, 0x87, 0xb6, 0xe5, 0xd4, 0xfa, 0xcb,
  0x98, 0xa9, 0x3e, 0x0f, 0x5c, 0x6d, 0x86, 0xb7, 0xe4, 0xd5, 0x42, 0x73, 0x20,
  0x11, 0x3f, 0x0e, 0x5d, 0x6c, 0xfb, 0xca, 0x99, 0xa8, 0xc5, 0xf4, 0xa7, 0x96,
  0x01, 0x30, 0x63, 0x52, 0x7c, 0x4d, 0x1e, 0x2f, 0xb8, 0x89, 0xda, 0xeb, 0x3d,
  0x0c, 0x5f, 0x6e, 0xf9, 0xc8, 0x9b, 0xaa, 0x84, 0xb5, 0xe6, 0xd7, 0x40, 0x71,
  0x22, 0x13, 0x7e, 0x4f, 0x1c, 0x2d, 0xba, 0x8b, 0xd8, 0xe9, 0xc7, 0xf6, 0xa5,
  0x94, 0x03, 0x32, 0x61, 0x50, 0xbb, 0x8a, 0xd9, 0xe8, 0x7f, 0x4e, 0x1d, 0x2c,
  0x02, 0x33, 0x60, 0x51, 0xc6, 0xf7, 0xa4, 0x95, 0xf8, 0xc9, 0x9a, 0xab, 0x3c,
  0x0d, 0x5e, 0x6f, 0x41, 0x70, 0x23, 0x12, 0x85, 0xb4, 0xe7, 0xd6, 0x7a, 0x4b,
  0x18, 0x29, 0xbe, 0x8f, 0xdc, 0xed, 0xc3, 0xf2, 0xa1, 0x90, 0x07, 0x36, 0x65,
  0x54, 0x39, 0x08, 0x5b, 0x6a, 0xfd, 0xcc, 0x9f, 0xae, 0x80, 0xb1, 0xe2, 0xd3,
  0x44, 0x75, 0x26, 0x17, 0xfc, 0xcd, 0x9e, 0xaf, 0x38, 0x09, 0x5a, 0x6b, 0x45,
  0x74, 0x27, 0x16, 0x81, 0xb0, 0xe3, 0xd2, 0xbf, 0x8e, 0xdd, 0xec, 0x7b, 0x4a,
  0x19, 0x28, 0x06, 0x37, 0x64, 0x55, 0xc2, 0xf3, 0xa0, 0x91, 0x47, 0x76, 0x25,
  0x14, 0x83, 0xb2, 0xe1, 0xd0, 0xfe, 0xcf, 0x9c, 0xad, 0x3a, 0x0b, 0x58, 0x69,
  0x04, 0x35, 0x66, 0x57, 0xc0, 0xf1, 0xa2, 0x93, 0xbd, 0x8c, 0xdf, 0xee, 0x79,
  0x48, 0x1b, 0x2a, 0xc1, 0xf0, 0xa3, 0x92, 0x05, 0x34, 0x67, 0x56, 0x78, 0x49,
  0x1a, 0x2b, 0xbc, 0x8d, 0xde, 0xef, 0x82, 0xb3, 0xe0, 0xd1, 0x46, 0x77, 0x24,
  0x15, 0x3b, 0x0a, 0x59, 0x68, 0xff, 0xce, 0x9d, 0xac,
];

const calcCrc8 = (hexString) => {
  if (!hexString) return 0;
  const bytes = hexString.match(/.{1,2}/g) || [];
  let crc = 0xff;
  for (let b of bytes) {
    crc = CRC8_TABLE[crc ^ parseInt(b, 16)];
  }
  return crc;
};

// Hex <-> Int (Little Endian for NTCB)
const hexToIntLE = (hex) => {
  if (!hex) return 0;
  const match = hex.match(/.{1,2}/g);
  if (!match) return 0;
  const bytes = new Uint8Array(match.map((byte) => parseInt(byte, 16)));
  const view = new DataView(bytes.buffer);
  if (hex.length === 2) return view.getUint8(0);
  if (hex.length === 4) return view.getUint16(0, true);
  if (hex.length === 8) return view.getUint32(0, true);
  return 0;
};

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

const hexToAscii = (hex) => {
  let str = "";
  for (let i = 0; i < hex.length; i += 2) {
    const code = parseInt(hex.substr(i, 2), 16);
    if (code > 31 && code < 127) str += String.fromCharCode(code);
    else str += ".";
  }
  return str;
};

/* =====================
   Packet Analysis
===================== */
const analyzePacket = (header, body) => {
  let type = "Unknown";
  let details = "";

  const bodyAscii = hexToAscii(body);
  const flexMarker = body.substring(0, 2); // 7E is ~

  // 1. Handshake: *>S
  if (bodyAscii.startsWith("*>S")) {
    type = "Handshake (Device -> Server)";
    details = `IMEI/ID: ${bodyAscii.substring(4)}`;
  }
  // 2. Handshake Response: *<S
  else if (bodyAscii.startsWith("*<S")) {
    type = "Handshake Response (Server -> Device)";
  }
  // 3. FLEX Negotiation: *>FLEX
  else if (bodyAscii.startsWith("*>FLEX")) {
    type = "FLEX Negotiation";
    const ver = parseInt(body.substring(14, 16), 16); // Byte 7 (0-based)
    details = `Proto Ver: ${ver}, Struct Ver: ${parseInt(
      body.substring(16, 18),
      16
    )}`;
  }
  // 4. FLEX Messages (Start with ~ 0x7E)
  else if (flexMarker === "7E") {
    const flexType = body.substring(2, 4);
    if (flexType === "41") type = "FLEX Archive (~A)";
    else if (flexType === "54") type = "FLEX Telemetry (~T)";
    else if (flexType === "43") type = "FLEX Current (~C)";
    else if (flexType === "45") type = "FLEX Ext Archive (~E)";
    else if (flexType === "58") type = "FLEX Ext Telemetry (~X)";
    else if (flexType === "4F") type = "FLEX Command (~O)";
    else if (flexType === "52") type = "FLEX Response (~R)";
    else
      type = `FLEX Message (~${String.fromCharCode(parseInt(flexType, 16))})`;

    // FLEX Validation
    const storedCrc = parseInt(body.slice(-2), 16);
    const calculatedCrc = calcCrc8(body.slice(0, -2));
    details = `CRC8: ${storedCrc === calculatedCrc ? "Valid" : "Invalid"}`;
  }
  // 5. NTCB Commands (*! or *?)
  else if (bodyAscii.startsWith("*!")) {
    type = "NTCB Command";
    details = bodyAscii;
  } else if (bodyAscii.startsWith("*?")) {
    type = "NTCB Query";
    details = bodyAscii;
  }

  return { type, details };
};

/* =====================
   Main Component
===================== */
export default function NavtelecomDecoder() {
  // Default: Handshake packet example (Page 17) with Header
  // @NTC (404E5443) + Rcv(1) + Snd(0) + Len(26) + CSd + CSp
  // Body: *>FLEX...
  const [rawInput, setRawInput] = useState(
    "404E544301000000000000001A001B192A3E464C4558B014147AF2002000000000000000000000000000"
  );

  // 16 Bytes Header
  const headerHex = rawInput.substring(0, 32);
  const bodyHex = rawInput.substring(32);

  // Parse Header
  const preamble = headerHex.substring(0, 8);
  const rcvIdHex = headerHex.substring(8, 16);
  const sndIdHex = headerHex.substring(16, 24);
  const lenHex = headerHex.substring(24, 28);
  const csdHex = headerHex.substring(28, 30);
  const cspHex = headerHex.substring(30, 32);

  // Values
  const rcvId = hexToIntLE(rcvIdHex);
  const sndId = hexToIntLE(sndIdHex);
  const dataLen = hexToIntLE(lenHex);
  const storedCsd = parseInt(csdHex, 16) || 0;
  const storedCsp = parseInt(cspHex, 16) || 0;

  // Validation
  const calcCsp = calcXorSum(headerHex.substring(0, 30)); // First 15 bytes
  const calcCsd = calcXorSum(bodyHex);

  const isCspValid = storedCsp === calcCsp;
  const isCsdValid = storedCsd === calcCsd;
  const isLenValid = dataLen === bodyHex.length / 2;

  // Packet Info
  const packetInfo = useMemo(
    () => analyzePacket(headerHex, bodyHex),
    [headerHex, bodyHex]
  );

  // Handlers
  const updateRaw = (val) => setRawInput(cleanHex(val));

  const updateHeaderField = (field, val) => {
    let newHeader = headerHex;
    if (field === "rcv") {
      const hex = intToHexLE(val, 4);
      newHeader = preamble + hex + sndIdHex + lenHex + csdHex + cspHex;
    } else if (field === "snd") {
      const hex = intToHexLE(val, 4);
      newHeader = preamble + rcvIdHex + hex + lenHex + csdHex + cspHex;
    }

    // Auto-recalc header checksum
    const newCsp = calcXorSum(newHeader.substring(0, 30));
    setRawInput(newHeader.substring(0, 30) + intToHexLE(newCsp, 1) + bodyHex);
  };

  const updateBody = (val) => {
    const newBody = cleanHex(val);
    const newLen = newBody.length / 2;

    // Update Length Field
    const newLenHex = intToHexLE(newLen, 2);

    // Update Data Checksum
    const newCsd = calcXorSum(newBody);
    const newCsdHex = intToHexLE(newCsd, 1);

    // Reconstruct Header with new Len and Csd
    const partialHeader =
      preamble + rcvIdHex + sndIdHex + newLenHex + newCsdHex;

    // Recalc Header Checksum (Csp) as it includes Len and Csd
    const newCsp = calcXorSum(partialHeader);
    const newCspHex = intToHexLE(newCsp, 1);

    setRawInput(partialHeader + newCspHex + newBody);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography
        variant="h5"
        sx={{ mb: 2, fontWeight: "bold", color: "#1976d2" }}
      >
        Navtelecom NTCB Decoder (v6.2)
      </Typography>

      {/* RAW INPUT */}
      <TextField
        label="Full NTCB Packet (Hex)"
        fullWidth
        multiline
        minRows={3}
        value={rawInput}
        onChange={(e) => updateRaw(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{ style: { fontFamily: "monospace" } }}
      />

      {/* PACKET ANALYSIS CHIP */}
      <Box sx={{ mb: 3 }}>
        <Chip
          label={packetInfo.type}
          color={packetInfo.type.includes("Unknown") ? "default" : "primary"}
          sx={{ mr: 1, fontWeight: "bold" }}
        />
        {packetInfo.details && (
          <Chip label={packetInfo.details} variant="outlined" />
        )}
      </Box>

      <Grid container spacing={2}>
        {/* HEADER SECTION (16 Bytes) */}
        <Grid item xs={12} md={5}>
          <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2 }}>
              Transport Header (16 Bytes)
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Preamble (ASCII)"
                  fullWidth
                  size="small"
                  value={hexToAscii(preamble)}
                  disabled
                  helperText={`Hex: ${preamble}`}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Recipient ID (U32)"
                  fullWidth
                  size="small"
                  value={rcvId}
                  onChange={(e) => updateHeaderField("rcv", e.target.value)}
                  type="number"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Sender ID (U32)"
                  fullWidth
                  size="small"
                  value={sndId}
                  onChange={(e) => updateHeaderField("snd", e.target.value)}
                  type="number"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Data Length (U16)"
                  fullWidth
                  size="small"
                  value={dataLen}
                  disabled
                  error={!isLenValid}
                  helperText={
                    !isLenValid ? `Actual: ${bodyHex.length / 2}` : ""
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Header Checksum (CSp)"
                  fullWidth
                  size="small"
                  value={`0x${cspHex}`}
                  disabled
                  error={!isCspValid}
                  helperText={
                    !isCspValid
                      ? `Exp: 0x${intToHexLE(calcCsp, 1)}`
                      : "OK (XOR 0-14)"
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Data Checksum (CSd)"
                  fullWidth
                  size="small"
                  value={`0x${csdHex}`}
                  disabled
                  error={!isCsdValid}
                  helperText={
                    !isCsdValid
                      ? `Exp: 0x${intToHexLE(calcCsd, 1)}`
                      : "OK (XOR Body)"
                  }
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* BODY SECTION (Variable) */}
        <Grid item xs={12} md={7}>
          <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2 }}>
              Application Data (Body)
            </Typography>

            <TextField
              label="Body Hex"
              fullWidth
              multiline
              minRows={4}
              value={bodyHex}
              onChange={(e) => updateBody(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{ style: { fontFamily: "monospace" } }}
            />

            <Divider sx={{ mb: 2 }} />

            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              ASCII Preview:
            </Typography>
            <Paper
              sx={{
                p: 1,
                fontFamily: "monospace",
                fontSize: "0.85rem",
                wordBreak: "break-all",
              }}
            >
              {hexToAscii(bodyHex) || "<empty>"}
            </Paper>

            {packetInfo.type.includes("FLEX") && (
              <Alert severity="info" sx={{ mt: 2, fontSize: "0.85rem" }}>
                FLEX packets typically require the negotiated bitmask (from a
                previous handshake) to fully decode the variable data fields.
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
