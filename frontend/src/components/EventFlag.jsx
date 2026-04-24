import { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Switch,
  Paper,
  Grid,
  Chip,
  Tooltip,
  Stack,
  ThemeProvider,
  createTheme,
  CssBaseline,
  InputAdornment,
  Divider,
  alpha,
  useTheme,
} from "@mui/material";

// ─── Event Definitions ───────────────────────────────────────────────────────
const EVENTS = [
  { bit: 0, name: "Digital Input 1", cat: "neutral" },
  { bit: 2, name: "Over Speed Start", cat: "warning" },
  { bit: 3, name: "Over Speed End", cat: "warning" },
  { bit: 6, name: "Violation Status", cat: "warning" },
  { bit: 7, name: "Power Failure", cat: "critical" },
  { bit: 8, name: "Panic Event", cat: "critical" },
  { bit: 9, name: "No GPS", cat: "warning" },
  { bit: 10, name: "Ignition ON", cat: "info" },
  { bit: 11, name: "Digital Input 2", cat: "neutral" },
  { bit: 12, name: "Ignition OFF", cat: "info" },
  { bit: 13, name: "Towing Event", cat: "critical" },
  { bit: 17, name: "Angle Polling", cat: "neutral" },
  { bit: 18, name: "Battery Low", cat: "warning" },
  { bit: 24, name: "Digital Output 1", cat: "neutral" },
  { bit: 25, name: "Accident Event", cat: "critical" },
  { bit: 26, name: "Harsh Acceleration", cat: "warning" },
  { bit: 27, name: "Harsh Braking", cat: "warning" },
  { bit: 28, name: "Harsh Cornering", cat: "warning" },
  { bit: 29, name: "Digital Input 3", cat: "neutral" },
  { bit: 30, name: "Digital Output 2", cat: "neutral" },
];

const DEFINED_BITS = new Set(EVENTS.map((e) => e.bit));
const BIT_MAP = Object.fromEntries(EVENTS.map((e) => [e.bit, e]));

const PRESETS = [
  { label: "132096", value: 132096 },
  { label: "1024", value: 1024 },
  { label: "4096", value: 4096 },
];

// ─── Category → MUI color mapping ────────────────────────────────────────────
const CAT_COLOR = {
  critical: "error",
  warning: "warning",
  info: "info",
  neutral: "success",
};

function useCategoryPalette(theme) {
  const isDark = theme.palette.mode === "dark";

  return {
    critical: {
      bg: isDark
        ? alpha(theme.palette.error.main, 0.15)
        : theme.palette.error.light,
      dot: theme.palette.error.main,
      border: isDark
        ? alpha(theme.palette.error.main, 0.4)
        : theme.palette.error.main,
      light: alpha(theme.palette.error.main, isDark ? 0.12 : 0.06),
    },

    warning: {
      bg: isDark
        ? alpha(theme.palette.warning.main, 0.15)
        : theme.palette.warning.light,
      dot: theme.palette.warning.main,
      border: isDark
        ? alpha(theme.palette.warning.main, 0.4)
        : theme.palette.warning.main,
      light: alpha(theme.palette.warning.main, isDark ? 0.12 : 0.06),
    },

    info: {
      bg: isDark
        ? alpha(theme.palette.info.main, 0.15)
        : theme.palette.info.light,
      dot: theme.palette.info.main,
      border: isDark
        ? alpha(theme.palette.info.main, 0.4)
        : theme.palette.info.main,
      light: alpha(theme.palette.info.main, isDark ? 0.12 : 0.06),
    },

    neutral: {
      bg: isDark
        ? alpha(theme.palette.success.main, 0.15)
        : theme.palette.success.light,
      dot: theme.palette.success.main,
      border: isDark
        ? alpha(theme.palette.success.main, 0.4)
        : theme.palette.success.main,
      light: alpha(theme.palette.success.main, isDark ? 0.12 : 0.06),
    },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isBitSet(val, bit) {
  return (val & (1 << bit)) !== 0;
}

function toggleBit(val, bit, on) {
  return on ? val | (1 << bit) : val & ~(1 << bit);
}

// ─── MUI Theme ────────────────────────────────────────────────────────────────

// ─── Bit Cell ─────────────────────────────────────────────────────────────────
function BitCell({ bit, flagValue, onToggle, catPalette }) {
  const CAT_PALETTE = catPalette;
  const ev = BIT_MAP[bit];
  const set = isBitSet(flagValue, bit);
  const defined = DEFINED_BITS.has(bit);

  let sx = {
    width: 26,
    height: 26,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "4px",
    border: "1px solid",
    fontSize: "0.55rem",
    fontFamily: "monospace",
    fontWeight: 700,
    cursor: defined ? "pointer" : "default",
    userSelect: "none",
    transition: "all 0.12s ease",
    flexShrink: 0,
  };

  if (!defined) {
    sx = {
      ...sx,
      borderColor: "transparent",
      bgcolor: "#F0F0F0",
      color: "#BDBDBD",
    };
  } else if (set) {
    const p = CAT_PALETTE[ev.cat];
    sx = {
      ...sx,
      bgcolor: p.bg,
      borderColor: p.border,
      color: p.dot,
      boxShadow: `0 0 0 1px ${p.border}`,
    };
  } else {
    sx = {
      ...sx,
      bgcolor: "#FAFAFA",
      borderColor: "#E0E0E0",
      color: "#BDBDBD",
      "&:hover": {
        borderColor: "#9E9E9E",
        bgcolor: "#F5F5F5",
        color: "#616161",
      },
    };
  }

  return (
    <Tooltip
      title={ev ? `Bit ${bit}: ${ev.name}` : `Bit ${bit} (unused)`}
      arrow
      placement="top"
    >
      <Box sx={sx} onClick={() => defined && onToggle(bit, !set)}>
        {bit}
      </Box>
    </Tooltip>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, mono, muiColor }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        height: "100%",
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        display="block"
        gutterBottom
      >
        {label}
      </Typography>
      <Typography
        variant="h6"
        sx={{
          fontFamily: mono ? "monospace" : "inherit",
          fontWeight: 600,
          color: muiColor ? `${muiColor}.main` : "text.primary",
          fontSize: "1rem",
          wordBreak: "break-all",
        }}
      >
        {value}
      </Typography>
    </Paper>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EventFlagTool() {
  const theme = useTheme();
  const CAT_PALETTE = useCategoryPalette(theme);
  const [flagValue, setFlagValue] = useState(0);
  const [inputText, setInputText] = useState("");

  // --- Input change (Decoder direction) ---
  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputText(text);
    const num = parseInt(text, 10);
    if (!isNaN(num) && num >= 0) {
      setFlagValue(num);
    } else if (text === "") {
      setFlagValue(0);
    }
  };

  // --- Switch toggle (Encoder direction) ---
  const handleSwitch = (bit, checked) => {
    const newVal = toggleBit(flagValue, bit, checked);
    setFlagValue(newVal);
    setInputText(String(newVal));
  };

  const handlePreset = (val) => {
    setFlagValue(val);
    setInputText(String(val));
  };

  const handleReset = () => {
    setFlagValue(0);
    setInputText("");
  };

  // Derived
  const activeEvents = EVENTS.filter((e) => isBitSet(flagValue, e.bit));
  const criticalCount = activeEvents.filter((e) => e.cat === "critical").length;
  const warningCount = activeEvents.filter((e) => e.cat === "warning").length;

  return (
    <Box>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "background.default",
          p: { xs: 2, md: 4 },
        }}
      >
        {/* ── Header ── */}
        <Box sx={{ mb: 3 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h5" fontWeight={700} letterSpacing="-0.5px">
                Event Flag Tool
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.25 }}
              >
                Decoder · Encoder · 32-bit event flag inspector
              </Typography>
            </Box>
            <Chip
              label="RESET"
              size="small"
              variant="outlined"
              onClick={handleReset}
              sx={{
                fontWeight: 600,
                letterSpacing: "0.05em",
                cursor: "pointer",
              }}
            />
          </Stack>
        </Box>

        {/* ── Input Row ── */}
        <Paper
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            p: 2.5,
            mb: 2.5,
            borderRadius: 3,
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ sm: "center" }}
          >
            <TextField
              label="event_flag value (decimal)"
              value={inputText}
              onChange={handleInputChange}
              type="number"
              inputProps={{ min: 0 }}
              sx={{
                flex: 1,
                "& input": {
                  fontFamily: "monospace",
                  fontSize: "1.3rem",
                  fontWeight: 700,
                },
              }}
              InputProps={{
                endAdornment: flagValue > 0 && (
                  <InputAdornment position="end">
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontFamily="monospace"
                      fontWeight={600}
                    >
                      0x{flagValue.toString(16).toUpperCase().padStart(8, "0")}
                    </Typography>
                  </InputAdornment>
                ),
              }}
              placeholder="e.g. 132096"
              fullWidth
            />
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                mb={0.75}
              >
                Quick presets
              </Typography>
              <Stack direction="row" spacing={1}>
                {PRESETS.map((p) => (
                  <Chip
                    key={p.value}
                    label={p.label}
                    onClick={() => handlePreset(p.value)}
                    variant={flagValue === p.value ? "filled" : "outlined"}
                    color={flagValue === p.value ? "primary" : "default"}
                    sx={{
                      fontFamily: "monospace",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </Paper>

        {/* ── 32-bit Map ── */}
        <Paper
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            p: 2.5,
            mb: 2.5,
            borderRadius: 3,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              fontWeight: 700,
              color: "text.secondary",
              display: "block",
              mb: 1.5,
            }}
          >
            32-bit Map — click a cell to toggle · (bit 31 → 0)
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
            {Array.from({ length: 32 }, (_, i) => 31 - i).map((bit) => (
              <BitCell
                key={bit}
                bit={bit}
                flagValue={flagValue}
                onToggle={handleSwitch}
                catPalette={CAT_PALETTE}
              />
            ))}
          </Box>

          {/* Legend */}
          <Stack direction="row" spacing={2} mt={2} flexWrap="wrap" useFlexGap>
            {Object.entries(CAT_PALETTE).map(([cat, p]) => (
              <Stack
                key={cat}
                direction="row"
                spacing={0.75}
                alignItems="center"
              >
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "2px",
                    bgcolor: p.bg,
                    border: `1px solid ${p.border}`,
                  }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textTransform: "capitalize" }}
                >
                  {cat}
                </Typography>
              </Stack>
            ))}
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "2px",
                  //   bgcolor: "#F0F0F0",
                  border: "1px solid #E0E0E0",
                }}
              />
              <Typography variant="caption" color="text.secondary">
                Unused
              </Typography>
            </Stack>
          </Stack>
        </Paper>

        {/* ── Stats Row ── */}
        <Grid container spacing={2} sx={{ mb: 2.5 }}>
          <Grid item xs={6} sm={3}>
            <StatCard
              label="Decimal Value"
              value={flagValue.toLocaleString()}
              mono
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard
              label="Hex Value"
              value={`0x${flagValue.toString(16).toUpperCase()}`}
              mono
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard
              label="Active Events"
              value={activeEvents.length}
              muiColor={activeEvents.length > 0 ? "primary" : undefined}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard
              label="Critical Alerts"
              value={criticalCount}
              muiColor={criticalCount > 0 ? "error" : undefined}
            />
          </Grid>
        </Grid>

        {/* ── Decoder + Encoder ── */}
        <Grid container spacing={2.5}>
          {/* DECODER — active events list */}
          <Grid item xs={12} md={5}>
            <Paper
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                p: 2.5,
                borderRadius: 3,
                height: "100%",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                mb={2}
              >
                <Typography
                  variant="caption"
                  sx={{
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    fontWeight: 700,
                    color: "text.secondary",
                  }}
                >
                  Decoder — Active Events
                </Typography>
                {activeEvents.length > 0 && (
                  <Chip
                    label={activeEvents.length}
                    size="small"
                    color="primary"
                  />
                )}
              </Stack>

              {activeEvents.length === 0 ? (
                <Box
                  sx={{
                    py: 5,
                    textAlign: "center",
                    borderRadius: 2,
                    border: "1px dashed",
                    borderColor: "divider",
                    color: "text.disabled",
                  }}
                >
                  <Typography variant="body2" fontWeight={500}>
                    No active events
                  </Typography>
                  <Typography variant="caption">
                    Enter a flag value or toggle a switch
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1}>
                  {activeEvents.map((e) => {
                    const p = CAT_PALETTE[e.cat];
                    return (
                      <Box
                        key={e.bit}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: p.bg,
                          border: `1px solid ${p.border}`,
                        }}
                      >
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor: p.dot,
                            flexShrink: 0,
                          }}
                        />
                        <Typography variant="body2" fontWeight={600} flex={1}>
                          {e.name}
                        </Typography>
                        <Chip
                          label={`bit ${e.bit}`}
                          size="small"
                          sx={{
                            fontFamily: "monospace",
                            fontSize: "0.65rem",
                            height: 20,
                          }}
                        />
                        <Tooltip
                          title={`This event contributes +${Math.pow(2, e.bit).toLocaleString()} to the flag`}
                          arrow
                        >
                          <Chip
                            label={`+${Math.pow(2, e.bit).toLocaleString()}`}
                            size="small"
                            color={CAT_COLOR[e.cat]}
                            variant="outlined"
                            sx={{
                              fontFamily: "monospace",
                              fontSize: "0.65rem",
                              height: 20,
                            }}
                          />
                        </Tooltip>
                      </Box>
                    );
                  })}

                  <Divider sx={{ my: 1 }} />
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 1.5,

                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={600}
                    >
                      Sum of active bits
                    </Typography>
                    <Typography
                      variant="body2"
                      fontFamily="monospace"
                      fontWeight={700}
                      color="primary.main"
                    >
                      = {flagValue.toLocaleString()}
                    </Typography>
                  </Box>
                </Stack>
              )}
            </Paper>
          </Grid>

          {/* ENCODER — toggle switches */}
          <Grid item xs={12} md={7}>
            <Paper
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                p: 2.5,
                borderRadius: 3,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontWeight: 700,
                  color: "text.secondary",
                  display: "block",
                  mb: 2,
                }}
              >
                Encoder — Toggle to Build Flag
              </Typography>

              <Grid container spacing={1}>
                {EVENTS.map((e) => {
                  const active = isBitSet(flagValue, e.bit);
                  const p = CAT_PALETTE[e.cat];
                  return (
                    <Grid item xs={12} sm={6} key={e.bit}>
                      <Box
                        onClick={() => handleSwitch(e.bit, !active)}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          p: 1,
                          pl: 1.5,
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: active ? p.border : "divider",
                          bgcolor: active ? p.light : "transparent",
                          cursor: "pointer",
                          transition: "all 0.12s ease",
                          "&:hover": {
                            borderColor: active ? p.dot : "grey.400",
                            bgcolor: active ? p.bg : alpha("#000", 0.02),
                          },
                        }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            fontWeight={active ? 700 : 400}
                            sx={{
                              color: active ? p.dot : "text.primary",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {e.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.disabled"
                            fontFamily="monospace"
                            display="block"
                          >
                            bit {e.bit} · 2^{e.bit} ={" "}
                            {Math.pow(2, e.bit).toLocaleString()}
                          </Typography>
                        </Box>
                        <Switch
                          size="small"
                          checked={active}
                          onChange={(ev) => {
                            ev.stopPropagation();
                            handleSwitch(e.bit, !active);
                          }}
                          color={CAT_COLOR[e.cat]}
                          onClick={(ev) => ev.stopPropagation()}
                        />
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>

              {/* Encoded value display */}
              <Box
                sx={{
                  mt: 2,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: "#EFF6FF",
                  border: "1px solid #BFDBFE",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography
                  variant="caption"
                  color="primary.dark"
                  fontWeight={600}
                >
                  Generated event_flag
                </Typography>
                <Typography
                  variant="body1"
                  fontFamily="monospace"
                  fontWeight={800}
                  color="primary.main"
                >
                  {flagValue.toLocaleString()}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
