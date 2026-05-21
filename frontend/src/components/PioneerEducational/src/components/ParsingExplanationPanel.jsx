import React from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Typography,
  Paper,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  HelpOutline,
  LightbulbOutlined as LightbulbOutline,
  InfoOutlined,
} from '@mui/icons-material';

const ParsingExplanationPanel = ({ currentStep }) => {
  const theme = useTheme();

  if (!currentStep) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary">
          No parsing step selected
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Step through the ByteBuf Visualizer to see detailed explanations
        </Typography>
      </Box>
    );
  }

  const hasRichExplanations = currentStep.explanations && currentStep.explanations.length > 0;

  return (
    <Paper elevation={3}>
      <Box p={3}>
        <Typography variant="h5" gutterBottom>
          Parsing Explanation
        </Typography>

        {/* Step Information */}
        <Box mb={3} p={2} sx={{ bgcolor: 'action.selected', borderRadius: 1 }}>
          <Typography variant="h6">
            Step {currentStep.step || '?'}: {currentStep.title || 'Unknown'}
          </Typography>
        </Box>

        {/* Simple Explanation (from parser output) */}
        {currentStep.explanation && (
          <Box mb={3} p={2} sx={{ bgcolor: 'action.selected', borderRadius: 1 }}>
            <Box display="flex" alignItems="center" mb={1}>
              <InfoOutlined color="info" sx={{ mr: 1 }} />
              <Typography variant="h6">Explanation</Typography>
            </Box>
            <Typography variant="body1" sx={{ ml: 1 }}>
              {currentStep.explanation}
            </Typography>
          </Box>
        )}

        {/* Rich Explanations */}
        {hasRichExplanations && currentStep.explanations.map((exp, index) => (
          <Box key={index} sx={{ mb: 3 }}>
            <Box display="flex" alignItems="center" mb={1}>
              <IconButton size="small" color="info">
                <InfoOutlined />
              </IconButton>
              <Typography variant="h6" sx={{ ml: 2 }}>
                {exp.level ? exp.level.charAt(0).toUpperCase() + exp.level.slice(1) : ''} Explanation
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ ml: 3 }}>
              {exp.content}
            </Typography>
          </Box>
        ))}

        {/* Parsed Values */}
        {currentStep.values && Object.keys(currentStep.values).length > 0 && (
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Parsed Values
            </Typography>
            {Object.entries(currentStep.values).map(([key, value]) => (
              <Box key={key} sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                <Typography variant="body2" fontWeight="medium" sx={{ minWidth: 160 }}>
                  {key}:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {String(value)}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Visual Aids */}
        {currentStep.visualAids && currentStep.visualAids.length > 0 && (
          <Box mt={4}>
            <Typography variant="h6" gutterBottom>
              Visual Aids
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {currentStep.visualAids.map((aid, index) => (
                <Box key={index} sx={{ minWidth: 200, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {aid.label}
                  </Typography>
                  <Box sx={{
                    height: 60,
                    bgcolor: 'action.hover',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'monospace',
                    px: 1,
                  }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {aid.content}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Common Pitfalls */}
        {currentStep.commonPitfalls && currentStep.commonPitfalls.length > 0 && (
          <Box mt={4} p={2} sx={{ bgcolor: 'warning.light', borderRadius: 1, color: 'warning.contrastText' }}>
            <Typography variant="h6" gutterBottom>
              Common Pitfalls & Gotchas
            </Typography>
            <Box>
              {currentStep.commonPitfalls.map((pitfall, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Typography variant="body2" sx={{ flexShrink: 0 }}>⚠</Typography>
                  <Typography variant="body1">{pitfall}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Real-world Example */}
        {currentStep.realWorldExample && (
          <Box mt={4} p={2} sx={{ bgcolor: 'success.light', borderRadius: 1, color: 'success.contrastText' }}>
            <Typography variant="h6" gutterBottom>
              Real-world Example
            </Typography>
            <Typography variant="body1">
              {currentStep.realWorldExample}
            </Typography>
          </Box>
        )}

        {/* Practice Exercise */}
        {currentStep.practiceExercise && (
          <Box mt={4} p={2} sx={{ bgcolor: 'info.light', borderRadius: 1, color: 'info.contrastText' }}>
            <Typography variant="h6" gutterBottom>
              Practice Exercise
            </Typography>
            <Typography variant="body1">
              {currentStep.practiceExercise.description}
            </Typography>
            {currentStep.practiceExercise.hint && (
              <Box mt={2} p={1} sx={{ bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Hint:
                </Typography>
                <Typography variant="body1">
                  {currentStep.practiceExercise.hint}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default ParsingExplanationPanel;