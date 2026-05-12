import React, { useState, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  Stack,
  Tooltip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import WifiIcon from "@mui/icons-material/Wifi";
import BuildIcon from "@mui/icons-material/Build";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import SpeedIcon from "@mui/icons-material/Speed";
import ThermostatIcon from "@mui/icons-material/Thermostat";
import BatteryChargingFullIcon from "@mui/icons-material/BatteryChargingFull";
import RouteIcon from "@mui/icons-material/Route";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

// ─── PID length table (mirrors pid_len.txt + Java decoder) ──────────────────
const PID_LENGTHS = {
  0x2100: 4,
  0x2101: 4,
  0x2102: 2,
  0x2103: 2,
  0x2104: 1,
  0x2105: 1,
  0x2106: 1,
  0x2107: 1,
  0x2108: 1,
  0x2109: 1,
  0x210a: 2,
  0x210b: 1,
  0x210c: 2,
  0x210d: 1,
  0x210e: 1,
  0x210f: 1,
  0x2110: 2,
  0x2111: 1,
  0x2112: 1,
  0x2113: 1,
  0x2114: 2,
  0x2115: 2,
  0x2116: 2,
  0x2117: 2,
  0x2118: 2,
  0x2119: 2,
  0x211a: 2,
  0x211b: 2,
  0x211c: 1,
  0x211d: 1,
  0x211e: 1,
  0x211f: 2,
  0x2120: 4,
  0x2121: 2,
  0x2122: 2,
  0x2123: 2,
  0x2124: 4,
  0x2125: 4,
  0x2126: 4,
  0x2127: 4,
  0x2128: 4,
  0x2129: 4,
  0x212a: 4,
  0x212b: 4,
  0x212c: 1,
  0x212d: 1,
  0x212e: 1,
  0x212f: 1,
  0x2130: 1,
  0x2131: 2,
  0x2132: 2,
  0x2133: 1,
  0x2134: 4,
  0x2135: 4,
  0x2136: 4,
  0x2137: 4,
  0x2138: 4,
  0x2139: 4,
  0x213a: 4,
  0x213b: 4,
  0x213c: 2,
  0x213d: 2,
  0x213e: 2,
  0x213f: 2,
  0x2140: 4,
  0x2141: 4,
  0x2142: 2,
  0x2143: 1,
  0x2144: 2,
  0x2145: 1,
  0x2146: 1,
  0x2147: 1,
  0x2148: 1,
  0x2149: 1,
  0x214a: 1,
  0x214b: 1,
  0x214c: 1,
  0x214d: 2,
  0x214e: 2,
  0x214f: 4,
  0x2150: 2,
  0x2151: 1,
  0x2152: 1,
  0x2153: 2,
  0x2154: 2,
  0x2155: 2,
  0x2156: 2,
  0x2157: 2,
  0x2158: 2,
  0x2159: 2,
  0x215a: 1,
  0x215b: 1,
  0x215c: 1,
  0x215d: 2,
  0x215e: 2,
  0x215f: 4,
  0x2160: 4,
  0x2161: 1,
  0x2162: 1,
  0x2163: 2,
  0x2164: 4,
  0x2166: 8,
  0x2167: 4,
  0x2168: 8,
  0x217f: 13,
  0x2185: 10,
  0x2187: 8,
  0x219d: 2,
  0x21a4: 4,
};

// PID human-readable names
const PID_NAMES = {
  0x2100: "Supported PIDs [01-20]",
  0x2101: "Monitor Status Since DTCs Cleared",
  0x2102: "Freeze DTC",
  0x2103: "Fuel System Status",
  0x2104: "Engine Load",
  0x2105: "Coolant Temperature",
  0x2106: "Short Term Fuel Trim Bank1",
  0x2107: "Long Term Fuel Trim Bank1",
  0x2108: "Short Term Fuel Trim Bank2",
  0x2109: "Long Term Fuel Trim Bank2",
  0x210a: "Fuel Rail Pressure",
  0x210b: "Intake Manifold Pressure",
  0x210c: "RPM",
  0x210d: "Vehicle Speed",
  0x210e: "Timing Advance",
  0x210f: "Intake Air Temperature",
  0x2110: "MAF Air Flow Rate",
  0x2111: "Absolute Throttle Position",
  0x2112: "Secondary Air Status",
  0x2113: "Oxygen Sensors Present",
  0x2114: "Oxygen Sensor 1 (V/STFT)",
  0x2115: "Oxygen Sensor 2 (V/STFT)",
  0x2116: "Oxygen Sensor 3",
  0x2117: "Oxygen Sensor 4",
  0x2118: "Oxygen Sensor 5",
  0x2119: "Oxygen Sensor 6",
  0x211a: "Oxygen Sensor 7",
  0x211b: "Oxygen Sensor 8",
  0x211c: "OBD Standards",
  0x211d: "Oxygen Sensors Present (B)",
  0x211e: "Auxiliary Input Status",
  0x211f: "Run Time Since Engine Start",
  0x2120: "Supported PIDs [21-40]",
  0x2121: "Distance Since MIL On",
  0x2122: "Fuel Rail Pressure (rel)",
  0x2123: "Fuel Rail Pressure (abs)",
  0x2124: "O2 Sensor 1 (equiv/current)",
  0x2125: "O2 Sensor 2",
  0x2126: "O2 Sensor 3",
  0x2127: "O2 Sensor 4",
  0x2128: "O2 Sensor 5",
  0x2129: "O2 Sensor 6",
  0x212a: "O2 Sensor 7",
  0x212b: "O2 Sensor 8",
  0x212c: "Commanded EGR",
  0x212d: "EGR Error",
  0x212e: "Commanded Evaporative Purge",
  0x212f: "Fuel Tank Level",
  0x2130: "Warm-ups Since Codes Cleared",
  0x2131: "Distance Since Codes Cleared",
  0x2132: "Evap System Vapor Pressure",
  0x2133: "Barometric Pressure",
  0x2134: "O2 Sensor 1 (wide)",
  0x2135: "O2 Sensor 2 (wide)",
  0x2136: "O2 Sensor 3 (wide)",
  0x2137: "O2 Sensor 4 (wide)",
  0x2138: "O2 Sensor 5 (wide)",
  0x2139: "O2 Sensor 6 (wide)",
  0x213a: "O2 Sensor 7 (wide)",
  0x213b: "O2 Sensor 8 (wide)",
  0x213c: "Catalyst Temp Bank1 Sensor1",
  0x213d: "Catalyst Temp Bank1 Sensor2",
  0x213e: "Catalyst Temp Bank2 Sensor1",
  0x213f: "Catalyst Temp Bank2 Sensor2",
  0x2140: "Supported PIDs [41-60]",
  0x2141: "Drive Cycle Monitor Status",
  0x2142: "Control Module Voltage",
  0x2143: "Absolute Load Value",
  0x2144: "Commanded Air-Fuel Equiv Ratio",
  0x2145: "Relative Throttle Position",
  0x2146: "Ambient Air Temperature",
  0x2147: "Absolute Throttle Position B",
  0x2148: "Absolute Throttle Position C",
  0x2149: "Accelerator Pedal Position D",
  0x214a: "Accelerator Pedal Position E",
  0x214b: "Accelerator Pedal Position F",
  0x214c: "Commanded Throttle Actuator",
  0x214d: "Time Run with MIL On",
  0x214e: "Time Since Trouble Codes Cleared",
  0x214f: "Max Values (O2/MAF)",
  0x2150: "Max Air Flow Rate from MAF",
  0x2151: "Fuel Type",
  0x2152: "Ethanol Fuel Percent",
  0x2153: "Abs Evap System Vapor Pressure",
  0x2154: "Evap System Vapor Pressure 2",
  0x2155: "Short Term O2 Trim Bank1",
  0x2156: "Long Term O2 Trim Bank1",
  0x2157: "Short Term O2 Trim Bank2",
  0x2158: "Long Term O2 Trim Bank2",
  0x2159: "Fuel Rail Abs Pressure",
  0x215a: "Relative Accelerator Pedal Pos",
  0x215b: "Hybrid Battery Pack Life",
  0x215c: "Engine Oil Temperature",
  0x215d: "Fuel Injection Timing",
  0x215e: "Engine Fuel Rate",
  0x215f: "Emission Requirements",
  0x2160: "Supported PIDs [61-80]",
  0x2161: "Driver Demand Engine Torque",
  0x2162: "Actual Engine Torque",
  0x2163: "Engine Reference Torque",
  0x2164: "Engine Percent Torque Data",
  0x2166: "Auxiliary I/O Supported",
  0x2167: "MAF Sensor",
  0x2168: "Engine Coolant Temperature (multi)",
  0x217f: "Engine Run Time (extended)",
  0x2185: "Urea Control System",
  0x2187: "NOx Sensor",
  0x219d: "Engine Fuel Rate (alt)",
  0x21a4: "Transmission",
};

// ─── Core parsing logic (mirrors Java exactly) ──────────────────────────────

function reverseBytes(hex) {
  // reverse byte order: "1A2B3C" → "3C2B1A"
  const bytes = hex.match(/.{2}/g) || [];
  return bytes.reverse().join("");
}

function hexToInt(hex) {
  return parseInt(hex, 16);
}

function hexToLong(hex) {
  return parseInt(hex, 16);
}

function hexToAscii(hex) {
  let str = "";
  for (let i = 0; i < hex.length; i += 2) {
    const code = parseInt(hex.substr(i, 2), 16);
    if (code > 0) str += String.fromCharCode(code);
  }
  return str;
}

function breakString(str, lengths) {
  const parts = [];
  let pos = 0;
  for (const len of lengths) {
    parts.push(str.substr(pos, len * 2));
    pos += len * 2;
  }
  // remainder
  if (pos < str.length) parts.push(str.substr(pos));
  return parts;
}

const PACKET_TYPE_MAP = {
  1001: { label: "Login", color: "default" },
  4001: { label: "GPS", color: "success" },
  4002: { label: "OBD", color: "primary" },
  4006: { label: "DTC", color: "error" },
  "400b": { label: "DTC", color: "error" },
  4007: { label: "Alarm", color: "warning" },
};

function parseStat(statHex) {
  // lengths: [4,4,4,4,4,2,4,8] bytes → hex chars doubled
  const parts = breakString(statHex, [4, 4, 4, 4, 4, 2, 4, 8]);
  const timestamp = hexToLong(reverseBytes(parts[1]));
  const lastAccOn = hexToLong(reverseBytes(parts[0]));
  const totalMile = hexToLong(reverseBytes(parts[2]));
  const currentMile = hexToLong(reverseBytes(parts[3]));
  const totalFuel = hexToLong(reverseBytes(parts[4]));
  const currentFuel = hexToLong(reverseBytes(parts[5]));

  // reserve bytes [1,1,1,1,1,1,2]
  const reserveRev = reverseBytes(parts[7]);
  const resParts = breakString(reserveRev, [1, 1, 1, 1, 1, 1, 2]);
  const gpsSignal = hexToInt(reverseBytes(resParts[4]));
  const extBatRaw = hexToInt(reverseBytes(resParts[2]));

  const date = new Date(timestamp * 1000);

  return {
    timestamp,
    date: date.toISOString().split("T")[0],
    time: date.toTimeString().split(" ")[0],
    gpsSignal,
    extBatVol: extBatRaw,
    lastAccOn,
    totalMile,
    currentMile,
    totalFuel: totalFuel / 10,
    currentFuel: currentFuel / 10,
    raw: {
      parts,
      reserveParts: resParts,
    },
  };
}

function parseGpsBlock(gpsHex) {
  // GPS block: 17 bytes = 34 hex chars
  // [4,4,4,1,1,1,1,1] bytes
  const parts = breakString(gpsHex, [4, 4, 4, 1, 1, 1, 1, 1]);
  const latRaw = hexToLong(reverseBytes(parts[0]));
  const lonRaw = hexToLong(reverseBytes(parts[1]));
  const altRaw = hexToLong(reverseBytes(parts[2]));
  const speed = hexToInt(reverseBytes(parts[3]));
  const sats = hexToInt(reverseBytes(parts[4]));
  const gpsFlag = hexToInt(reverseBytes(parts[5]));

  return {
    latitude: latRaw / 1000000,
    longitude: lonRaw / 1000000,
    altitude: altRaw / 100,
    speed,
    satellites: sats,
    gpsStatus: gpsFlag & 0x01 ? "A" : "V",
    raw: parts,
  };
}

function decodePids(pidKeysHex, pidValuesHex) {
  const pidCount = pidKeysHex.length / 4; // each PID key = 2 bytes = 4 hex chars
  const results = [];
  let valueIdx = 0;

  for (let i = 0; i < pidCount; i++) {
    const keyHex = pidKeysHex.substr(i * 4, 4);
    const keyRev = reverseBytes(keyHex);
    const pidCode = hexToInt(keyRev);
    const pidName =
      PID_NAMES[pidCode] || `Unknown (0x${pidCode.toString(16).toUpperCase()})`;
    const pidLen = PID_LENGTHS[pidCode];

    if (pidLen === undefined) {
      results.push({
        pidHex: `0x${pidCode.toString(16).toUpperCase().padStart(4, "0")}`,
        pidCode,
        name: pidName,
        rawHex: "?",
        valueHex: "?",
        note: "Unknown PID — length not in table, cannot advance",
        error: true,
      });
      break; // can't continue — offset is unknown
    }

    const valueHex = pidValuesHex.substr(valueIdx, pidLen * 2);
    valueIdx += pidLen * 2;

    results.push({
      pidHex: `0x${pidCode.toString(16).toUpperCase().padStart(4, "0")}`,
      pidCode,
      name: pidName,
      rawHex: valueHex,
      valueHex,
      decoded: decodePidValue(pidCode, valueHex),
      note: null,
      error: false,
    });
  }

  return results;
}

function decodePidValue(pidCode, hex) {
  if (!hex || hex === "?") return null;
  const rev = reverseBytes(hex);
  const raw = hexToInt(rev);
  switch (pidCode) {
    case 0x210c:
      return `${raw} RPM`;
    case 0x210d:
      return `${raw} km/h`;
    case 0x2105:
      return `${raw} °C`;
    case 0x210f:
      return `${raw} °C`;
    case 0x215c:
      return `${raw} °C`;
    case 0x2104:
      return `${((raw * 100) / 255).toFixed(1)} %`;
    case 0x212f:
      return `${((raw * 100) / 255).toFixed(1)} %`;
    case 0x2111:
      return `${((raw * 100) / 255).toFixed(1)} %`;
    case 0x2145:
      return `${((raw * 100) / 255).toFixed(1)} %`;
    case 0x2149:
      return `${((raw * 100) / 255).toFixed(1)} %`;
    case 0x214a:
      return `${((raw * 100) / 255).toFixed(1)} %`;
    case 0x2142:
      return `${(raw * 0.001).toFixed(3)} V`;
    case 0x215e:
      return `${raw} L/h`;
    case 0x219d:
      return `${(raw * 0.02).toFixed(2)} L/h`;
    case 0x2103: {
      const statuses = [
        "Open loop",
        "Closed loop",
        "Open loop Drive",
        "Open loop Fault",
        "Closed loop Fault",
      ];
      return statuses[hexToInt(hex.substr(0, 2))] || `0x${hex}`;
    }
    case 0x2151: {
      const types = {
        1: "Gasoline",
        2: "Methanol",
        3: "Ethanol",
        4: "Diesel",
        5: "LPG",
        6: "CNG",
        8: "Electric",
      };
      return types[raw] || `Type ${raw}`;
    }
    case 0x2121:
      return `${raw} km`;
    case 0x210b:
      return `${raw} kPa`;
    case 0x2110:
      return `${(raw * 0.01).toFixed(2)} g/s`;
    case 0x2133:
      return `${raw} kPa`;
    case 0x2106:
      return `${(((raw - 128) * 100) / 128).toFixed(1)} %`;
    case 0x2107:
      return `${(((raw - 128) * 100) / 128).toFixed(1)} %`;
    default:
      return `0x${hex.toUpperCase()} (${raw})`;
  }
}

function parseRawPacket(rawHex) {
  const hex = rawHex.replace(/\s+/g, "").toUpperCase();
  const errors = [];
  const segments = [];

  if (hex.length < 20) return { error: "Packet too short" };

  // ── Header ──────────────────────────────────────────────────────────────
  let pos = 0;

  const sof = hex.substr(pos, 4);
  pos += 4;
  segments.push({
    label: "SOF",
    hex: sof,
    bytes: 2,
    note: "Start of Frame (0x4040)",
  });

  const lengthHex = hex.substr(pos, 4);
  pos += 4;
  segments.push({
    label: "Length",
    hex: lengthHex,
    bytes: 2,
    note: `Packet length: 0x${lengthHex}`,
  });

  const version = hex.substr(pos, 2);
  pos += 2;
  segments.push({
    label: "Version",
    hex: version,
    bytes: 1,
    note: `Protocol version: ${hexToInt(version)}`,
  });

  const serialHex = hex.substr(pos, 40);
  pos += 40;
  const serialNo = hexToAscii(serialHex).replace(/\0/g, "");
  const uniqueId = "it_" + serialNo;
  segments.push({
    label: "Serial No",
    hex: serialHex,
    bytes: 20,
    note: `ASCII: ${serialNo}`,
  });

  const packetTypeHex = hex.substr(pos, 4);
  pos += 4;
  const packetTypeLow = packetTypeHex.toLowerCase();
  const packetInfo = PACKET_TYPE_MAP[packetTypeLow] || {
    label: "Unknown",
    color: "default",
  };
  segments.push({
    label: "Packet Type",
    hex: packetTypeHex,
    bytes: 2,
    note: `Type: ${packetInfo.label}`,
  });

  // ── Stat block (34 bytes = 68 hex chars) ────────────────────────────────
  const statHex = hex.substr(pos, 68);
  pos += 68;
  const stat = parseStat(statHex);
  segments.push({
    label: "Stat Block",
    hex: statHex,
    bytes: 34,
    note: "last_accon | timestamp | total_mile | current_mile | total_fuel | current_fuel | event_flag | reserve",
  });

  // ── GPS count (2 bytes) ──────────────────────────────────────────────────
  const gpsCountHex = hex.substr(pos, 4);
  pos += 4;
  const gpsCount = hexToInt(reverseBytes(gpsCountHex));
  segments.push({
    label: "GPS Count",
    hex: gpsCountHex,
    bytes: 2,
    note: `GPS records: ${gpsCount}`,
  });

  // ── PID count (1 byte) ───────────────────────────────────────────────────
  const pidCountHex = hex.substr(pos, 2);
  pos += 2;
  const pidCount = hexToInt(pidCountHex);
  segments.push({
    label: "PID Count",
    hex: pidCountHex,
    bytes: 1,
    note: `Number of PIDs: ${pidCount}`,
  });

  // ── PID keys block (pidCount * 2 bytes) ──────────────────────────────────
  const pidKeysHex = hex.substr(pos, pidCount * 4);
  pos += pidCount * 4;
  segments.push({
    label: "PID Keys",
    hex: pidKeysHex,
    bytes: pidCount * 2,
    note: `${pidCount} PID identifiers`,
  });

  // ── PID group count (1 byte) + group len (1 byte) ────────────────────────
  const pidGroupCountHex = hex.substr(pos, 2);
  pos += 2;
  const pidGroupCount = hexToInt(pidGroupCountHex);
  segments.push({
    label: "PID Group Count",
    hex: pidGroupCountHex,
    bytes: 1,
    note: `Groups: ${pidGroupCount}`,
  });

  const pidGroupLenHex = hex.substr(pos, 2);
  pos += 2;
  const pidGroupLen = hexToInt(pidGroupLenHex);
  segments.push({
    label: "PID Group Len",
    hex: pidGroupLenHex,
    bytes: 1,
    note: `Bytes per group: ${pidGroupLen}`,
  });

  // ── PID values block ─────────────────────────────────────────────────────
  const pidValuesLen = pidGroupCount * pidGroupLen;
  const pidValuesHex = hex.substr(pos, pidValuesLen * 2);
  pos += pidValuesLen * 2;
  segments.push({
    label: "PID Values",
    hex: pidValuesHex,
    bytes: pidValuesLen,
    note: `${pidValuesLen} bytes of PID data`,
  });

  // ── CRC (2 bytes) ────────────────────────────────────────────────────────
  const crcHex = hex.substr(pos, 4);
  pos += 4;
  segments.push({ label: "CRC", hex: crcHex, bytes: 2, note: "CRC-16" });

  // ── Terminator (2 bytes = 0D0A) ──────────────────────────────────────────
  const termHex = hex.substr(pos, 4);
  pos += 4;
  segments.push({
    label: "Terminator",
    hex: termHex,
    bytes: 2,
    note: "0x0D0A (CRLF)",
  });

  // ── Decode PIDs ──────────────────────────────────────────────────────────
  const pids = decodePids(pidKeysHex, pidValuesHex);

  return {
    hex,
    segments,
    packetType: packetInfo,
    packetTypeHex,
    serialNo,
    uniqueId,
    stat,
    gpsCount,
    pidCount,
    pids,
    errors,
  };
}

// ─── UI helpers ─────────────────────────────────────────────────────────────

const SEGMENT_COLORS = [
  "#e3f2fd",
  "#fce4ec",
  "#e8f5e9",
  "#fff8e1",
  "#f3e5f5",
  "#e0f7fa",
  "#fff3e0",
  "#f1f8e9",
  "#fbe9e7",
  "#e8eaf6",
  "#e0f2f1",
  "#fafafa",
  "#fff9c4",
  "#f9fbe7",
  "#e1f5fe",
];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <Tooltip title={copied ? "Copied!" : "Copy"}>
      <IconButton
        size="small"
        onClick={() => {
          navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        <ContentCopyIcon fontSize="inherit" />
      </IconButton>
    </Tooltip>
  );
}

function KV({ label, value, mono = false }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.3 }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 200 }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        fontWeight={500}
        fontFamily={mono ? "monospace" : undefined}
        textAlign="right"
      >
        {value ?? "—"}
      </Typography>
    </Box>
  );
}

// ─── Hex Visualizer ─────────────────────────────────────────────────────────

function HexVisualizer({ segments }) {
  const [hovered, setHovered] = useState(null);
  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
        Byte Map
      </Typography>
      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          fontFamily: "monospace",
          fontSize: 11,
          lineHeight: 1.8,
          wordBreak: "break-all",
          bgcolor: "grey.50",
        }}
      >
        {segments.map((seg, i) => (
          <Tooltip key={i} title={`${seg.label}: ${seg.note}`} arrow>
            <Box
              component="span"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              sx={{
                bgcolor: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
                border:
                  hovered === i ? "2px solid #1976d2" : "2px solid transparent",
                borderRadius: "3px",
                px: 0.3,
                mr: 0.3,
                mb: 0.3,
                display: "inline-block",
                cursor: "default",
                transition: "border 0.1s",
              }}
            >
              {seg.hex}
            </Box>
          </Tooltip>
        ))}
      </Paper>
      {hovered !== null && (
        <Alert severity="info" sx={{ mt: 1, py: 0.5 }}>
          <strong>{segments[hovered].label}</strong> — {segments[hovered].note}{" "}
          &nbsp;
          <span style={{ fontFamily: "monospace" }}>
            {segments[hovered].hex}
          </span>
          &nbsp;({segments[hovered].bytes} byte
          {segments[hovered].bytes !== 1 ? "s" : ""})
        </Alert>
      )}
    </Box>
  );
}

// ─── Segment Legend ──────────────────────────────────────────────────────────

function SegmentLegend({ segments }) {
  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{ maxHeight: 300 }}
    >
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700, width: 16 }}>#</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Field</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Bytes</TableCell>
            <TableCell sx={{ fontWeight: 700, fontFamily: "monospace" }}>
              Hex
            </TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Decoded</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {segments.map((seg, i) => (
            <TableRow
              key={i}
              sx={{ bgcolor: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }}
            >
              <TableCell>{i + 1}</TableCell>
              <TableCell>
                <strong>{seg.label}</strong>
              </TableCell>
              <TableCell>{seg.bytes}</TableCell>
              <TableCell sx={{ fontFamily: "monospace", fontSize: 11 }}>
                {seg.hex}
              </TableCell>
              <TableCell sx={{ fontSize: 12 }}>{seg.note}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ stat }) {
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
          <RouteIcon color="primary" />
          <Typography variant="subtitle1" fontWeight={700}>
            Stat Block
          </Typography>
        </Stack>
        <Grid container spacing={1}>
          <Grid item xs={12} sm={6}>
            <KV
              label="Timestamp"
              value={`${stat.timestamp} → ${stat.date} ${stat.time}`}
            />
            <KV
              label="Last ACC On"
              value={`${stat.lastAccOn} (${new Date(stat.lastAccOn * 1000).toLocaleString()})`}
            />
            <KV label="Total Trip Mileage" value={`${stat.totalMile} m`} />
            <KV label="Current Trip Mileage" value={`${stat.currentMile} m`} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <KV label="Total Fuel (÷10)" value={`${stat.totalFuel} L`} />
            <KV label="Current Fuel (÷10)" value={`${stat.currentFuel} L`} />
            <KV
              label="Combined Fuel"
              value={`${(stat.totalFuel + stat.currentFuel).toFixed(1)} L`}
            />
            <KV label="GPS Signal" value={stat.gpsSignal} />
            <KV label="Ext Battery (raw)" value={stat.extBatVol} />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

// ─── PID Table ───────────────────────────────────────────────────────────────

function PidTable({ pids }) {
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
          <BuildIcon color="primary" />
          <Typography variant="subtitle1" fontWeight={700}>
            PID Details — {pids.length} PID{pids.length !== 1 ? "s" : ""}
          </Typography>
        </Stack>
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{ maxHeight: 400 }}
        >
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>PID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                  Raw Hex
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Decoded Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pids.map((pid, i) => (
                <TableRow
                  key={i}
                  sx={{
                    bgcolor: pid.error ? "#fff3e0" : "inherit",
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <TableCell
                    sx={{
                      fontFamily: "monospace",
                      fontWeight: 600,
                      color: pid.error ? "error.main" : "primary.main",
                    }}
                  >
                    {pid.pidHex}
                  </TableCell>
                  <TableCell>{pid.name}</TableCell>
                  <TableCell sx={{ fontFamily: "monospace", fontSize: 11 }}>
                    {pid.rawHex}
                  </TableCell>
                  <TableCell
                    sx={{ fontFamily: pid.decoded ? "inherit" : "monospace" }}
                  >
                    {pid.error ? (
                      <Chip
                        label={pid.note}
                        color="warning"
                        size="small"
                        icon={<WarningAmberIcon />}
                      />
                    ) : (
                      pid.decoded || `0x${pid.rawHex}`
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SinocastelRawPacketViewer() {
  const [rawInput, setRawInput] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleInput = useCallback((text) => {
    setRawInput(text);
    const clean = text.replace(/\s+/g, "");
    if (!clean) {
      setResult(null);
      setError("");
      return;
    }
    if (!/^[0-9A-Fa-f]+$/.test(clean)) {
      setError("Input must be a hex string");
      setResult(null);
      return;
    }
    try {
      const parsed = parseRawPacket(clean);
      setResult(parsed);
      setError("");
    } catch (e) {
      setError("Parse error: " + e.message);
      setResult(null);
    }
  }, []);

  return (
    <Box sx={{ maxWidth: 960, mx: "auto", p: 3 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Sinocastel Raw Packet Viewer
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Paste the raw hex string directly from the TCP handler log.
      </Typography>

      <TextField
        label="Raw hex packet"
        multiline
        minRows={3}
        maxRows={6}
        fullWidth
        value={rawInput}
        onChange={(e) => handleInput(e.target.value)}
        error={!!error}
        helperText={error || "e.g. 40408000043231384C...0D0A"}
        sx={{ mb: 3 }}
        inputProps={{ style: { fontFamily: "monospace", fontSize: 12 } }}
      />

      {result && (
        <Box>
          {/* ── Identity banner ── */}
          <Card variant="outlined" sx={{ mb: 2, bgcolor: "primary.50" }}>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
                flexWrap="wrap"
                gap={1}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    IMEI / Unique ID
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      fontFamily="monospace"
                    >
                      {result.uniqueId}
                    </Typography>
                    <CopyButton text={result.uniqueId} />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Serial: <strong>{result.serialNo}</strong>
                  </Typography>
                </Box>
                <Stack spacing={0.5} alignItems="flex-end">
                  <Chip
                    label={result.packetType.label}
                    color={result.packetType.color}
                    size="small"
                    sx={{ fontWeight: 700, fontSize: 13 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Type hex: <code>{result.packetTypeHex}</code>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {result.stat.date} {result.stat.time}
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {/* ── Hex byte map ── */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography fontWeight={700}>Hex Byte Map</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <HexVisualizer segments={result.segments} />
            </AccordionDetails>
          </Accordion>

          {/* ── Segment legend ── */}
          <Accordion defaultExpanded sx={{ mt: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography fontWeight={700}>
                Field Breakdown ({result.segments.length} fields)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <SegmentLegend segments={result.segments} />
            </AccordionDetails>
          </Accordion>

          {/* ── Stat block ── */}
          <Box sx={{ mt: 2 }}>
            <StatCard stat={result.stat} />
          </Box>

          {/* ── PID table ── */}
          {result.pids.length > 0 && <PidTable pids={result.pids} />}

          {/* ── GPS info ── */}
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 1 }}
              >
                <WifiIcon color="success" />
                <Typography variant="subtitle1" fontWeight={700}>
                  GPS Info
                </Typography>
              </Stack>
              <KV label="GPS Records in packet" value={result.gpsCount} />
              <Typography variant="caption" color="text.secondary">
                (GPS coordinates are inside the GPS sub-records, not decoded
                here — GPS block count: {result.gpsCount})
              </Typography>
            </CardContent>
          </Card>

          {/* ── Raw hex with copy ── */}
          <Card variant="outlined">
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <Typography variant="subtitle1" fontWeight={700}>
                  Full Raw Hex
                </Typography>
                <CopyButton text={result.hex} />
              </Stack>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  fontFamily: "monospace",
                  fontSize: 11,
                  wordBreak: "break-all",
                  bgcolor: "grey.50",
                  maxHeight: 80,
                  overflow: "auto",
                }}
              >
                {result.hex}
              </Paper>
            </CardContent>
          </Card>
        </Box>
      )}

      {!result && !error && (
        <Alert severity="info">
          Paste a raw hex packet — supports OBD (<code>4002</code>), DTC (
          <code>4006</code>/<code>400B</code>), GPS (<code>4001</code>), Alarm (
          <code>4007</code>), and Login (<code>1001</code>) packets.
        </Alert>
      )}
    </Box>
  );
}
