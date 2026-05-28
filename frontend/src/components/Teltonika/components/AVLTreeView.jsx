import React from "react";
import { Box, Chip, Divider, Grid, Paper, Typography } from "@mui/material";

// ── Field sub-component ────────────────────────────────────────────────────
function Field({ label, value }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      <Typography
        variant="caption"
        sx={{
          fontSize: "9px",
          color: "text.secondary",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontSize: "12px", color: "#E0E0E0" }}>
        {value ?? "N/A"}
      </Typography>
    </Box>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
function AVLTreeView({ positions }) {
  return (
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
      {/* Title */}
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
        AVL Data
      </Typography>

      {/* Empty state */}
      {!positions || positions.length === 0 ? (
        <Typography
          variant="body2"
          sx={{
            color: "text.disabled",
            fontStyle: "italic",
            py: 4,
            textAlign: "center",
          }}
        >
          No AVL records parsed yet
        </Typography>
      ) : (
        /* Record list */
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            maxHeight: 500,
            overflowY: "auto",
            pr: 0.5,
          }}
        >
          {positions.map((pos, idx) => {
            const attrs =
              pos.attributes instanceof Map
                ? Object.fromEntries(pos.attributes)
                : pos.attributes || {};

            return (
              <Paper
                key={idx}
                elevation={0}
                sx={{
                  bgcolor: "background.default",
                  borderRadius: 1.5,
                  p: 1.75,
                  border: "1px solid",
                  borderColor: "divider",
                  borderLeft: "3px solid",
                  borderLeftColor: "success.main",
                }}
              >
                {/* Record header */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1.25,
                    pb: 1,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: "bold",
                      color: "success.main",
                      fontSize: "13px",
                    }}
                  >
                    Record #{idx + 1}
                  </Typography>

                  <Chip
                    label={pos.valid ? "VALID" : "INVALID"}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: "9px",
                      fontWeight: "bold",
                      borderRadius: "3px",
                      bgcolor: pos.valid ? "success.main" : "error.main",
                      color: "white",
                      "& .MuiChip-label": { px: 1 },
                    }}
                  />
                </Box>

                {/* Core fields grid */}
                <Grid container spacing={1}>
                  {[
                    {
                      label: "Timestamp",
                      value: pos.timestamp
                        ? new Date(pos.timestamp).toISOString()
                        : "N/A",
                    },
                    { label: "Priority", value: attrs.priority ?? "N/A" },
                    { label: "Latitude", value: pos.latitude?.toFixed(7) },
                    { label: "Longitude", value: pos.longitude?.toFixed(7) },
                    {
                      label: "Altitude",
                      value: pos.altitude != null ? `${pos.altitude} m` : "N/A",
                    },
                    {
                      label: "Speed",
                      value: pos.speed != null ? `${pos.speed} km/h` : "N/A",
                    },
                    {
                      label: "Course",
                      value:
                        pos.course != null
                          ? `${pos.course.toFixed(1)}\u00B0`
                          : "N/A",
                    },
                    { label: "Satellites", value: pos.satellites },
                  ].map(({ label, value }) => (
                    <Grid item xs={6} key={label}>
                      <Field label={label} value={value} />
                    </Grid>
                  ))}
                </Grid>

                {/* Alarms */}
                {pos.alarms && pos.alarms.length > 0 && (
                  <Box
                    sx={{
                      mt: 1.5,
                      pt: 1.25,
                      borderTop: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: "10px",
                        color: "text.secondary",
                        textTransform: "uppercase",
                        display: "block",
                        mb: 0.75,
                      }}
                    >
                      Alarms
                    </Typography>
                    <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                      {pos.alarms.map((a, i) => (
                        <Chip
                          key={i}
                          label={a}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: "10px",
                            bgcolor: "error.main",
                            color: "white",
                            borderRadius: "4px",
                            "& .MuiChip-label": { px: 1 },
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* IO Elements */}
                {Object.keys(attrs).length > 0 && (
                  <Box
                    sx={{
                      mt: 1.5,
                      pt: 1.25,
                      borderTop: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: "10px",
                        color: "text.secondary",
                        textTransform: "uppercase",
                        display: "block",
                        mb: 0.75,
                      }}
                    >
                      IO Elements ({Object.keys(attrs).length})
                    </Typography>

                    <Grid container spacing={0.5}>
                      {Object.entries(attrs)
                        .filter(([k]) => k !== "priority")
                        .map(([k, v]) => (
                          <Grid item key={k}>
                            <Box
                              sx={{
                                bgcolor: "background.paper",
                                px: 1,
                                py: 0.5,
                                borderRadius: 0.75,
                                display: "flex",
                                flexDirection: "column",
                                minWidth: 140,
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: "9px",
                                  color: "text.secondary",
                                }}
                              >
                                {k}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: "10px",
                                  color: "#E0E0E0",
                                  mt: "2px",
                                }}
                              >
                                {String(v)}
                              </Typography>
                            </Box>
                          </Grid>
                        ))}
                    </Grid>
                  </Box>
                )}
              </Paper>
            );
          })}
        </Box>
      )}
    </Paper>
  );
}

export default AVLTreeView;
