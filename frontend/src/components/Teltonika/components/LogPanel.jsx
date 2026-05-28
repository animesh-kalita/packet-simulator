import React from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";

function LogPanel({ logs }) {
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
        Event Log
      </Typography>

      {/* Scrollable log list */}
      <Box sx={{ maxHeight: "400px", overflowY: "auto" }}>
        {!logs || logs.length === 0 ? (
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
            No events logged
          </Typography>
        ) : (
          <Stack spacing={0.375}>
            {logs.map((log, idx) => (
              <Stack
                key={log.id || idx}
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{
                  px: 1,
                  py: 0.625,
                  backgroundColor: "#1E1E1E",
                  borderRadius: "3px",
                  fontSize: "11px",
                }}
              >
                {/* Timestamp */}
                <Typography
                  component="span"
                  sx={{
                    color: "#757575",
                    fontSize: "10px",
                    minWidth: "70px",
                    fontFamily: "inherit",
                    flexShrink: 0,
                  }}
                >
                  {new Date(log.timestamp).toLocaleTimeString()}
                </Typography>

                {/* Event badge */}
                <Chip
                  label={log.event}
                  size="small"
                  sx={{
                    backgroundColor: getEventColor(log.event),
                    color: "white",
                    fontSize: "9px",
                    fontWeight: "bold",
                    fontFamily: "inherit",
                    height: "18px",
                    minWidth: "60px",
                    borderRadius: "3px",
                    flexShrink: 0,
                    "& .MuiChip-label": { px: 0.75 },
                  }}
                />

                {/* Message */}
                <Typography
                  component="span"
                  sx={{
                    color: "#E0E0E0",
                    fontSize: "11px",
                    fontFamily: "inherit",
                    flex: 1,
                  }}
                >
                  {log.message}
                </Typography>
              </Stack>
            ))}
          </Stack>
        )}
      </Box>

      {/* Footer */}
      <Typography
        sx={{
          mt: 1,
          fontSize: "10px",
          color: "#757575",
          textAlign: "right",
          fontFamily: "inherit",
        }}
      >
        {logs.length} entries
      </Typography>
    </Box>
  );
}

function getEventColor(event) {
  switch (event) {
    case "ERROR":
      return "#F44336";
    case "WARNING":
      return "#FF9800";
    case "CONNECTED":
    case "IMEI_RECEIVED":
      return "#4CAF50";
    case "DATA_RECEIVED":
    case "AVL_PARSED":
      return "#2196F3";
    case "HEARTBEAT":
      return "#9C27B0";
    default:
      return "#607D8B";
  }
}

export default LogPanel;
