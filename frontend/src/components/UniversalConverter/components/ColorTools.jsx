import { useState, useMemo } from 'react';
import {
  Accordion, AccordionSummary, AccordionDetails, Typography,
  Box, Stack, TextField, Paper, Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { parseColor, hexToRgb, rgbToHex, rgbToHsl, hslToRgb, rgbaToHex } from '../utils/colors';
import CopyButton from './CopyButton';

function ColorSwatch({ color }) {
  if (!color) return null;
  const { r, g, b, a = 1 } = color;
  return (
    <Box
      sx={{
        width: 48,
        height: 48,
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: `rgba(${r}, ${g}, ${b}, ${a})`,
        flexShrink: 0,
      }}
    />
  );
}

export default function ColorTools() {
  const [input, setInput] = useState('');
  const parsed = useMemo(() => {
    if (!input || input.trim() === '') return null;
    return parseColor(input.trim());
  }, [input]);

  const hsl = useMemo(() => {
    if (!parsed) return null;
    return rgbToHsl(parsed.r, parsed.g, parsed.b);
  }, [parsed]);

  const complementary = useMemo(() => {
    if (!hsl) return null;
    const compH = (hsl.h + 180) % 360;
    return rgbToHex(hslToRgb(compH, hsl.s, hsl.l).r, hslToRgb(compH, hsl.s, hsl.l).g, hslToRgb(compH, hsl.s, hsl.l).b);
  }, [hsl]);

  return (
    <Accordion variant="outlined" sx={{ mb: 2 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography fontWeight={600}>Color Converter</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          <TextField
            fullWidth
            size="small"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="#FF0000 or rgb(255,0,0) or hsl(0,100%,50%)"
            sx={{ '& input': { fontFamily: 'monospace' } }}
            aria-label="Enter color value"
          />

          {parsed && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <ColorSwatch color={parsed} />
                  <Box>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      R: {parsed.r} G: {parsed.g} B: {parsed.b}
                    </Typography>
                    {parsed.a !== undefined && parsed.a !== 1 && (
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        Alpha: {parsed.a}
                      </Typography>
                    )}
                  </Box>
                  {complementary && (
                    <Box sx={{ ml: 'auto', textAlign: 'center' }}>
                      <Box
                        sx={{
                          width: 32, height: 32, borderRadius: 1,
                          border: '1px solid', borderColor: 'divider',
                          backgroundColor: complementary, mx: 'auto', mb: 0.5,
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">Complement</Typography>
                    </Box>
                  )}
                </Stack>

                <Divider />

                <Stack spacing={1}>
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60, fontWeight: 600 }}>
                        HEX
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', flex: 1 }}>
                        {rgbToHex(parsed.r, parsed.g, parsed.b)}
                      </Typography>
                      <CopyButton text={rgbToHex(parsed.r, parsed.g, parsed.b)} />
                    </Stack>
                  </Box>
                  {parsed.a !== 1 && (
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60, fontWeight: 600 }}>
                          HEXA
                        </Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', flex: 1 }}>
                          {rgbaToHex(parsed.r, parsed.g, parsed.b, parsed.a)}
                        </Typography>
                        <CopyButton text={rgbaToHex(parsed.r, parsed.g, parsed.b, parsed.a)} />
                      </Stack>
                    </Box>
                  )}
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60, fontWeight: 600 }}>
                        RGB
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', flex: 1 }}>
                        rgb({parsed.r}, {parsed.g}, {parsed.b})
                      </Typography>
                      <CopyButton text={`rgb(${parsed.r}, ${parsed.g}, ${parsed.b})`} />
                    </Stack>
                  </Box>
                  {hsl && (
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60, fontWeight: 600 }}>
                          HSL
                        </Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', flex: 1 }}>
                          hsl({hsl.h}, {hsl.s}%, {hsl.l}%)
                        </Typography>
                        <CopyButton text={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`} />
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </Stack>
            </Paper>
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
