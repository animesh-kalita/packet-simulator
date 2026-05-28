import React from "react";
import { Box, Divider, Grid, Stack, Typography } from "@mui/material";

function SessionFlowVisualizer({ sessionState, imei, codecName, packetCount }) {
  const steps = [
    {
      label: "CONNECT",
      state: sessionState === "CONNECTED" || sessionState === "AUTHENTICATED",
    },
    { label: "IMEI", state: !!imei },
    { label: "ACK", state: !!imei },
    { label: "AVL", state: packetCount > 0 },
    { label: "PARSE", state: packetCount > 0 },
    { label: "RESPONSE", state: packetCount > 0 },
  ];

  const sessionColor =
    sessionState === "AUTHENTICATED"
      ? "#4CAF50"
      : sessionState === "CONNECTED"
        ? "#2196F3"
        : "#F44336";

  return (
    <Box
      sx={{
        backgroundColor: "#252526",
        borderRadius: 2,
        p: 2,
        border: "1px solid #3C3C3C",
        fontFamily: "'Roboto Mono', 'Fira Code', 'Consolas', monospace",
      }}
    >
      {/* Title */}
      <Typography
        sx={{
          fontSize: "15px",
          fontWeight: "bold",
          color: "#4FC3F7",
          mb: 1.5,
          pb: 1.25,
          borderBottom: "1px solid #3C3C3C",
          fontFamily: "inherit",
        }}
      >
        Session Flow
      </Typography>

      {/* Flow steps */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="center"
        flexWrap="wrap"
        gap={0.75}
        sx={{ py: 2, px: 0.5 }}
      >
        {steps.map((step, idx) => (
          <React.Fragment key={step.label}>
            {/* Node */}
            <Stack
              alignItems="center"
              spacing={0.5}
              sx={{ opacity: step.state ? 1 : 0.35 }}
            >
              <Box
                sx={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  backgroundColor: step.state ? "#4CAF50" : "#3C3C3C",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "11px",
                  fontWeight: "bold",
                  fontFamily: "inherit",
                }}
              >
                {step.state ? "\u2713" : idx + 1}
              </Box>
              <Typography
                sx={{
                  fontSize: "9px",
                  color: "#9E9E9E",
                  textTransform: "uppercase",
                  fontFamily: "inherit",
                  lineHeight: 1,
                }}
              >
                {step.label}
              </Typography>
            </Stack>

            {/* Arrow */}
            {idx < steps.length - 1 && (
              <Typography
                sx={{ color: "#3C3C3C", fontSize: "16px", lineHeight: 1 }}
              >
                {"\u2192"}
              </Typography>
            )}
          </React.Fragment>
        ))}
      </Stack>

      {/* Info grid */}
      <Divider sx={{ borderColor: "#3C3C3C", mt: 1.5 }} />
      <Grid container spacing={1} sx={{ mt: 0.25 }}>
        {[
          { label: "IMEI", value: imei || "---", color: "#E0E0E0" },
          { label: "Codec", value: codecName || "---", color: "#E0E0E0" },
          { label: "Packets", value: packetCount, color: "#E0E0E0" },
          { label: "Session", value: sessionState, color: sessionColor },
        ].map(({ label, value, color }) => (
          <Grid item xs={6} key={label}>
            <Stack spacing={0.25}>
              <Typography
                sx={{
                  fontSize: "9px",
                  color: "#9E9E9E",
                  textTransform: "uppercase",
                  fontFamily: "inherit",
                }}
              >
                {label}
              </Typography>
              <Typography
                sx={{
                  fontSize: "12px",
                  color,
                  fontFamily: "inherit",
                }}
              >
                {value}
              </Typography>
            </Stack>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default SessionFlowVisualizer;
