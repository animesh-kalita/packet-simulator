import React, { useState, useEffect, useRef } from "react";
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Typography,
  Paper,
  Button,
  Tooltip,
  IconButton,
  StepIcon,
  StepLabel,
  LinearProgress,
} from "@mui/material";
import {
  PlayArrow,
  Pause,
  Stop,
  SkipPrevious as StepBackward,
  SkipNext as StepForward,
  Replay,
} from "@mui/icons-material";

const PacketTimeline = ({ parsingSteps, currentStepIndex, onStepChange }) => {
  const theme = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        clearInterval(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    if (parsingSteps.length === 0 || currentStepIndex >= parsingSteps.length - 1) {
      setIsPlaying(false);
      return;
    }

    animationRef.current = setInterval(() => {
      const next = currentStepIndex + 1;
      onStepChange(next);
      if (next >= parsingSteps.length - 1) {
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
  }, [isPlaying, speed, parsingSteps.length]);

  const playPause = () => {
    setIsPlaying(prev => !prev);
  };

  const stepForward = () => {
    if (!isPlaying && currentStepIndex < parsingSteps.length - 1) {
      onStepChange(currentStepIndex + 1);
    }
  };

  const stepBackward = () => {
    if (!isPlaying && currentStepIndex > 0) {
      onStepChange(currentStepIndex - 1);
    }
  };

  const reset = () => {
    setIsPlaying(false);
    onStepChange(0);
  };

  if (!parsingSteps || parsingSteps.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary">
          No parsing steps available
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Load a packet in the Packet Input Panel and step through the ByteBuf Visualizer to generate steps
        </Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={3}>
      <Box p={3}>
        <Typography variant="h5" gutterBottom>
          Parsing Timeline
        </Typography>

        {/* Controls */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
          flexWrap="wrap"
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Tooltip title="Step Backward">
              <IconButton
                onClick={stepBackward}
                disabled={currentStepIndex === 0 || isPlaying}
              >
                <StepBackward />
              </IconButton>
            </Tooltip>
            <Tooltip title="Step Forward">
              <IconButton
                onClick={stepForward}
                disabled={
                  currentStepIndex >= parsingSteps.length - 1 || isPlaying
                }
              >
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
            <Typography variant="body2">Speed:</Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setSpeed(Math.max(0.5, speed - 0.5))}
            >
              −
            </Button>
            <Typography
              variant="body2"
              sx={{ minWidth: 30, textAlign: "center" }}
            >
              {speed}x
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setSpeed(Math.min(4, speed + 0.5))}
            >
              +
            </Button>
          </Box>
        </Box>

        {/* Progress Indicator */}
        <Box mb={3}>
          <LinearProgress
            variant="determinate"
            value={(currentStepIndex / (parsingSteps.length - 1)) * 100}
            sx={{ height: 4 }}
          />
          <Box mt={1} display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              Step {currentStepIndex + 1} of {parsingSteps.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.floor((currentStepIndex / (parsingSteps.length - 1)) * 100)}
              % Complete
            </Typography>
          </Box>
        </Box>

        {/* Timeline Steps */}
        <Box sx={{ position: "relative" }}>
          {/* Vertical connector line */}
          <Box
            sx={{
              position: "absolute",
              left: 24,
              top: 0,
              bottom: 0,
              width: 2,
              bgcolor: "divider",
            }}
          />

          {/* Steps */}
          {parsingSteps.map((step, index) => (
            <Box key={index} sx={{ position: "relative", pl: 32, mb: 4 }}>
              {/* Step connector (except for last step) */}
              {index < parsingSteps.length - 1 && (
                <Box
              sx={{
                position: "absolute",
                left: 20,
                top: index * 64 + 24,
                height: 24,
                width: 2,
                bgcolor: index < currentStepIndex ? theme.palette.success.main : theme.palette.action.disabledBackground,
                  }}
                />
              )}

              {/* Step icon */}
              <StepIcon
                sx={{
                  color:
                    index < currentStepIndex
                      ? theme.palette.success.main
                      : index === currentStepIndex
                        ? theme.palette.primary.main
                        : theme.palette.action.disabled,
                  width: 24,
                  height: 24,
                }}
                index={index}
                active={index === currentStepIndex}
                completed={index < currentStepIndex}
              />

              {/* Step label */}
              <StepLabel
                sx={{
                  pointerEvents: "none",
                  fontWeight: index === currentStepIndex ? "bold" : "normal",
                }}
                label={step.title}
                optional={
                  index === currentStepIndex ? (
                    <Box sx={{ ml: 1 }}>
                      <Tooltip title="Current Step">
                        <Typography variant="caption" color="primary">
                          ●
                        </Typography>
                      </Tooltip>
                    </Box>
                  ) : undefined
                }
              >
                <Typography
                  variant="body1"
                  color={
                    index === currentStepIndex ? "primary.main" : "text.primary"
                  }
                >
                  {step.description}
                </Typography>
              </StepLabel>

              {/* Step details (expandable on hover/click) */}
              <Box
                sx={{
                  mt: 1,
                  display: index === currentStepIndex ? "block" : "none",
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Details:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ ml: 2, color: "text.secondary" }}
                >
                  {step.details}
                </Typography>
                {step.values && (
                  <Box mt={1}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      Parsed Values:
                    </Typography>
                    <Box sx={{ ml: 2 }}>
                      {Object.entries(step.values).map(([key, value]) => (
                        <Typography key={key} variant="body2" sx={{ mb: 0.5 }}>
                          <Typography fontWeight="medium" sx={{ mr: 1 }}>
                            {key}:
                          </Typography>
                          {value}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          ))}
        </Box>

        {/* Current Step Explanation */}
        {parsingSteps[currentStepIndex] && (
          <Box mt={3} p={2} sx={{ bgcolor: 'action.selected', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              Current Step Explanation
            </Typography>
            <Typography variant="body1">
              {parsingSteps[currentStepIndex].explanation}
            </Typography>
            <Box mt={2} display="flex" gap={2}>
              <Button
                variant="outlined"
                size="small"
                onClick={stepBackward}
                disabled={currentStepIndex === 0}
              >
                Previous
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={stepForward}
                disabled={currentStepIndex >= parsingSteps.length - 1}
              >
                Next
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default PacketTimeline;
