import React from "react";
import { Box, Paper, Typography, Chip, Stack } from "@mui/material";
import { DECODER_STATES } from "../utils/teltonikaParser.js";
import { STATE_COLORS, SESSION_COLORS } from "./styles/shared.js";

function DecoderStatePanel({
  decoderState,
  sessionState,
  bufferSize,
  imei,
  codecName,
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        backgroundColor: "#252526",
        borderRadius: 2,
        p: 2,
        border: "1px solid #3C3C3C",
        fontFamily: "'Roboto Mono', 'Fira Code', 'Consolas', monospace",
        height: "100%",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: {
            xs: "flex-start",
            sm: "center",
          },
          justifyContent: "space-between",
          gap: 1,
          mb: 1.5,
          pb: 1.25,
          borderBottom: "1px solid #3C3C3C",
          flexWrap: "wrap",
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            color: "#4FC3F7",
            fontSize: "15px",
            fontFamily: "inherit",
          }}
        >
          Decoder State
        </Typography>

        <Chip
          label={decoderState}
          size="small"
          sx={{
            backgroundColor: STATE_COLORS[decoderState] || "#9E9E9E",
            color: "#fff",
            fontWeight: 700,
            fontSize: "11px",
            borderRadius: 1,
            height: 24,
            "& .MuiChip-label": {
              px: 1.2,
            },
          }}
        />
      </Box>

      {/* Body */}
      <Stack spacing={1}>
        <StateRow
          label="Session"
          value={
            <Chip
              label={sessionState}
              size="small"
              sx={{
                backgroundColor: SESSION_COLORS[sessionState] || "#607D8B",
                color: "#fff",
                fontWeight: 700,
                fontSize: "11px",
                borderRadius: 1,
                height: 24,
                "& .MuiChip-label": {
                  px: 1.2,
                },
              }}
            />
          }
        />

        <StateRow label="Buffer" value={`${bufferSize} bytes`} mono />

        {imei && <StateRow label="IMEI" value={imei} mono />}

        {codecName && <StateRow label="Codec" value={codecName} mono />}
      </Stack>
    </Paper>
  );
}

function StateRow({ label, value, mono = false }) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 2,
        minWidth: 0,
      }}
    >
      <Typography
        sx={{
          fontSize: "11px",
          color: "#9E9E9E",
          textTransform: "uppercase",
          flexShrink: 0,
          fontFamily: "'Roboto Mono', 'Fira Code', 'Consolas', monospace",
        }}
      >
        {label}
      </Typography>

      {typeof value === "string" ? (
        <Typography
          sx={{
            fontSize: "12px",
            color: "#E0E0E0",
            fontFamily: mono
              ? "'Roboto Mono', 'Fira Code', 'Consolas', monospace"
              : "inherit",
            wordBreak: "break-word",
            textAlign: "right",
          }}
        >
          {value}
        </Typography>
      ) : (
        value
      )}
    </Box>
  );
}

export default DecoderStatePanel;
