import { useState } from "react";
import {
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Stack,
  Tooltip,
  Chip,
  TextField,
  Grid,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Divider from "@mui/material/Divider";
import {
  bytesToFloat32,
  bytesToFloat64,
  getFloat32Bits,
  getFloat64Bits,
  float32ToBytes,
  float64ToBytes,
} from "../utils/converters";
import { bytesToHex } from "../utils/converters";

function BitField({ bits, label, color, tooltip }) {
  return (
    <Tooltip title={tooltip || label} arrow>
      <Box sx={{ flex: 1 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            fontSize: "0.65rem",
            mb: 0.25,
            display: "block",
            textAlign: "center",
          }}
        >
          {label}
        </Typography>
        <Box
          sx={{
            display: "flex",
            gap: 0.5,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {bits.split("").map((bit, i) => (
            <Box
              key={i}
              sx={{
                width: 14,
                height: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: bit === "1" ? `${color}.main` : `${color}.dark`,
                color: "#fff",
                fontSize: "0.6rem",
                fontFamily: "monospace",
                fontWeight: 700,
                borderRadius: 0.3,
                opacity: bit === "1" ? 1 : 0.5,
              }}
            >
              {bit}
            </Box>
          ))}
        </Box>
      </Box>
    </Tooltip>
  );
}

function Float32Visualizer({ bytes, endianness }) {
  if (!bytes || bytes.length < 4) return null;
  const floatVal = bytesToFloat32(bytes, endianness);
  if (floatVal === null || floatVal === undefined) return null;
  const bits = getFloat32Bits(floatVal);
  if (!bits) return null;
  const binary = bits.signBit + bits.exponentBits + bits.mantissaBits;

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2" fontWeight={600}>
        Float32 (Single Precision)
      </Typography>
      <Typography
        variant="h5"
        sx={{ fontFamily: "monospace", fontWeight: 700 }}
      >
        {floatVal}
      </Typography>
      <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
        <BitField
          bits={bits.signBit}
          label="Sign"
          color="error"
          tooltip={`Sign bit: ${bits.signBit} (${bits.sign === 0 ? "Positive" : "Negative"})`}
        />
        <BitField
          bits={bits.exponentBits}
          label={`Exponent (${bits.exponent})`}
          color="primary"
          tooltip={`Exponent: ${bits.exponent} (biased), actual: ${bits.exponent - 127}`}
        />
        <BitField
          bits={bits.mantissaBits}
          label="Mantissa (23 bits)"
          color="success"
          tooltip="Fractional part (significand)"
        />
      </Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontFamily: "monospace", fontSize: "0.7rem" }}
      >
        {binary.substring(0, 1)} {binary.substring(1, 9)} {binary.substring(9)}
      </Typography>
    </Stack>
  );
}

function Float64Visualizer({ bytes, endianness }) {
  if (!bytes || bytes.length < 8) return null;
  const floatVal = bytesToFloat64(bytes, endianness);
  if (floatVal === null || floatVal === undefined) return null;
  const bits = getFloat64Bits(floatVal);
  if (!bits) return null;
  const binary = bits.signBit + bits.exponentBits + bits.mantissaBits;

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2" fontWeight={600}>
        Float64 (Double Precision)
      </Typography>
      <Typography
        variant="h5"
        sx={{ fontFamily: "monospace", fontWeight: 700 }}
      >
        {floatVal}
      </Typography>
      <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
        <BitField
          bits={bits.signBit}
          label="Sign"
          color="error"
          tooltip={`Sign bit: ${bits.signBit} (${bits.sign === 0 ? "Positive" : "Negative"})`}
        />
        <BitField
          bits={bits.exponentBits}
          label={`Exponent (${bits.exponent})`}
          color="primary"
          tooltip={`Exponent: ${bits.exponent} (biased), actual: ${bits.exponent - 1023}`}
        />
        <BitField
          bits={bits.mantissaBits}
          label="Mantissa (52 bits)"
          color="success"
          tooltip="Fractional part (significand)"
        />
      </Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontFamily: "monospace", fontSize: "0.7rem" }}
      >
        {binary.substring(0, 1)} {binary.substring(1, 12)}{" "}
        {binary.substring(12)}
      </Typography>
    </Stack>
  );
}

export default function FloatVisualizer({ bytes, endianness }) {
  const [floatInput, setFloatInput] = useState("");
  const [floatError, setFloatError] = useState("");

  const handleFloatInput = (value) => {
    setFloatInput(value);
    setFloatError("");
  };

  const computeFloat = (precision) => {
    if (!floatInput) return null;
    const num = parseFloat(floatInput);
    if (isNaN(num)) {
      setFloatError("Invalid number");
      return null;
    }
    setFloatError("");
    const fb =
      precision === 32
        ? float32ToBytes(num, endianness)
        : float64ToBytes(num, endianness);
    return bytesToHex(fb, { separator: " ", prefix: "0x", upperCase: true });
  };

  const float32Hex = floatInput ? computeFloat(32) : null;
  const float64Hex = floatInput ? computeFloat(64) : null;

  return (
    <Accordion variant="outlined" sx={{ mb: 2 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography fontWeight={600}>IEEE 754 Float Visualizer</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          {bytes && bytes.length >= 4 && (
            <Box sx={{ mb: 1 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 1, display: "block" }}
              >
                From current input ({bytes.length} bytes):
              </Typography>
              <Float32Visualizer bytes={bytes} endianness={endianness} />
              {bytes.length >= 8 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Float64Visualizer bytes={bytes} endianness={endianness} />
                </>
              )}
            </Box>
          )}

          <Divider />
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{ fontWeight: 600 }}
          >
            Or enter a float value to see its binary representation:
          </Typography>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                value={floatInput}
                onChange={(e) => handleFloatInput(e.target.value)}
                placeholder="e.g. 3.14159"
                error={!!floatError}
                helperText={floatError || " "}
                sx={{ "& input": { fontFamily: "monospace" } }}
                aria-label="Enter float value"
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <Stack spacing={1}>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 600 }}
                  >
                    Float32:
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                    {float32Hex || (
                      <Box component="span" color="text.disabled">
                        Enter a value
                      </Box>
                    )}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 600 }}
                  >
                    Float64:
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                    {float64Hex || (
                      <Box component="span" color="text.disabled">
                        Enter a value
                      </Box>
                    )}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
