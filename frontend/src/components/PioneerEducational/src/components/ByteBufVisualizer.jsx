import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "@mui/material/styles";
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Slider,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  PlayArrow,
  Pause,
  Stop,
  Replay,
  FastForward,
  FastRewind,
  SkipPrevious as StepBackward,
  SkipNext as StepForward,
} from "@mui/icons-material";
import useBytesParser from "../hooks/useBytesParser";

const ByteBufVisualizer = ({ packetData, onStepUpdate }) => {
  const {
    bytes,
    position,
    stepHistory,
    parseStep,
    resetParser,
    setBreakpoint,
    breakpoints,
  } = useBytesParser(packetData);
  const theme = useTheme();

  const stepCountRef = useRef(0);
  useEffect(() => {
    if (
      onStepUpdate &&
      stepHistory.length > 0 &&
      stepHistory.length !== stepCountRef.current
    ) {
      stepCountRef.current = stepHistory.length;
      onStepUpdate(
        stepHistory,
        position,
        stepHistory[stepHistory.length - 1],
        bytes,
      );
    }
  });
  // intentionally no deps: we want to compare ref on every render without re-triggering
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showBinary, setShowBinary] = useState(true);
  const [showASCII, setShowASCII] = useState(true);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const animationRef = useRef(null);

  const stepForward = () => {
    if (!isPlaying) {
      parseStep();
    }
  };

  const stepBackward = () => {
    if (!isPlaying && stepHistory.length > 0) {
      resetParser();
      for (let i = 0; i < stepHistory.length - 1; i++) {
        parseStep();
      }
    }
  };

  const reset = () => {
    setIsPlaying(false);
    resetParser();
  };

  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        clearInterval(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    if (bytes.length === 0) return;

    animationRef.current = setInterval(() => {
      const hasMore = parseStep();
      if (!hasMore) {
        clearInterval(animationRef.current);
        animationRef.current = null;
        setIsPlaying(false);
      }
    }, 1000 / speed);

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isPlaying, speed, bytes.length, parseStep]);

  const playPause = () => {
    setIsPlaying((prev) => !prev);
  };

  if (!bytes || bytes.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary">
          No packet data loaded
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Enter hex data in the Packet Input Panel above to begin
        </Typography>
      </Box>
    );
  }

  const getByteColor = (index) => {
    if (breakpoints.includes(index)) return theme.palette.warning.light;
    if (index < position) return theme.palette.success.light;
    if (index === position) return theme.palette.primary.light;
    return theme.palette.action.hover;
  };

  const getByteTooltip = (index, byteValue) => {
    const byte = bytes[index];
    let tooltip = `Index: ${index}\\n`;
    tooltip += `Hex: ${byte.toString(16).toUpperCase().padStart(2, "0")}\\n`;
    tooltip += `Dec: ${byte}\\n`;
    tooltip += `Bin: ${byte.toString(2).padStart(8, "0")}`;

    if (showASCII && byte >= 32 && byte <= 126) {
      tooltip += `\\nASCII: '${String.fromCharCode(byte)}'`;
    }

    if (index < position) {
      tooltip += "\\n✓ Consumed";
    } else if (index === position) {
      tooltip += "\\n→ Current Position";
    } else {
      tooltip += "\\n○ Remaining";
    }

    if (breakpoints.includes(index)) {
      tooltip += "\\n⚠ Breakpoint";
    }

    return tooltip;
  };

  return (
    <Paper elevation={3} sx={{ minHeight: 400 }}>
      <Box p={3}>
        <Typography variant="h5" gutterBottom>
          Netty ByteBuf Visualizer
        </Typography>

        {/* Controls */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
          flexWrap="wrap"
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Tooltip title="Step Backward">
              <IconButton
                onClick={stepBackward}
                disabled={!isPlaying && stepHistory.length === 0}
              >
                <StepBackward />
              </IconButton>
            </Tooltip>
            <Tooltip title="Step Forward">
              <IconButton onClick={stepForward} disabled={isPlaying}>
                <StepForward />
              </IconButton>
            </Tooltip>
            <Tooltip title={isPlaying ? "Pause" : "Play"}>
              <IconButton onClick={playPause}>
                {isPlaying ? <Pause /> : <PlayArrow />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Stop">
              <IconButton onClick={reset}>
                <Stop />
              </IconButton>
            </Tooltip>
            <Tooltip title="Replay">
              <IconButton onClick={reset}>
                <Replay />
              </IconButton>
            </Tooltip>
          </Box>

          <Box display="flex" alignItems="center" gap={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={showBinary}
                  onChange={(e) => setShowBinary(e.target.checked)}
                />
              }
              label="Binary"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={showASCII}
                  onChange={(e) => setShowASCII(e.target.checked)}
                />
              }
              label="ASCII"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={showAnnotations}
                  onChange={(e) => setShowAnnotations(e.target.checked)}
                />
              }
              label="Annotations"
            />
          </Box>

          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="body2">Speed:</Typography>
            <Slider
              value={speed}
              min={0.5}
              max={4}
              step={0.5}
              valueLabelDisplay="auto"
              onChange={(e, value) => setSpeed(value)}
              sx={{ width: 150 }}
            />
            <Typography variant="body2">{speed}x</Typography>
          </Box>
        </Box>

        {/* Byte Visualization */}
        <Box sx={{ overflowX: "auto", mb: 3 }}>
          <Table stickyHeader aria-label="byte table">
            <TableHead>
              <TableRow>
                <TableCell>Index</TableCell>
                {showBinary && <TableCell align="center">Binary</TableCell>}
                <TableCell align="center">Hex</TableCell>
                <TableCell align="center">Decimal</TableCell>
                {showASCII && <TableCell align="center">ASCII</TableCell>}
                {showAnnotations && (
                  <TableCell align="center">Annotation</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {bytes.map((byte, index) => (
                <TableRow
                  key={index}
                  sx={{ backgroundColor: getByteColor(index) }}
                >
                  <TableCell>{index}</TableCell>
                  {showBinary && (
                    <TableCell align="center">
                      {byte.toString(2).padStart(8, "0")}
                    </TableCell>
                  )}
                  <TableCell align="center">
                    <Tooltip title={getByteTooltip(index, byte)}>
                      {byte.toString(16).toUpperCase().padStart(2, "0")}
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">{byte}</TableCell>
                  {showASCII && (
                    <TableCell align="center">
                      {byte >= 32 && byte <= 126
                        ? String.fromCharCode(byte)
                        : "."}
                    </TableCell>
                  )}
                  {showAnnotations && (
                    <TableCell align="center">
                      {index < position && "Consumed"}
                      {index === position && "→ Current"}
                      {index > position && "○ Remaining"}
                      {breakpoints.includes(index) && "⚠ BP"}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

        {/* Current Operation Info */}
        {stepHistory.length > 0 && (
          <Box
            mt={3}
            p={2}
            sx={{ bgcolor: "action.selected", borderRadius: 1 }}
          >
            <Typography variant="h6" gutterBottom>
              Current Operation
            </Typography>
            <Typography variant="body1">
              {stepHistory[stepHistory.length - 1].description}
            </Typography>
            <Box mt={2} display="flex" gap={2}>
              <Button variant="outlined" size="small" onClick={stepForward}>
                Next Step
              </Button>
              <Button variant="outlined" size="small" onClick={reset}>
                Reset
              </Button>
            </Box>
          </Box>
        )}

        {/* Parser Stats */}
        <Box
          mt={3}
          display="flex"
          justifyContent="space-around"
          textAlign="center"
        >
          <Box>
            <Typography variant="body2" color="text.secondary">
              Position
            </Typography>
            <Typography variant="h6">
              {position}/{bytes.length}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Progress
            </Typography>
            <Typography variant="h6">
              {Math.floor((position / bytes.length) * 100)}%
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Remaining
            </Typography>
            <Typography variant="h6">{bytes.length - position}</Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default ByteBufVisualizer;
