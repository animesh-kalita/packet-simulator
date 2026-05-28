import React, { useState, useCallback, useEffect, useRef } from "react";
import { useTeltonikaDecoder } from "./hooks/useTeltonikaDecoder.js";
import { getCodecName } from "./utils/teltonikaParser.js";

import DecoderStatePanel from "./components/DecoderStatePanel.jsx";
import SessionFlowVisualizer from "./components/SessionFlowVisualizer.jsx";
import HexInputPanel from "./components/HexInputPanel.jsx";
import PacketTimeline from "./components/PacketTimeline.jsx";
import ByteStreamViewer from "./components/ByteStreamViewer.jsx";
import AVLTreeView from "./components/AVLTreeView.jsx";
import PacketInspector from "./components/PacketInspector.jsx";
import WarningPanel from "./components/WarningPanel.jsx";
import LogPanel from "./components/LogPanel.jsx";

import {
  Box,
  Button,
  Chip,
  Grid,
  Paper,
  Tab,
  Tabs,
  Typography,
  CssBaseline,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";

// ── Theme ──────────────────────────────────────────────────────────────────
const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#1E1E1E",
      paper: "#252526",
    },
    primary: { main: "#4FC3F7" },
    error: { main: "#F44336" },
    success: { main: "#4CAF50" },
    warning: { main: "#FF9800" },
    info: { main: "#2196F3" },
    divider: "#3C3C3C",
  },
  typography: {
    fontFamily: "'Roboto Mono', 'Fira Code', 'Consolas', monospace",
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: "bold",
          textTransform: "none",
          borderRadius: 4,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontFamily: "'Roboto Mono', 'Fira Code', 'Consolas', monospace",
          fontSize: "12px",
          fontWeight: 500,
          minHeight: 36,
          color: "#9E9E9E",
          "&.Mui-selected": { color: "#1E1E1E" },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          display: "none",
        },
        root: {
          minHeight: 36,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
  },
});

// ── Constants ──────────────────────────────────────────────────────────────
const TABS = [
  { id: "input", label: "Input" },
  { id: "timeline", label: "Timeline" },
  { id: "stream", label: "Byte Stream" },
  { id: "avl", label: "AVL Data" },
  { id: "inspector", label: "Inspector" },
  { id: "logs", label: "Logs" },
];

const ERROR_INJECTORS = [
  { id: "invalid_crc", label: "Invalid CRC" },
  { id: "wrong_codec", label: "Wrong Codec" },
  { id: "wrong_size", label: "Wrong Size" },
  { id: "corrupt_avl_count", label: "Corrupt AVL Count" },
  { id: "truncated", label: "Truncated" },
  { id: "random_byte", label: "Random Byte" },
];

// ── Component ──────────────────────────────────────────────────────────────
function TeltonikaVisualizer() {
  const {
    decoderState,
    sessionState,
    imei,
    codec,
    packetCount,
    positions,
    logs,
    errors,
    bufferSize,
    timeline,
    lastAck,
    connect,
    disconnect,
    reset,
    processHexString,
    processChunked,
    processFragmented,
    injectErrorAndProcess,
    parser,
    getPositionsJSON,
  } = useTeltonikaDecoder();

  const [activeTab, setActiveTab] = useState("input");
  const [hexString, setHexString] = useState("");
  const pollRef = useRef(null);

  useEffect(() => {
    pollRef.current = setInterval(() => {
      const buf = parser.buffer;
      if (buf && buf.length > 0) {
        setHexString(buf.toString("hex").toUpperCase());
      } else {
        setHexString("");
      }
    }, 500);
    return () => clearInterval(pollRef.current);
  }, [parser]);

  const handleErrorInjection = useCallback(
    (errorId) => {
      if (hexString) injectErrorAndProcess(hexString, errorId);
    },
    [hexString, injectErrorAndProcess],
  );

  const handleFileUpload = useCallback(
    (hex) => {
      if (hex) processHexString(hex);
    },
    [processHexString],
  );

  const handleExportJSON = useCallback(() => {
    const json = getPositionsJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "teltonika-parsed.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [getPositionsJSON]);

  const codecName = codec ? getCodecName(codec) : null;
  const isConnected = sessionState !== "DISCONNECTED";

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* ── Page wrapper — no horizontal overflow ── */}
      <Box
        sx={{
          bgcolor: "background.default",
          color: "text.primary",
          px: { xs: 1, sm: 2, md: 2.5 },
          py: 2,
          boxSizing: "border-box",
          overflowX: "hidden",
        }}
      >
        {/* ── Header ── */}
        <Box component="header" sx={{ textAlign: "center", mb: 2 }}>
          <Typography
            variant="h5"
            sx={{ fontWeight: "bold", color: "primary.main", mb: 0.5 }}
          >
            Teltonika Protocol Visualizer
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Netty/Teltonika Protocol Debugger &amp; Packet Analyzer
          </Typography>
        </Box>

        {/* ── Control Bar ── */}
        <Box
          component="nav"
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1.25,
            justifyContent: "center",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Button
            variant="contained"
            color="success"
            onClick={connect}
            disabled={isConnected}
            size="small"
          >
            Connect
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={disconnect}
            disabled={!isConnected}
            size="small"
          >
            Disconnect
          </Button>

          <Button
            variant="contained"
            color="warning"
            onClick={reset}
            size="small"
          >
            Reset
          </Button>

          <Button
            variant="contained"
            color="info"
            onClick={handleExportJSON}
            disabled={positions.length === 0}
            size="small"
          >
            Export JSON
          </Button>

          {lastAck && (
            <Chip
              label={`ACK: ${lastAck.toString("hex").toUpperCase()}`}
              size="small"
              sx={{
                bgcolor: "#1B5E20",
                color: "#81C784",
                fontFamily: "inherit",
                fontWeight: "bold",
                fontSize: "11px",
              }}
            />
          )}
        </Box>

        {/* ── Top Row: State + Flow ── */}
        <Grid container spacing={1.75} sx={{ mb: 1.75 }}>
          <Grid item xs={12} md={6}>
            <DecoderStatePanel
              decoderState={decoderState}
              sessionState={sessionState}
              bufferSize={bufferSize}
              imei={imei}
              codecName={codecName}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <SessionFlowVisualizer
              sessionState={sessionState}
              imei={imei}
              codecName={codecName}
              packetCount={packetCount}
            />
          </Grid>
        </Grid>

        {/* ── Tab Bar ── */}
        <Paper
          component="nav"
          elevation={0}
          sx={{
            bgcolor: "background.paper",
            borderRadius: 2,
            px: 0.5,
            py: 0.5,
            mb: 1.75,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            TabIndicatorProps={{ style: { display: "none" } }}
            sx={{
              minHeight: 36,
              "& .MuiTab-root": {
                minHeight: 36,
                px: 2,
                py: 0,
                borderRadius: 1,
              },
              "& .Mui-selected": {
                bgcolor: "primary.main",
                color: "#1E1E1E !important",
              },
            }}
          >
            {TABS.map((tab) => (
              <Tab key={tab.id} value={tab.id} label={tab.label} />
            ))}
          </Tabs>
        </Paper>

        {/* ── Main Content ── */}
        <Box component="main" sx={{ minHeight: 300 }}>
          {/* Input Tab */}
          {activeTab === "input" && (
            <Grid container spacing={1.75}>
              {/* Left: Hex Input + Warnings */}
              <Grid item xs={12} md={8}>
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 1.75 }}
                >
                  <HexInputPanel
                    onHexSubmit={processHexString}
                    onChunkedSubmit={processChunked}
                    onFragmentedSubmit={processFragmented}
                    onFileUpload={handleFileUpload}
                    isProcessing={sessionState === "DISCONNECTED"}
                  />
                  <WarningPanel errors={errors} logs={logs} />
                </Box>
              </Grid>

              {/* Right: Error Injection */}
              <Grid item xs={12} md={4}>
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
                      color: "primary.main",
                      fontWeight: "bold",
                      fontSize: "15px",
                      pb: 1,
                      mb: 1,
                      borderBottom: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    Error Injection
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.disabled",
                      fontStyle: "italic",
                      display: "block",
                      mb: 1.5,
                    }}
                  >
                    Click to corrupt the current buffer and process it
                  </Typography>

                  <Grid container spacing={1}>
                    {ERROR_INJECTORS.map((inj) => (
                      <Grid item xs={6} key={inj.id}>
                        <Button
                          variant="contained"
                          color="error"
                          fullWidth
                          size="small"
                          disabled={!hexString}
                          onClick={() => handleErrorInjection(inj.id)}
                          sx={{
                            fontSize: "10px",
                            fontWeight: "bold",
                            py: 0.75,
                            bgcolor: "#B71C1C",
                            "&:hover": { bgcolor: "#c62828" },
                            "&.Mui-disabled": {
                              bgcolor: "#3C3C3C",
                              color: "#757575",
                            },
                          }}
                        >
                          {inj.label}
                        </Button>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          )}

          {activeTab === "timeline" && <PacketTimeline timeline={timeline} />}
          {activeTab === "stream" && (
            <ByteStreamViewer hexString={hexString} bufferSize={bufferSize} />
          )}
          {activeTab === "avl" && <AVLTreeView positions={positions} />}
          {activeTab === "inspector" && (
            <PacketInspector hexString={hexString} />
          )}
          {activeTab === "logs" && <LogPanel logs={logs} />}
        </Box>

        {/* ── Footer ── */}
        <Box
          component="footer"
          sx={{
            mt: 2.5,
            pt: 1.5,
            borderTop: "1px solid",
            borderColor: "divider",
            fontSize: "11px",
            color: "text.disabled",
            textAlign: "center",
          }}
        >
          Parser state: {decoderState} | Buffer: {bufferSize} bytes | Packets
          decoded: {packetCount}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default TeltonikaVisualizer;
