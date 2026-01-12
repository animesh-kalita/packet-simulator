import React, { useState } from "react";
import {
  TextField,
  Typography,
  Grid,
  Box,
  Button,
  InputAdornment,
  Divider,
  Paper,
  Tooltip,
} from "@mui/material";

/* =====================
   Utilities
===================== */

const cleanHex = (h) => (h || "").replace(/\s/g, "").toUpperCase();
const hexToInt = (hex) => parseInt(hex, 16) || 0;

const intToHex = (val, bytes) => {
  let num = Number(val);
  if (isNaN(num)) num = 0;
  return Math.max(0, Math.min(Math.pow(2, bytes * 8) - 1, Math.floor(num)))
    .toString(16)
    .padStart(bytes * 2, "0")
    .toUpperCase();
};

// Formatter for Version Bytes (e.g., 010207 -> v1.2.7)
// Treats each byte as a decimal number
const formatVersion = (hex) => {
  if (!hex) return "";
  const parts = hex.match(/.{1,2}/g) || [];
  // Often these are BCD or simple Ints. Displaying as dot-separated Ints is safest.
  return "v" + parts.map((h) => parseInt(h, 16)).join(".");
};

/* =====================
   Schema (0x01)
===================== */
const SCHEMA = [
  { label: "Header", s: 1, e: 2, t: "hex", r: true },
  { label: "Msg Type (0x01)", s: 3, e: 3, t: "hex", r: true },
  { label: "Packet Length", s: 4, e: 5, t: "int" },
  { label: "Serial", s: 6, e: 7, t: "int" },
  { label: "IMEI", s: 8, e: 15, t: "imei", r: true },

  // Versions
  { label: "MCU Version", s: 16, e: 17, t: "hex", h: "Bit15-12: Model" },
  { label: "Modem Version", s: 18, e: 20, t: "version" }, // 3 Bytes
  { label: "Modem App Ver", s: 21, e: 22, t: "version" }, // 2 Bytes
  { label: "Hardware Ver", s: 23, e: 23, t: "version" }, // 1 Byte
];

export default function LoginDecoder() {
  // Sample from Doc: 2525 01 0017 0001 0880616898888888 1016 010207 1101 11
  const [rawInput, setRawInput] = useState(
    "2525010017000108806168988888881016010207110111"
  );
  const [newImei, setNewImei] = useState("");

  const clean = cleanHex(rawInput);

  const getHexSegment = (s, e) => {
    if (clean.length < e * 2) return "00".repeat(e - s + 1);
    return clean.substring((s - 1) * 2, e * 2);
  };

  const updateHexSegment = (s, e, newSegment) => {
    const startIndex = (s - 1) * 2;
    const endIndex = e * 2;
    const before = clean.substring(0, startIndex);
    const after = clean.substring(endIndex);
    setRawInput(before + newSegment + after);
  };

  const handleValueChange = (type, start, end, value) => {
    const byteLength = end - start + 1;
    let newHex = "";
    try {
      if (type === "int") newHex = intToHex(value, byteLength);
      else if (type === "imei") {
        const imeiStr = value
          .toString()
          .replace(/\D/g, "")
          .padEnd(15, "0")
          .substring(0, 15);
        newHex =
          "0" +
          imeiStr
            .split("")
            .map((d) => parseInt(d, 10).toString(16))
            .join("")
            .toUpperCase();
      } else if (type === "version") {
        // Input: "v1.2.3" or "1.2.3" -> Convert back to Hex bytes
        // This is complex to validate user input perfectly, so we treat it as Hex edit if user edits raw,
        // or we just allow raw hex editing.
        // For simplicity in this UI, let's treat version fields as Hex strings for editing,
        // but display the formatted version as a helper or label.
        // Actually, let's just stick to Raw Hex entry for reliability, and show the decoded version visually.
        newHex = value.replace(/[^0-9A-Fa-f]/g, "").toUpperCase();
        if (newHex.length > byteLength * 2)
          newHex = newHex.substring(0, byteLength * 2);
        else newHex = newHex.padStart(byteLength * 2, "0");
      } else {
        newHex = value.replace(/[^0-9A-Fa-f]/g, "").toUpperCase();
        if (newHex.length > byteLength * 2)
          newHex = newHex.substring(0, byteLength * 2);
        else newHex = newHex.padStart(byteLength * 2, "0");
      }
      updateHexSegment(start, end, newHex);
    } catch (e) {
      console.error(e);
    }
  };

  const handleModifyImei = () => {
    if (newImei.length === 15) handleValueChange("imei", 8, 15, newImei);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography
        variant="h5"
        sx={{ mb: 2, color: "primary.main", fontWeight: "bold" }}
      >
        Login Decoder (0x01)
      </Typography>

      <TextField
        label="Raw Hex String"
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
      <Button
        variant="outlined"
        onClick={() => navigator.clipboard.writeText(cleanHex(rawInput))}
        sx={{ mb: 4 }}
      >
        Copy Hex
      </Button>

      {/* IMEI */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Device IMEI
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={8}>
            <TextField
              label="New 15-digit IMEI"
              fullWidth
              size="small"
              value={newImei}
              onChange={(e) => setNewImei(e.target.value.replace(/\D/g, ""))}
              inputProps={{ maxLength: 15 }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant="contained"
              fullWidth
              disabled={newImei.length !== 15}
              onClick={handleModifyImei}
            >
              Apply
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* FIELDS */}
      <Grid container spacing={2}>
        {SCHEMA.map((f, i) => {
          const hex = getHexSegment(f.s, f.e);
          let val = hex;
          let helper = f.h || "";

          if (f.t === "int") val = hexToInt(hex);
          if (f.t === "imei") val = hex.substring(1);

          // Special Version Display
          if (f.t === "version") {
            // We display the Hex for editing, but show the Version string in helper
            helper = `Decoded: ${formatVersion(hex)}`;
          }
          if (f.label === "MCU Version") {
            // Parsing MCU bits
            const mcuVal = parseInt(hex, 16);
            const model = (mcuVal >> 12) & 0xf;
            const ver = mcuVal & 0xfff;
            helper = `Model: ${model}, Ver: 0x${ver.toString(16)}`;
          }

          return (
            <Grid item xs={6} sm={4} md={3} key={i}>
              <Tooltip title={`Bytes ${f.s}-${f.e}`}>
                <TextField
                  label={f.label}
                  fullWidth
                  size="small"
                  value={val}
                  disabled={f.r}
                  helperText={helper}
                  type={f.t === "int" ? "number" : "text"}
                  onChange={(e) =>
                    handleValueChange(f.t, f.s, f.e, e.target.value)
                  }
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    style: {
                      fontFamily:
                        f.t === "hex" || f.t === "version"
                          ? "monospace"
                          : "inherit",
                    },
                  }}
                />
              </Tooltip>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
