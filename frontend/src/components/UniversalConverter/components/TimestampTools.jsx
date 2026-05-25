import { useState, useMemo, useCallback } from 'react';
import {
  Accordion, AccordionSummary, AccordionDetails, Typography,
  Box, Stack, TextField, Select, MenuItem, FormControl, InputLabel,
  Button, Grid, Divider, Chip, Paper,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  parseTimestamp, dateToUnix, dateToUnixMs, dateToISO,
  dateToUTCString, dateToLocaleString, getRelativeTime, getCommonTimezones,
} from '../utils/timestamps';
import CopyButton from './CopyButton';
import { TIMESTAMP_PRESETS } from '../utils/constants';

export default function TimestampTools() {
  const [input, setInput] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const parsed = useMemo(() => parseTimestamp(input), [input]);
  const relativeTime = useMemo(() => parsed?.date ? getRelativeTime(parsed.date) : null, [parsed]);

  const handlePreset = useCallback((fn) => {
    setInput(String(fn()));
  }, []);

  return (
    <Accordion variant="outlined" sx={{ mb: 2 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography fontWeight={600}>Timestamp Converter</Typography>
        {parsed && (
          <Chip size="small" label={parsed.source} color="primary" variant="outlined" sx={{ ml: 1.5 }} />
        )}
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          <TextField
            fullWidth
            size="small"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Unix timestamp, ISO date, or date string..."
            sx={{ '& input': { fontFamily: 'monospace' } }}
            aria-label="Enter timestamp"
          />

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {TIMESTAMP_PRESETS.map((preset, i) => (
              <Button key={i} size="small" variant="outlined" onClick={() => handlePreset(preset.getValue)}>
                {preset.label}
              </Button>
            ))}
          </Stack>

          {parsed?.date && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={1.5}>
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 140, fontWeight: 600 }}>
                      Unix (seconds)
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', flex: 1 }}>
                      {dateToUnix(parsed.date)}
                    </Typography>
                    <CopyButton text={dateToUnix(parsed.date)} />
                  </Stack>
                </Box>
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 140, fontWeight: 600 }}>
                      Unix (milliseconds)
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', flex: 1 }}>
                      {dateToUnixMs(parsed.date)}
                    </Typography>
                    <CopyButton text={dateToUnixMs(parsed.date)} />
                  </Stack>
                </Box>
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 140, fontWeight: 600 }}>
                      ISO 8601
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', flex: 1 }}>
                      {dateToISO(parsed.date)}
                    </Typography>
                    <CopyButton text={dateToISO(parsed.date)} />
                  </Stack>
                </Box>
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 140, fontWeight: 600 }}>
                      UTC String
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', flex: 1 }}>
                      {dateToUTCString(parsed.date)}
                    </Typography>
                    <CopyButton text={dateToUTCString(parsed.date)} />
                  </Stack>
                </Box>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel>Timezone</InputLabel>
                        <Select value={timezone} label="Timezone" onChange={e => setTimezone(e.target.value)}>
                          {getCommonTimezones().map(tz => (
                            <MenuItem key={tz} value={tz}>{tz}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', flex: 1 }}>
                        {dateToLocaleString(parsed.date, timezone)}
                      </Typography>
                      <CopyButton text={dateToLocaleString(parsed.date, timezone)} />
                    </Stack>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Relative Time
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {relativeTime}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Stack>
            </Paper>
          )}

          {!parsed && input && (
            <Typography variant="body2" color="error">
              Could not parse as a valid timestamp
            </Typography>
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
