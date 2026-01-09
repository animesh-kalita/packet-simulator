import React, { useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Paper,
  Grid,
  TextField,
  Typography,
  Button,
  Box,
  IconButton,
} from "@mui/material";
import { CopyAll } from "@mui/icons-material";

export default function PioneerNettyExactGenerator() {
  const now = dayjs();

  const [imei, setImei] = useState("867284063992640");
  const [serial, setSerial] = useState(1);

  const [pos, setPos] = useState({
    lat: 28.676172,
    lng: 77.142273,
    altitude: 0,
    speed: 0,
    course: 0,
  });

  const rawBytes = useMemo(() => {
    const b = [];

    // HEADER
    b.push("25", "25", "13");

    // LENGTH placeholder
    b.push("00", "00");

    // SERIAL
    b.push(...uint16ToHexLE(serial));

    // IMEI
    b.push(...imeiToBcd(imei));

    // ACC ON / OFF intervals (Netty expects these!)
    b.push("00", "0A"); // acc on
    b.push("00", "1E"); // acc off
    b.push("1E"); // angle
    b.push("00", "00"); // distance comp
    b.push("05"); // speed comp

    // GSM SIGNAL
    b.push("3E");

    // STATUS BYTE
    // bit6 = GNSS valid, bit7 = live
    b.push("40");

    // gsensor, flags, heartbeat, relay
    b.push("00", "00", "00", "00");

    // drag alarm
    b.push("00", "00");

    // IO (2 bytes)
    b.push("00", "00");

    // ADC1, ADC2
    b.push("FF", "FF", "FF", "FF");

    // Distance
    b.push("00", "00", "00", "00");

    // Alarm byte
    b.push("00");

    // Reserved
    b.push("00");

    // Odometer
    b.push("00", "00", "00", "00");

    // Battery
    b.push("00", "00");

    // DATE
    b.push(
      toHex(now.year() % 100),
      toHex(now.month() + 1),
      toHex(now.date()),
      toHex(now.hour()),
      toHex(now.minute()),
      toHex(now.second())
    );

    // ALTITUDE (float LE)
    b.push(...floatToHexLE(pos.altitude));

    // LONGITUDE (float LE)
    b.push(...floatToHexLE(pos.lng));

    // LATITUDE (float LE)
    b.push(...floatToHexLE(pos.lat));

    // SPEED × 0.1 (uint32 LE)
    b.push(...uint32ToHexLE(Math.round(pos.speed * 10)));

    // COURSE (uint16 LE)
    b.push(...uint16ToHexLE(pos.course));

    // CHECKSUM placeholder
    b.push("00", "00");

    // TERMINATOR
    b.push("FF", "FF", "FF");

    // FIX LENGTH (Netty-style)
    const logicalLen = b.length - 5;
    b[3] = toHex((logicalLen >> 8) & 0xff);
    b[4] = toHex(logicalLen & 0xff);

    return b;
  }, [imei, serial, pos, now]);

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6">Pioneer Netty-Exact Packet Generator</Typography>

      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            label="IMEI"
            fullWidth
            value={imei}
            onChange={(e) => setImei(e.target.value)}
          />
        </Grid>

        <Grid item xs={6}>
          <TextField
            label="Serial"
            type="number"
            fullWidth
            value={serial}
            onChange={(e) => setSerial(+e.target.value)}
          />
        </Grid>

        {["lat", "lng", "altitude", "speed", "course"].map((k) => (
          <Grid item xs={6} key={k}>
            <TextField
              label={k.toUpperCase()}
              type="number"
              fullWidth
              value={pos[k]}
              onChange={(e) => setPos({ ...pos, [k]: Number(e.target.value) })}
            />
          </Grid>
        ))}
      </Grid>

      <Box
        sx={{
          mt: 2,
          p: 2,
          bgcolor: "#111",
          color: "#0f0",
          fontFamily: "monospace",
        }}
      >
        {rawBytes.join(" ")}
      </Box>

      <Button
        sx={{ mt: 2 }}
        variant="contained"
        onClick={() => setSerial((s) => s + 1)}
      >
        Generate Next Packet
      </Button>

      {/* NETTY STRING */}
      <Grid item xs={12}>
        <Box display="flex" alignItems="center">
          <Typography variant="subtitle2">
            NETTY STRING (lowercase, no spaces)
          </Typography>
          <IconButton onClick={() => copy(toNettyString(rawBytes))}>
            <CopyAll fontSize="small" />
          </IconButton>
        </Box>

        <Box
          sx={{
            fontFamily: "monospace",
            bgcolor: "#000",
            color: "#ffa726",
            p: 2,
            wordBreak: "break-all",
          }}
        >
          {toNettyString(rawBytes)}
        </Box>
      </Grid>
    </Paper>
  );
}

const toHex = (num, bytes = 1) =>
  (num >>> 0)
    .toString(16)
    .padStart(bytes * 2, "0")
    .toUpperCase();

const imeiToBcd = (imei) => {
  const padded = imei.padEnd(16, "F");
  const out = [];
  for (let i = 0; i < padded.length; i += 2) {
    out.push(padded[i + 1] + padded[i]);
  }
  return out;
};

const floatToHexLE = (value) => {
  const buf = new ArrayBuffer(4);
  new DataView(buf).setFloat32(0, value, true);
  return [...new Uint8Array(buf)].map((b) =>
    b.toString(16).padStart(2, "0").toUpperCase()
  );
};

const uint32ToHexLE = (value) => {
  const buf = new ArrayBuffer(4);
  new DataView(buf).setUint32(0, value, true);
  return [...new Uint8Array(buf)].map((b) =>
    b.toString(16).padStart(2, "0").toUpperCase()
  );
};

const uint16ToHexLE = (value) => {
  const buf = new ArrayBuffer(2);
  new DataView(buf).setUint16(0, value, true);
  return [...new Uint8Array(buf)].map((b) =>
    b.toString(16).padStart(2, "0").toUpperCase()
  );
};

const toNettyString = (bytes) => bytes.join("").toLowerCase();
