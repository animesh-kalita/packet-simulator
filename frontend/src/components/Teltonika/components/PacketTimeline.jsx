import React from "react";
import { Box, Divider, Stack, Typography } from "@mui/material";

const STATUS_ICONS = {
  success: "\u2713",
  error: "\u2717",
  warning: "\u26A0",
  info: "\u2139",
};
const STATUS_COLORS = {
  success: "#4CAF50",
  error: "#F44336",
  warning: "#FF9800",
  info: "#2196F3",
};

function PacketTimeline({ timeline }) {
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
        Packet Timeline
      </Typography>

      {/* Scrollable list */}
      <Box sx={{ maxHeight: "400px", overflowY: "auto" }}>
        {timeline.length === 0 ? (
          <Typography
            sx={{
              color: "#757575",
              fontStyle: "italic",
              py: 3.75,
              px: 2.5,
              textAlign: "center",
              fontFamily: "inherit",
              fontSize: "13px",
            }}
          >
            No events yet. Connect and send data to begin.
          </Typography>
        ) : (
          <Box sx={{ pl: 1 }}>
            {timeline.map((step, idx) => (
              <Stack key={step.id} direction="row" sx={{ mb: 1.75 }}>
                {/* Connector column: dot + vertical line */}
                <Stack alignItems="center" sx={{ mr: 1.75, minWidth: "24px" }}>
                  <Box
                    sx={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      backgroundColor: STATUS_COLORS[step.status] || "#4FC3F7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      color: "white",
                      fontWeight: "bold",
                      flexShrink: 0,
                    }}
                  >
                    {STATUS_ICONS[step.status] || " "}
                  </Box>
                  {idx < timeline.length - 1 && (
                    <Box
                      sx={{
                        width: "2px",
                        flex: 1,
                        backgroundColor: "#3C3C3C",
                        minHeight: "18px",
                      }}
                    />
                  )}
                </Stack>

                {/* Content */}
                <Box sx={{ flex: 1, pb: 0.5 }}>
                  <Typography
                    sx={{
                      fontSize: "10px",
                      fontWeight: "bold",
                      color: "#4FC3F7",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      fontFamily: "inherit",
                    }}
                  >
                    {step.type}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "13px",
                      color: "#E0E0E0",
                      mt: 0.375,
                      lineHeight: 1.4,
                      fontFamily: "inherit",
                    }}
                  >
                    {step.message}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "10px",
                      color: "#757575",
                      mt: 0.5,
                      fontFamily: "inherit",
                    }}
                  >
                    {new Date(step.timestamp).toLocaleTimeString()}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Box>
        )}
      </Box>

      {/* Footer */}
      <Divider sx={{ borderColor: "#3C3C3C", mt: 1.5 }} />
      <Typography
        sx={{
          mt: 1.25,
          fontSize: "11px",
          color: "#9E9E9E",
          textAlign: "right",
          fontFamily: "inherit",
        }}
      >
        {timeline.length} events captured
      </Typography>
    </Box>
  );
}

export default PacketTimeline;
