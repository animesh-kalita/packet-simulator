import React from "react";
import { Box, Paper, Typography, Chip, Stack } from "@mui/material";

function WarningPanel({ errors, logs }) {
  const warnings = (logs || []).filter(
    (l) => l.event === "WARNING" || l.event === "ERROR",
  );

  const hasIssues = warnings.length > 0 || errors.length > 0;

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
          alignItems: "center",
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
          Warnings & Errors
        </Typography>

        {hasIssues && (
          <Chip
            label={warnings.length + errors.length}
            size="small"
            sx={{
              height: 20,
              backgroundColor: "#3A1F1F",
              color: "#F44336",
              fontWeight: 700,
              fontSize: "11px",
              "& .MuiChip-label": {
                px: 1,
              },
            }}
          />
        )}
      </Box>

      {!hasIssues ? (
        <Box
          sx={{
            py: 4,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Typography
            sx={{
              color: "#4CAF50",
              fontStyle: "italic",
              fontSize: "13px",
              textAlign: "center",
              fontFamily: "inherit",
            }}
          >
            No warnings or errors
          </Typography>
        </Box>
      ) : (
        <Stack
          spacing={1}
          sx={{
            maxHeight: 300,
            overflowY: "auto",
            pr: 0.5,
          }}
        >
          {warnings.map((w, idx) => {
            const isError = w.event === "ERROR";

            return (
              <IssueCard
                key={`w-${idx}`}
                type={w.event}
                message={w.message}
                timestamp={w.timestamp}
                isError={isError}
              />
            );
          })}

          {errors.map((err, idx) => (
            <IssueCard
              key={`e-${idx}`}
              type="DECODER_ERR"
              message={typeof err === "string" ? err : err.message}
              isError
            />
          ))}
        </Stack>
      )}
    </Paper>
  );
}

function IssueCard({ type, message, timestamp, isError }) {
  return (
    <Box
      sx={{
        p: 1.25,
        borderRadius: 1,
        borderLeft: "3px solid",
        borderLeftColor: isError ? "#F44336" : "#FF9800",
        backgroundColor: isError ? "#2D1B1B" : "#1E1E1E",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 1,
          mb: 0.75,
          flexWrap: "wrap",
        }}
      >
        <Chip
          label={type}
          size="small"
          sx={{
            height: 18,
            backgroundColor: isError ? "#F44336" : "#FF9800",
            color: "#fff",
            fontSize: "9px",
            fontWeight: 700,
            borderRadius: 0.75,
            "& .MuiChip-label": {
              px: 0.75,
            },
          }}
        />

        {timestamp && (
          <Typography
            sx={{
              fontSize: "9px",
              color: "#757575",
              fontFamily: "inherit",
            }}
          >
            {new Date(timestamp).toLocaleTimeString()}
          </Typography>
        )}
      </Box>

      <Typography
        sx={{
          fontSize: "12px",
          color: "#E0E0E0",
          lineHeight: 1.5,
          wordBreak: "break-word",
          fontFamily: "'Roboto Mono', 'Fira Code', 'Consolas', monospace",
        }}
      >
        {message}
      </Typography>
    </Box>
  );
}

export default WarningPanel;
