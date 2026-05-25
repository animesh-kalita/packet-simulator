import { useState } from 'react';
import {
  Paper, TextField, Stack, Select, MenuItem, FormControl, InputLabel,
  ToggleButtonGroup, ToggleButton, IconButton, Tooltip, Box, Chip, Alert,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import SettingsIcon from '@mui/icons-material/Settings';
import { INPUT_FORMATS, INPUT_FORMAT_LABELS, BIT_LENGTHS, ENDIANNESS } from '../utils/constants';
import { validateFormat } from '../utils/parsers';
import DetectionBadge from './DetectionBadge';

export default function InputPanel({
  input,
  onInputChange,
  onClear,
  format,
  formatOverride,
  onFormatOverride,
  detection,
  error,
  bytes,
  results,
  settings,
  onUpdateSetting,
}) {
  const [showSettings, setShowSettings] = useState(false);
  const validation = input ? validateFormat(input, formatOverride || format) : { valid: true, error: null };

  return (
    <Paper variant="outlined" sx={{ p: 2.5, mb: 2 }}>
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
          <Box sx={{ fontWeight: 600, fontSize: '0.95rem', mr: 1 }}>
            Input
          </Box>
          {detection ? (
            <DetectionBadge detection={detection} format={format} />
          ) : (
            <Chip
              label={INPUT_FORMAT_LABELS[format] || format}
              size="small"
              variant="outlined"
              color="primary"
            />
          )}
          {formatOverride && (
            <Chip
              label="Override"
              size="small"
              color="warning"
              variant="filled"
              onDelete={() => onFormatOverride(formatOverride)}
              sx={{ fontWeight: 600 }}
            />
          )}
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title="Format & Settings" arrow>
            <IconButton
              size="small"
              onClick={() => setShowSettings(!showSettings)}
              color={showSettings ? 'primary' : 'default'}
              aria-label="Toggle settings"
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        <TextField
          fullWidth
          multiline
          minRows={2}
          maxRows={6}
          value={input}
          onChange={e => onInputChange(e.target.value)}
          placeholder="Type or paste any value here... e.g. 0x1A FF, 10101010, 'Hello', SGVsbG8="
          variant="outlined"
          error={!validation.valid || !!error}
          helperText={error || validation.error || ' '}
          sx={{
            '& .MuiOutlinedInput-root': {
              fontFamily: 'monospace',
              fontSize: '0.9rem',
            },
          }}
          InputProps={{
            endAdornment: input ? (
              <IconButton size="small" onClick={onClear} sx={{ mr: 0.5 }} aria-label="Clear input">
                <ClearIcon fontSize="small" />
              </IconButton>
            ) : null,
          }}
          aria-label="Input value to convert"
        />

        {showSettings && (
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap alignItems="center">
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Format Override</InputLabel>
              <Select
                value={formatOverride || ''}
                label="Format Override"
                onChange={e => onFormatOverride(e.target.value || null)}
              >
                <MenuItem value="">Auto-detect</MenuItem>
                {Object.entries(INPUT_FORMAT_LABELS).map(([key, label]) => (
                  <MenuItem key={key} value={key}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <ToggleButtonGroup
              size="small"
              value={settings.endianness}
              exclusive
              onChange={(_, val) => val && onUpdateSetting('endianness', val)}
              aria-label="Endianness"
            >
              <ToggleButton value={ENDIANNESS.BIG}>Big Endian</ToggleButton>
              <ToggleButton value={ENDIANNESS.LITTLE}>Little Endian</ToggleButton>
            </ToggleButtonGroup>

            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Bit Length</InputLabel>
              <Select
                value={settings.bitLength}
                label="Bit Length"
                onChange={e => onUpdateSetting('bitLength', e.target.value)}
              >
                {BIT_LENGTHS.map(b => (
                  <MenuItem key={b} value={b}>{b}-bit</MenuItem>
                ))}
              </Select>
            </FormControl>

            <ToggleButtonGroup
              size="small"
              value={settings.signed ? 'signed' : 'unsigned'}
              exclusive
              onChange={(_, val) => val && onUpdateSetting('signed', val === 'signed')}
              aria-label="Signed or unsigned"
            >
              <ToggleButton value="unsigned">Unsigned</ToggleButton>
              <ToggleButton value="signed">Signed</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        )}

        {input && bytes && bytes.length > 0 && (
          <Alert severity="info" sx={{ py: 0.5, fontSize: '0.85rem' }}>
            <strong>{bytes.length}</strong> byte{bytes.length !== 1 ? 's' : ''} detected
            {results?.byteStats && <> | Entropy: {results.byteStats.entropy}</>}
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}
