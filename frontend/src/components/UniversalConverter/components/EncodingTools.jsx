import { useState } from 'react';
import {
  Accordion, AccordionSummary, AccordionDetails, Typography,
  Box, Stack, TextField, ToggleButtonGroup, ToggleButton, Paper, Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { urlEncode, urlDecode, bytesToBase64, base64ToBytes, utf8ToBytes, asciiToBytes } from '../utils/converters';
import { bytesToUTF8 } from '../utils/converters';
import { bytesToHex } from '../utils/converters';
import CopyButton from './CopyButton';

export default function EncodingTools() {
  const [mode, setMode] = useState('url');
  const [input, setInput] = useState('');

  const result = (() => {
    if (!input) return { output: '', error: null };

    switch (mode) {
      case 'url': {
        const encoded = urlEncode(input);
        return { output: encoded, error: null };
      }
      case 'url-decode': {
        const decoded = urlDecode(input);
        return { output: decoded || '', error: decoded === null ? 'Invalid URL encoding' : null };
      }
      case 'b64-encode': {
        const bytes = utf8ToBytes(input);
        return { output: bytesToBase64(bytes), error: null };
      }
      case 'b64-decode': {
        const bytes = base64ToBytes(input);
        if (!bytes) return { output: '', error: 'Invalid Base64 input' };
        return { output: bytesToUTF8(bytes) || bytesToHex(bytes), error: null };
      }
      default:
        return { output: '', error: null };
    }
  })();

  return (
    <Accordion variant="outlined" sx={{ mb: 2 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography fontWeight={600}>Encoding Utilities</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          <ToggleButtonGroup
            size="small"
            value={mode}
            exclusive
            onChange={(_, val) => val && setMode(val)}
            aria-label="Encoding mode"
          >
            <ToggleButton value="url">URL Encode</ToggleButton>
            <ToggleButton value="url-decode">URL Decode</ToggleButton>
            <ToggleButton value="b64-encode">Base64 Encode</ToggleButton>
            <ToggleButton value="b64-decode">Base64 Decode</ToggleButton>
          </ToggleButtonGroup>

          <TextField
            fullWidth
            size="small"
            multiline
            minRows={2}
            maxRows={4}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={
              mode === 'url' ? 'Text to URL-encode...' :
              mode === 'url-decode' ? 'URL-encoded string...' :
              mode === 'b64-encode' ? 'Text to Base64-encode...' :
              'Base64 string to decode...'
            }
            sx={{ '& textarea': { fontFamily: 'monospace' } }}
            aria-label="Encoding input"
          />

          {result.output && (
            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Stack direction="row" alignItems="flex-start" spacing={1}>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    wordBreak: 'break-all',
                    flex: 1,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {result.output}
                </Typography>
                <CopyButton text={result.output} />
              </Stack>
            </Paper>
          )}

          {result.error && (
            <Typography variant="body2" color="error">{result.error}</Typography>
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
