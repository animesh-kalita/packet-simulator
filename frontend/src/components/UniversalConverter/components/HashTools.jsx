import { useState, useCallback } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Stack,
  TextField,
  Button,
  Paper,
  Grid,
  Chip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { utf8ToBytes, hexToBytes } from "../utils/converters";
import { crc32Hex, sha256, sha1, md5, computeHashes } from "../utils/hashes";
import CopyButton from "./CopyButton";

function HashResult({ label, value, loading }) {
  if (!value && !loading) return null;
  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ minWidth: 70, fontWeight: 600 }}
        >
          {label}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontFamily: "monospace",
            fontSize: "0.82rem",
            wordBreak: "break-all",
            flex: 1,
          }}
        >
          {loading ? "Computing..." : value}
        </Typography>
        {value && <CopyButton text={value} />}
      </Stack>
    </Paper>
  );
}

export default function HashTools() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCompute = useCallback(async () => {
    if (!input) return;
    setLoading(true);
    setResults(null);

    try {
      if (input.startsWith("0x") || /^[0-9A-Fa-f\s]+$/.test(input.trim())) {
        const bytes = hexToBytes(input.trim());
        if (bytes) {
          const hashes = await computeHashes(bytes);
          setResults(hashes);
          setLoading(false);
          return;
        }
      }

      const bytes = utf8ToBytes(input);
      const hashes = await computeHashes(bytes);
      setResults(hashes);
    } catch (e) {
      console.error("Hash computation error:", e);
    }
    setLoading(false);
  }, [input]);

  return (
    <Accordion variant="outlined" sx={{ mb: 2 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography fontWeight={600}>Hash & Checksum</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          <TextField
            fullWidth
            size="small"
            multiline
            minRows={2}
            maxRows={4}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter text or hex bytes to hash..."
            sx={{ "& textarea": { fontFamily: "monospace" } }}
            aria-label="Input for hashing"
          />

          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              size="small"
              onClick={handleCompute}
              disabled={loading || !input}
              startIcon={<AutoAwesomeIcon />}
            >
              {loading ? "Computing..." : "Compute Hashes"}
            </Button>
          </Stack>

          {results && (
            <Stack spacing={1}>
              <HashResult
                label="CRC32"
                value={results.crc32}
                loading={loading}
              />
              <HashResult label="MD5" value={results.md5} loading={loading} />
              <HashResult
                label="SHA-1"
                value={results.sha1}
                loading={loading}
              />
              <HashResult
                label="SHA-256"
                value={results.sha256}
                loading={loading}
              />
            </Stack>
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
