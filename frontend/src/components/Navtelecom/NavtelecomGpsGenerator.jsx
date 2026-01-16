import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  TextField,
  Paper,
  Grid,
  Divider,
  Button,
  Chip,
} from "@mui/material";

/* =========================
   LOW LEVEL BYTE UTILS
========================= */

const writeLE = (value, bytes, signed = false) => {
  const buf = new ArrayBuffer(bytes);
  const view = new DataView(buf);

  if (bytes === 1) signed ? view.setInt8(0, value) : view.setUint8(0, value);
  if (bytes === 2)
    signed ? view.setInt16(0, value, true) : view.setUint16(0, value, true);
  if (bytes === 4)
    signed ? view.setInt32(0, value, true) : view.setUint32(0, value, true);

  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
};

/* =========================
   CRC8 (Navtelecom)
========================= */

const CRC8_TABLE = [
  0x00, 0x31, 0x62, 0x53, 0xc4, 0xf5, 0xa6, 0x97, 0xb9, 0x88, 0xdb, 0xea, 0x7d,
  0x4c, 0x1f, 0x2e, 0x43, 0x72, 0x21, 0x10, 0x87, 0xb6, 0xe5, 0xd4, 0xfa, 0xcb,
  0x98, 0xa9, 0x3e, 0x0f, 0x5c, 0x6d, 0x86, 0xb7, 0xe4, 0xd5, 0x42, 0x73, 0x20,
  0x11, 0x3f, 0x0e, 0x5d, 0x6c, 0xfb, 0xca, 0x99, 0xa8, 0xc5, 0xf4, 0xa7, 0x96,
  0x01, 0x30, 0x63, 0x52, 0x7c, 0x4d, 0x1e, 0x2f,
];

const crc8 = (hex) => {
  const bytes = hex.match(/.{2}/g).map((b) => parseInt(b, 16));
  let crc = 0xff;
  for (const b of bytes) crc = CRC8_TABLE[crc ^ b];
  return crc.toString(16).padStart(2, "0").toUpperCase();
};

/* =========================
   ANNEX-A FIELD DEFINITIONS
========================= */

const FIELDS = {
  1: (v) => writeLE(v, 4), // record no
  3: (v) => writeLE(v, 4), // unix time
  8: () => writeLE(0b00000010, 1), // GPS valid, 0 sats
  10: (v) => writeLE(Math.round(v * 60 * 10000), 4, true),
  11: (v) => writeLE(Math.round(v * 60 * 10000), 4, true),
  13: (v) => {
    const f = new DataView(new ArrayBuffer(4));
    f.setFloat32(0, v, true);
    return [...new Uint8Array(f.buffer)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
  },
  14: (v) => writeLE(v, 2),
};

/* =========================
   MAIN COMPONENT
========================= */

export default function NavtelecomGpsGenerator() {
  const [lat, setLat] = useState(12.9716);
  const [lon, setLon] = useState(77.5946);
  const [speed, setSpeed] = useState(40);
  const [course, setCourse] = useState(180);
  const [time, setTime] = useState(Math.floor(Date.now() / 1000));
  const [recordNo, setRecordNo] = useState(1);

  /* =========================
     BUILD BITMASK
  ========================= */

  const bitmaskHex = useMemo(() => {
    const usedFields = [1, 3, 8, 10, 11, 13, 14];
    const bits = new Uint8Array(
      Math.ceil(usedFields[usedFields.length - 1] / 8)
    );

    usedFields.forEach((id) => {
      const i = id - 1;
      bits[Math.floor(i / 8)] |= 1 << (7 - (i % 8));
    });

    return [...bits]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
  }, []);

  /* =========================
     BUILD RECORD
  ========================= */

  const recordHex = useMemo(() => {
    let hex = "";
    for (let id = 1; id <= 255; id++) {
      if (FIELDS[id]) {
        if (id === 1) hex += FIELDS[id](recordNo);
        if (id === 3) hex += FIELDS[id](time);
        if (id === 8) hex += FIELDS[id]();
        if (id === 10) hex += FIELDS[id](lat);
        if (id === 11) hex += FIELDS[id](lon);
        if (id === 13) hex += FIELDS[id](speed);
        if (id === 14) hex += FIELDS[id](course);
      }
    }
    return hex;
  }, [lat, lon, speed, course, time, recordNo]);

  /* =========================
     FINAL ~A PACKET
  ========================= */

  const packet = useMemo(() => {
    const base = "7E41" + "01" + recordHex;
    return base + crc8(base);
  }, [recordHex]);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" fontWeight="bold">
        Navtelecom FLEX GPS Generator (Netty-Safe)
      </Typography>

      <Divider sx={{ my: 2 }} />

      <Paper sx={{ p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              label="Latitude"
              value={lat}
              onChange={(e) => setLat(+e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Longitude"
              value={lon}
              onChange={(e) => setLon(+e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Speed (km/h)"
              value={speed}
              onChange={(e) => setSpeed(+e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Course"
              value={course}
              onChange={(e) => setCourse(+e.target.value)}
              fullWidth
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography fontWeight="bold">Generated ~A HEX</Typography>
        <TextField
          fullWidth
          multiline
          value={packet}
          InputProps={{ readOnly: true, style: { fontFamily: "monospace" } }}
          sx={{ mt: 1 }}
        />
      </Paper>

      <Button
        sx={{ mt: 2 }}
        variant="contained"
        onClick={() => navigator.clipboard.writeText(packet)}
      >
        Copy HEX
      </Button>
    </Box>
  );
}
