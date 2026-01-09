import React, { useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Box,
  Grid,
  TextField,
  Typography,
  Paper,
  Button,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip,
  MenuItem,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

/* =======================
   Utility helpers
======================= */

const toHex = (num, bytes = 1) =>
  Number(num)
    .toString(16)
    .padStart(bytes * 2, "0")
    .toUpperCase();

/**
 * IMEI → BCD swapped bytes (on-wire format)
 * Example: 12345678 → 21 43 65 87
 */
const imeiToBcd = (imei) => {
  const padded = imei.padEnd(16, "F");
  const bytes = [];
  for (let i = 0; i < padded.length; i += 2) {
    bytes.push(padded[i + 1] + padded[i]);
  }
  return bytes;
};

/**
 * Float → IEEE754 HEX (4 bytes, big-endian)
 * Required for Latitude / Longitude
 */
const floatToHexBytes = (value) => {
  const buffer = new ArrayBuffer(4);
  new DataView(buffer).setFloat32(0, value, false);
  return [...new Uint8Array(buffer)].map((b) =>
    b.toString(16).padStart(2, "0").toUpperCase()
  );
};

/* =======================
   BLE DATA CODES
======================= */

const BLE_DATA_CODES = [
  { label: "Tire Pressure", value: "0001" },
  { label: "SOS", value: "0002" },
  { label: "Driver Identification", value: "0003" },
  { label: "Temperature & Humidity", value: "0004" },
  { label: "Door Sensor", value: "0005" },
  { label: "Relay", value: "0006" },
  { label: "Fuel Level Sensor", value: "0007" },
  { label: "FH Analog Sensor", value: "000A" },
  { label: "MiTag Temp/Humidity", value: "000B" },
  { label: "BLE Pass-through", value: "000C" },
  { label: "2397 Sensor", value: "000D" },
  { label: "iBeacon", value: "000E" },
  { label: "Eddystone UID", value: "000F" },
  { label: "Eddystone TLM", value: "0011" },
];

/* =======================
   Component
======================= */

export default function PioneerBlePacketGenerator() {
  const now = dayjs();

  const [serial, setSerial] = useState(1);
  const [imei, setImei] = useState("1234567891011112");
  const [accOn, setAccOn] = useState(true);
  const [bleCode, setBleCode] = useState("0001");
  const [enableSosPayload, setEnableSosPayload] = useState(false);

  const [date, setDate] = useState({
    yy: now.year() % 100,
    mm: now.month() + 1,
    dd: now.date(),
    hh: now.hour(),
    min: now.minute(),
    ss: now.second(),
  });

  /* =======================
   SOS + GNSS PAYLOAD STATE
======================= */

  const [sos, setSos] = useState({
    tagId: 0x01b3ec00, // BLE Tag ID (4 bytes)
    battery: 0x11, // Battery voltage
    sosType: 0xc0, // SOS data type
    status: 0x31, // BLE + GNSS status
    altitude: 50, // meters
    longitude: 234.12, // float
    latitude: 61.42, // float
    speed: 45, // km/h
    direction: 180, // degrees
  });

  /* =======================
     RAW HEX PACKET (REAL)
  ======================= */

  const rawPacketBytes = useMemo(() => {
    const bytes = [];

    // Header
    bytes.push("25", "25");

    // Message Type
    bytes.push("10");

    // Length placeholder
    bytes.push("00", "00");

    // Serial number (2 bytes)
    bytes.push(toHex((serial >> 8) & 0xff));
    bytes.push(toHex(serial & 0xff));

    // IMEI (BCD swapped)
    bytes.push(...imeiToBcd(imei));

    // Date & Time
    bytes.push(
      toHex(date.yy),
      toHex(date.mm),
      toHex(date.dd),
      toHex(date.hh),
      toHex(date.min),
      toHex(date.ss)
    );

    // ACC
    bytes.push(accOn ? "01" : "00");

    // BLE Data Code (2 bytes)
    bytes.push(bleCode.slice(0, 2), bleCode.slice(2, 4));

    /* =======================
   SOS + GNSS PAYLOAD
   Only for BLE code 0002
======================= */

    if (bleCode === "0002" && enableSosPayload) {
      // BLE Tag ID (4 bytes)
      bytes.push(
        toHex((sos.tagId >> 24) & 0xff),
        toHex((sos.tagId >> 16) & 0xff),
        toHex((sos.tagId >> 8) & 0xff),
        toHex(sos.tagId & 0xff)
      );

      // Battery Voltage
      bytes.push(toHex(sos.battery));

      // SOS Data Type
      bytes.push(toHex(sos.sosType));

      // BLE + GNSS Status
      bytes.push(toHex(sos.status));

      // Altitude (2 bytes)
      bytes.push(toHex(sos.altitude, 2));

      // Longitude (float, 4 bytes)
      bytes.push(...floatToHexBytes(sos.longitude));

      // Latitude (float, 4 bytes)
      bytes.push(...floatToHexBytes(sos.latitude));

      // Speed (2 bytes, DEC)
      bytes.push(toHex(sos.speed, 2));

      // Direction (2 bytes)
      bytes.push(toHex(sos.direction, 2));
    }

    // Packet length = total bytes - 5
    const packetLength = bytes.length - 5;
    bytes[3] = toHex((packetLength >> 8) & 0xff);
    bytes[4] = toHex(packetLength & 0xff);

    return bytes;
  }, [serial, imei, date, accOn, bleCode, sos]);

  const rawHexString = rawPacketBytes.join(" ");

  /* =======================
     CLEAN STRING (SIM)
  ======================= */

  const cleanString = useMemo(() => {
    const packetLength = rawPacketBytes.length - 5;

    return (
      "2525" +
      "10" +
      toHex(packetLength, 2) +
      toHex(serial, 2) +
      imei +
      toHex(date.yy) +
      toHex(date.mm) +
      toHex(date.dd) +
      toHex(date.hh) +
      toHex(date.min) +
      toHex(date.ss) +
      (accOn ? "01" : "00") +
      bleCode
    );
  }, [rawPacketBytes, serial, imei, date, accOn, bleCode]);

  const copy = (text) => navigator.clipboard.writeText(text);

  /* =======================
     UI
  ======================= */

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Pioneer BLE (0x25 0x25 0x10) Packet Generator
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            label="Serial Number"
            type="number"
            fullWidth
            value={serial}
            onChange={(e) => setSerial(Number(e.target.value))}
          />
        </Grid>

        <Grid item xs={6}>
          <TextField
            label="IMEI (16 digits)"
            fullWidth
            value={imei}
            onChange={(e) =>
              setImei(e.target.value.replace(/\D/g, "").slice(0, 16))
            }
          />
        </Grid>

        {[
          { k: "yy", l: "YY" },
          { k: "mm", l: "MM" },
          { k: "dd", l: "DD" },
          { k: "hh", l: "HH" },
          { k: "min", l: "MIN" },
          { k: "ss", l: "SS" },
        ].map(({ k, l }) => (
          <Grid item xs={2} key={k}>
            <TextField
              label={l}
              type="number"
              fullWidth
              value={date[k]}
              onChange={(e) =>
                setDate({ ...date, [k]: Number(e.target.value) })
              }
            />
          </Grid>
        ))}

        <Grid item xs={6}>
          <TextField
            select
            label="BLE Data Code"
            fullWidth
            value={bleCode}
            onChange={(e) => setBleCode(e.target.value)}
          >
            {BLE_DATA_CODES.map((c) => (
              <MenuItem key={c.value} value={c.value}>
                {c.label} (0x{c.value})
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        {bleCode === "0002" && (
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={enableSosPayload}
                  onChange={(e) => setEnableSosPayload(e.target.checked)}
                />
              }
              label="Include SOS + GNSS Payload"
            />
          </Grid>
        )}

        {bleCode === "0002" && enableSosPayload && (
          <>
            <Grid item xs={6}>
              <TextField
                label="SOS Latitude"
                type="number"
                fullWidth
                value={sos.latitude}
                onChange={(e) =>
                  setSos({ ...sos, latitude: Number(e.target.value) })
                }
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="SOS Longitude"
                type="number"
                fullWidth
                value={sos.longitude}
                onChange={(e) =>
                  setSos({ ...sos, longitude: Number(e.target.value) })
                }
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Speed (km/h)"
                type="number"
                fullWidth
                value={sos.speed}
                onChange={(e) =>
                  setSos({ ...sos, speed: Number(e.target.value) })
                }
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Direction (°)"
                type="number"
                fullWidth
                value={sos.direction}
                onChange={(e) =>
                  setSos({ ...sos, direction: Number(e.target.value) })
                }
              />
            </Grid>
          </>
        )}

        <Grid item xs={6}>
          <FormControlLabel
            control={
              <Switch
                checked={accOn}
                onChange={(e) => setAccOn(e.target.checked)}
              />
            }
            label={`ACC ${accOn ? "ON" : "OFF"}`}
          />
        </Grid>

        <Grid item xs={12}>
          <Button
            variant="contained"
            onClick={() => setSerial((s) => (s % 65535) + 1)}
          >
            Generate Next Packet
          </Button>
        </Grid>

        {/* RAW HEX */}
        <Grid item xs={12}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="subtitle2">RAW HEX (DEVICE FORMAT)</Typography>
            <IconButton size="small" onClick={() => copy(rawHexString)}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Box>
          <Box
            sx={{
              fontFamily: "monospace",
              bgcolor: "#111",
              color: "#0f0",
              p: 2,
            }}
          >
            {rawHexString}
          </Box>
        </Grid>

        {/* CLEAN STRING */}
        <Grid item xs={12}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="subtitle2">
              CLEAN STRING (SIMULATOR)
            </Typography>
            <IconButton size="small" onClick={() => copy(cleanString)}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Box>
          <Box
            sx={{
              fontFamily: "monospace",
              bgcolor: "#222",
              color: "#4dd0e1",
              p: 2,
            }}
          >
            {cleanString}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}
