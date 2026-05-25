import { Chip, Tooltip } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { INPUT_FORMAT_LABELS, INPUT_FORMAT_COLORS } from '../utils/constants';

export default function DetectionBadge({ detection, format }) {
  if (!detection) {
    return (
      <Chip
        label={INPUT_FORMAT_LABELS[format] || format}
        size="small"
        variant="outlined"
        sx={{
          borderColor: INPUT_FORMAT_COLORS[format] || '#999',
          color: INPUT_FORMAT_COLORS[format] || '#999',
          fontWeight: 600,
          fontFamily: 'monospace',
        }}
      />
    );
  }

  const { type, confidence, label } = detection;
  const color = INPUT_FORMAT_COLORS[type] || '#999';
  const confidenceLabel = confidence >= 90 ? 'High' : confidence >= 70 ? 'Medium' : 'Low';

  return (
    <Tooltip title={`Detected: ${label || type} (${confidence}% confidence)`} arrow>
      <Chip
        icon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
        label={`${INPUT_FORMAT_LABELS[type] || type} (${confidence}%)`}
        size="small"
        variant="outlined"
        sx={{
          borderColor: color,
          color: color,
          fontWeight: 600,
          fontFamily: 'monospace',
          '& .MuiChip-icon': { color },
        }}
      />
    </Tooltip>
  );
}
