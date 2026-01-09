import React, { useState, useMemo } from "react";
import {
  TextField,
  Typography,
  Grid,
  Box,
  Button,
  InputAdornment,
} from "@mui/material";

/* =====================
   Utilities
===================== */

const cleanHex = (h) => (h || "").replace(/\s/g, "").toUpperCase();

// --- Float <-> Hex (Little Endian) ---
const hexToFloatLE = (hex) => {
  if (!hex || hex.length !== 8) return 0;
  const bytes = new Uint8Array(
    hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
  );
  const view = new DataView(bytes.buffer);
  return parseFloat(view.getFloat32(0, true).toFixed(6));
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

// --- Int <-> Hex ---
const hexToInt = (hex) => parseInt(hex, 16) || 0;

const intToHex = (val, bytes) => {
  let num = Number(val);
  if (isNaN(num)) num = 0;
  return Math.max(0, Math.min(Math.pow(2, bytes * 8) - 1, Math.floor(num)))
    .toString(16)
    .padStart(bytes * 2, "0")
    .toUpperCase();
};

// --- BCD Date Handling (Matches Original Logic) ---
// If the raw hex is "26", it means year 2026. This is BCD-like behavior.
const hexToDateBCD = (hex) => {
  if (hex.length !== 12) return "";
  const yy = hex.substring(0, 2);
  const mm = hex.substring(2, 4);
  const dd = hex.substring(4, 6);
  const h = hex.substring(6, 8);
  const m = hex.substring(8, 10);
  const s = hex.substring(10, 12);
  return `20${yy}-${mm}-${dd}T${h}:${m}:${s}`;
};

const dateToHexBCD = (isoString) => {
  if (!isoString) return "000000000000";
  const d = new Date(isoString);
  const pad = (n) => n.toString().padStart(2, "0");
  // Directly use the decimal digits as the hex string
  return (
    pad(d.getFullYear() % 100) +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
};

/* =====================
   Field Schema
===================== */
const SCHEMA = [
  { label: "Header", start: 1, end: 2, type: "hex", readOnly: true },
  { label: "Msg Type", start: 3, end: 3, type: "hex", readOnly: true },
  { label: "Length", start: 4, end: 5, type: "int" },
  { label: "Serial", start: 6, end: 7, type: "int" },
  { label: "IMEI (15 digit)", start: 8, end: 15, type: "imei" },
  { label: "Ignition ON (s)", start: 16, end: 17, type: "int" },
  { label: "Ignition OFF (s)", start: 18, end: 19, type: "int" },
  { label: "Angle (°)", start: 20, end: 21, type: "int" },
  { label: "Distance (m)", start: 22, end: 23, type: "int" },
  { label: "Signal/Alarm", start: 24, end: 24, type: "hex" },
  { label: "GNSS Status", start: 25, end: 25, type: "hex" },
  { label: "Manager Status", start: 26, end: 26, type: "hex" },
  { label: "Others", start: 27, end: 27, type: "hex" },
  { label: "Heartbeat (min)", start: 28, end: 28, type: "int" },
  { label: "Relay Status", start: 29, end: 29, type: "hex" },
  { label: "Drag Alarm", start: 30, end: 30, type: "hex" },
  { label: "Digital I/O", start: 31, end: 31, type: "hex" },
  { label: "Digital OUT", start: 32, end: 32, type: "hex" },
  { label: "Reserved", start: 33, end: 33, type: "hex" },
  { label: "Analog 0", start: 34, end: 35, type: "hex" },
  { label: "Analog 1", start: 36, end: 37, type: "hex" },
  { label: "Analog 2", start: 38, end: 39, type: "hex" },
  { label: "Multiplex", start: 40, end: 43, type: "hex" },
  { label: "Alarm Type", start: 44, end: 44, type: "hex" },
  { label: "Reserved", start: 45, end: 45, type: "hex" },
  { label: "Gap/Rsrv", start: 46, end: 47, type: "hex" },
  { label: "Odometer (m)", start: 48, end: 51, type: "int" },
  { label: "Bat/Rsrv", start: 52, end: 52, type: "hex" },
  { label: "Date/Time", start: 53, end: 58, type: "date" },
  { label: "Altitude (m)", start: 59, end: 62, type: "float" },
  { label: "Longitude", start: 63, end: 66, type: "float" },
  { label: "Latitude", start: 67, end: 70, type: "float" },
  { label: "Speed (km/h)", start: 71, end: 72, type: "int" },
  { label: "Direction (°)", start: 73, end: 74, type: "int" },
  { label: "Int. Batt (x0.01V)", start: 75, end: 76, type: "int" },
  { label: "Ext. Power (x0.01V)", start: 77, end: 78, type: "int" },
  { label: "Reserved", start: 79, end: 83, type: "hex" },
  { label: "Temperature", start: 84, end: 84, type: "int" },
];

export default function PioneerDecoder() {
  const [rawInput, setRawInput] = useState(
    "2525130059E1600123456789101112000A001E1E000000414C0000050000004100000000000000FFFFFFFFFFFF00D5000186CB0026010816364466E64243B1489A428D68E541000000F003901257FFFFFF0000180000FFFFFF"
  );

  const [newImei, setNewImei] = useState("");
  const handleModifyImei = () => {
    const imeiField = SCHEMA.find((f) => f.type === "imei");
    if (imeiField && newImei.replace(/\D/g, "").length === 15) {
      handleFieldChange(imeiField, newImei);
      // setNewImei(""); // ← optional: clear after apply
    }
    // handleFieldChange(
    //   { label: "IMEI (15 digit)", start: 8, end: 15, type: "imei" },
    //   "0" + newImei
    // );
  };

  const getHexSegment = (start, end) => {
    const clean = cleanHex(rawInput);
    return clean.substring((start - 1) * 2, end * 2);
  };

  const updateHexSegment = (start, end, newSegment) => {
    const clean = cleanHex(rawInput);
    const startIndex = (start - 1) * 2;
    const endIndex = end * 2;
    const before = clean.substring(0, startIndex);
    const after = clean.substring(endIndex);
    setRawInput(before + newSegment + after);
  };

  const handleFieldChange = (item, value) => {
    const byteLength = item.end - item.start + 1;
    let newHex = "";

    try {
      if (item.type === "int") {
        newHex = intToHex(value, byteLength);
      } else if (item.type === "float") {
        newHex = floatToHexLE(value);
      } else if (item.type === "date") {
        newHex = dateToHexBCD(value);
      } else if (item.type === "imei") {
        // IMEI Logic: Store as BCD (each decimal digit = one hex nibble)
        const imeiStr = value
          .toString()
          .replace(/\D/g, "")
          .padEnd(15, "0")
          .substring(0, 15);

        // Convert each decimal digit to BCD hex representation
        newHex = imeiStr
          .split("")
          .map((d) => parseInt(d, 10).toString(16)) // Convert digit to hex
          .join("")
          .toUpperCase();

        // Ensure it's exactly 15 hex characters (15 nibbles = 7.5 bytes)
        // But IMEI field is 8 bytes (16 hex chars), so pad with 0 at beginning
        newHex = "0" + newHex.padEnd(15, "0");
      } else {
        newHex = value.replace(/[^0-9A-Fa-f]/g, "").toUpperCase();
        if (newHex.length > byteLength * 2) {
          newHex = newHex.substring(0, byteLength * 2);
        } else {
          newHex = newHex.padStart(byteLength * 2, "0");
        }
      }
      updateHexSegment(item.start, item.end, newHex);
    } catch (e) {
      console.error("Encoding error", e);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cleanHex(rawInput));
  };
  const canModifyImei = newImei.replace(/\D/g, "").length === 15;

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Pioneer 2-Way Editor
      </Typography>

      <TextField
        label="Raw Hex"
        fullWidth
        multiline
        minRows={3}
        value={rawInput}
        onChange={(e) =>
          setRawInput(e.target.value.replace(/[^0-9a-fA-F]/g, ""))
        }
        sx={{ mb: 4 }}
      />
      <Button variant="outlined" onClick={copyToClipboard} sx={{ mb: 3 }}>
        Copy Hex
      </Button>

      <Box sx={{ mb: 4, p: 2, border: "1px solid #ccc", borderRadius: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Change IMEI
        </Typography>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} sm={8}>
            <TextField
              label="New 15-digit IMEI"
              fullWidth
              value={newImei}
              onChange={(e) => {
                const onlyDigits = e.target.value.replace(/\D/g, "");
                setNewImei(onlyDigits);
              }}
              inputProps={{ maxLength: 15 }}
              placeholder="354812061234567"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {newImei.length}/15
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              disabled={!canModifyImei}
              onClick={handleModifyImei}
              sx={{ height: 56 }}
            >
              Apply New IMEI
            </Button>
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={2}>
        {SCHEMA.map((item, index) => {
          const currentHex = getHexSegment(item.start, item.end);
          let displayValue = "";

          // Decoding Logic
          if (item.type === "int") {
            displayValue = hexToInt(currentHex);
          } else if (item.type === "float") {
            displayValue = hexToFloatLE(currentHex);
          } else if (item.type === "date") {
            displayValue = hexToDateBCD(currentHex);
          } else if (item.type === "imei") {
            // Remove the leading 0 for display
            // displayValue = currentHex.substring(1);
            const bcdHex = currentHex.substring(1); // Remove leading 0
            let imeiStr = "";
            for (let i = 0; i < bcdHex.length; i++) {
              const digit = parseInt(bcdHex[i], 16);
              if (!isNaN(digit)) {
                imeiStr += digit.toString();
              }
            }
            // Take only 15 digits for IMEI
            displayValue = imeiStr.substring(0, 15);
          } else {
            displayValue = currentHex;
          }

          return (
            <Grid item xs={6} sm={4} md={3} key={index}>
              <TextField
                label={item.label}
                fullWidth
                size="small"
                disabled={item.readOnly || item.type === "imei"}
                type={
                  item.type === "int" ||
                  item.type === "float" ||
                  item.type === "imei"
                    ? "text"
                    : item.type === "date"
                    ? "datetime-local"
                    : "text"
                }
                value={displayValue}
                onChange={(e) => handleFieldChange(item, e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  step: item.type === "float" ? "0.000001" : "1",
                }}
              />
              <Typography
                variant="caption"
                display="block"
                sx={{
                  mt: 0.5,
                  color: "text.secondary",
                  fontFamily: "monospace",
                }}
              >
                Byte: {item.start}-{item.end} (0x{currentHex})
              </Typography>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
