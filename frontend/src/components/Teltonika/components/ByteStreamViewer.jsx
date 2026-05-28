import React, { useState, useMemo } from "react";
import { Box, Button, ButtonGroup, Paper, Typography } from "@mui/material";

// ── Helpers ────────────────────────────────────────────────────────────────
function formatHexWithSpaces(hex) {
  const groups = [];
  for (let i = 0; i < hex.length; i += 2) {
    groups.push(hex.substring(i, i + 2));
  }
  return groups.join(" ");
}

// ── Component ──────────────────────────────────────────────────────────────
function ByteStreamViewer({ hexString, bufferSize }) {
  const [viewMode, setViewMode] = useState("grid");
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const bytes = useMemo(() => {
    if (!hexString) return [];
    const h = hexString.replace(/\s/g, "");
    const result = [];
    for (let i = 0; i < h.length; i += 2) {
      result.push({ index: i / 2, hex: h.substring(i, i + 2) });
    }
    return result;
  }, [hexString]);

  // ── Shared panel wrapper ─────────────────────────────────────────────────
  const PanelWrapper = ({ children }) => (
    <Paper
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        borderRadius: 2,
        p: 2,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          fontSize: "15px",
          fontWeight: "bold",
          color: "primary.main",
          mb: 1.5,
          pb: 1.25,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        Byte Stream Viewer
      </Typography>
      {children}
    </Paper>
  );

  // ── Empty state ──────────────────────────────────────────────────────────
  if (!hexString || !bytes.length) {
    return (
      <PanelWrapper>
        <Typography
          variant="body2"
          sx={{
            color: "text.disabled",
            fontStyle: "italic",
            py: 4,
            textAlign: "center",
          }}
        >
          No data in buffer
        </Typography>
      </PanelWrapper>
    );
  }

  // ── Main view ────────────────────────────────────────────────────────────
  return (
    <PanelWrapper>
      {/* Controls row */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1.5,
        }}
      >
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", fontSize: "11px" }}
        >
          {bytes.length} bytes
        </Typography>

        <ButtonGroup size="small" disableElevation>
          {["grid", "raw"].map((mode) => (
            <Button
              key={mode}
              onClick={() => setViewMode(mode)}
              variant={viewMode === mode ? "contained" : "outlined"}
              sx={{
                fontSize: "10px",
                textTransform: "none",
                fontFamily: "inherit",
                px: 1.25,
                py: 0.4,
                ...(viewMode === mode
                  ? {
                      bgcolor: "primary.main",
                      color: "#1E1E1E",
                      "&:hover": { bgcolor: "primary.dark" },
                    }
                  : { color: "text.secondary", borderColor: "divider" }),
              }}
            >
              {mode === "grid" ? "Grid" : "Raw Hex"}
            </Button>
          ))}
        </ButtonGroup>
      </Box>

      {/* Grid view */}
      {viewMode === "grid" ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(16, 1fr)",
            gap: "3px",
            maxHeight: 300,
            overflowY: "auto",
          }}
        >
          {bytes.map((b) => (
            <Box
              key={b.index}
              onMouseEnter={() => setHoveredIndex(b.index)}
              onMouseLeave={() => setHoveredIndex(null)}
              sx={{
                bgcolor:
                  hoveredIndex === b.index ? "#0D47A1" : "background.default",
                p: "3px",
                borderRadius: "2px",
                textAlign: "center",
                cursor: "pointer",
                transition: "background-color 0.15s",
              }}
            >
              <Typography
                component="span"
                sx={{
                  display: "block",
                  fontSize: "8px",
                  color: "text.disabled",
                }}
              >
                {b.index}
              </Typography>
              <Typography
                component="span"
                sx={{
                  display: "block",
                  fontSize: "11px",
                  color: "#E0E0E0",
                  fontWeight: "bold",
                }}
              >
                {b.hex}
              </Typography>
            </Box>
          ))}
        </Box>
      ) : (
        /* Raw hex view */
        <Box
          sx={{
            bgcolor: "background.default",
            p: 1.5,
            borderRadius: 1,
            wordBreak: "break-all",
            maxHeight: 300,
            overflowY: "auto",
            fontSize: "13px",
          }}
        >
          <Typography component="span" sx={{ color: "#E0E0E0" }}>
            {formatHexWithSpaces(hexString)}
          </Typography>
        </Box>
      )}

      {/* Hover tooltip */}
      {hoveredIndex !== null && (
        <Box
          sx={{
            mt: 1.25,
            px: 1,
            py: 0.75,
            bgcolor: "#0D47A1",
            borderRadius: 1,
            fontSize: "11px",
            color: "white",
          }}
        >
          Index: {hoveredIndex} | Hex: {bytes[hoveredIndex]?.hex} | Dec:{" "}
          {parseInt(bytes[hoveredIndex]?.hex || "00", 16)}
        </Box>
      )}
    </PanelWrapper>
  );
}

export default ByteStreamViewer;
