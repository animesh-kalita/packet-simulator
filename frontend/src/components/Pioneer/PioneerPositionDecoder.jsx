const hexToBytes = (hex) =>
  hex
    .replace(/\s+/g, "")
    .match(/.{1,2}/g)
    ?.map((b) => parseInt(b, 16)) || [];

const readUIntBE = (bytes, start, len) =>
  bytes.slice(start, start + len).reduce((a, b) => (a << 8) | b, 0);

const readIntBE = (bytes, start, len) => {
  let v = readUIntBE(bytes, start, len);
  const signBit = 1 << (len * 8 - 1);
  return v & signBit ? v - (1 << (len * 8)) : v;
};

const decodeImei = (bytes) =>
  bytes
    .map((b) => b.toString(16).padStart(2, "0"))
    .map((b) => b[1] + b[0])
    .join("")
    .replace(/f$/i, "");

const decodeLatLng = (bytes, start) => {
  const raw =
    (bytes[start] << 24) |
    (bytes[start + 1] << 16) |
    (bytes[start + 2] << 8) |
    bytes[start + 3];

  // force unsigned
  const unsigned = raw >>> 0;

  return unsigned / 10_000_000;
};

function decodePioneerPosition(hex) {
  const bytes = hexToBytes(hex);
  let i = 0;

  const read = (n) => {
    if (i + n > bytes.length) throw new Error("Unexpected end of packet");
    const v = bytes.slice(i, i + n);
    i += n;
    return v;
  };

  const header = read(2);
  if (header[0] !== 0x25 || header[1] !== 0x25)
    throw new Error("Invalid header");

  const type = read(1)[0];
  if (type !== 0x13) throw new Error("Not a position packet");

  const length = readUIntBE(read(2), 0, 2);
  const serial = readUIntBE(read(2), 0, 2);
  const imei = decodeImei(read(8));

  const date = {
    year: 2000 + read(1)[0],
    month: read(1)[0],
    day: read(1)[0],
    hour: read(1)[0],
    minute: read(1)[0],
    second: read(1)[0],
  };

  const gpsInfo = read(1)[0];
  const gpsFix = !!(gpsInfo & 0x80);
  const satellites = gpsInfo & 0x1f;

  const latBytes = read(4);
  const lngBytes = read(4);

  const lat = decodeLatLng(latBytes, 0);
  const lng = decodeLatLng(lngBytes, 0);

  const speed = readUIntBE(read(2), 0, 2) / 10;
  const course = readUIntBE(read(2), 0, 2);
  const altitude = readIntBE(read(2), 0, 2);

  const satCount = read(1)[0];
  const gsm = read(1)[0];

  const mileage = readUIntBE(read(4), 0, 4);
  const extVolt = readUIntBE(read(2), 0, 2) / 1000;
  const batVolt = readUIntBE(read(2), 0, 2) / 1000;

  const acc = read(1)[0];
  const uploadReason = read(1)[0];
  const io = read(1)[0];

  const checksum = readUIntBE(read(2), 0, 2);

  const extensions = {};

  while (i < bytes.length) {
    // Terminator
    if (bytes[i] === 0xff && bytes[i + 1] === 0xff && bytes[i + 2] === 0xff) {
      i += 3;
      break;
    }

    // Alarm status (3 bytes)
    if (i + 3 <= bytes.length) {
      extensions.alarmStatus = bytes.slice(i, i + 3);
      i += 3;
    }

    // GNSS extension (5 bytes)
    if (i + 5 <= bytes.length) {
      extensions.gnssExt = {
        pdop: readUIntBE(bytes, i, 2) / 10,
        fixType: bytes[i + 2],
        hdop: readUIntBE(bytes, i + 3, 2) / 10,
      };
      i += 5;
    }
  }

  return {
    header: "2525",
    type,
    length,
    serial,
    imei,
    date,
    gpsFix,
    satellites,
    lat,
    lng,
    speed,
    course,
    altitude,
    satCount,
    gsm,
    mileage,
    extVolt,
    batVolt,
    acc,
    uploadReason,
    io,
    checksum,
    extensions,
  };
}

import { Paper, TextField, Typography, Box, Divider } from "@mui/material";
import { useState, useMemo } from "react";
import PioneerDecoder from "./PioneerDecoder";

export default function PioneerPositionDecoder() {
  return (
    <Paper>
      <PioneerDecoder />
    </Paper>
  );
}
