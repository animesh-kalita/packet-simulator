import { useState, useMemo } from "react";
import {
  Paper,
  Tabs,
  Tab,
  Box,
  Stack,
  Typography,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Tooltip,
} from "@mui/material";
import CopyButton from "./CopyButton";

function OutputRow({ label, value, mono = true }) {
  if (value === null || value === undefined) return null;
  const display = typeof value === "number" ? String(value) : String(value);
  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ minWidth: 100, fontWeight: 600, fontSize: "0.75rem" }}
        >
          {label}
        </Typography>
        <Box sx={{ flexGrow: 1 }}>
          <Typography
            variant="body2"
            sx={{
              fontFamily: mono ? "monospace" : "inherit",
              fontSize: "0.85rem",
              wordBreak: "break-all",
              bgcolor: "action.hover",
              px: 1.5,
              py: 0.8,
              borderRadius: 0.5,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            {display.length > 1000
              ? display.substring(0, 1000) + "..."
              : display}
            {display.length > 1000 && (
              <Chip
                label={`+${display.length - 1000} chars`}
                size="small"
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
        </Box>
        <CopyButton text={display} />
      </Stack>
    </Box>
  );
}

function NumericTab({ results }) {
  return (
    <Stack spacing={1.5}>
      <OutputRow label="Hex" value={results.hex} />
      <OutputRow label="Binary" value={results.binary} />
      <OutputRow label="Decimal" value={results.decimal} />
      <OutputRow label="Octal" value={results.octal} />
      <Divider />
      <OutputRow label="Signed Int (BE)" value={results.signedInt} />
      <OutputRow label="Unsigned Int (BE)" value={results.unsignedInt} />
      {results.float32 !== undefined && (
        <OutputRow label="Float32" value={results.float32} />
      )}
      {results.float64 !== undefined && (
        <OutputRow label="Float64" value={results.float64} />
      )}
    </Stack>
  );
}

function TextTab({ results }) {
  return (
    <Stack spacing={1.5}>
      <OutputRow label="ASCII" value={results.ascii} />
      <OutputRow label="UTF-8" value={results.utf8} />
      <OutputRow label="UTF-16" value={results.utf16} />
      <Divider />
      <OutputRow label="Base64" value={results.base64} />
      <OutputRow label="Byte Array" value={results.byteArray} />
    </Stack>
  );
}

function ByteStatsTab({ results }) {
  const stats = results.byteStats;
  if (!stats) {
    return (
      <Typography variant="body2" color="text.secondary">
        No statistics available
      </Typography>
    );
  }

  return (
    <Stack spacing={1.5}>
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ maxWidth: 500 }}
      >
        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Length</TableCell>
              <TableCell sx={{ fontFamily: "monospace" }}>
                {stats.length} bytes
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Min / Max</TableCell>
              <TableCell sx={{ fontFamily: "monospace" }}>
                0x{stats.min.toString(16).padStart(2, "0").toUpperCase()} / 0x
                {stats.max.toString(16).padStart(2, "0").toUpperCase()}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Sum</TableCell>
              <TableCell sx={{ fontFamily: "monospace" }}>
                {stats.sum}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Mean</TableCell>
              <TableCell sx={{ fontFamily: "monospace" }}>
                {stats.mean}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Std Dev</TableCell>
              <TableCell sx={{ fontFamily: "monospace" }}>
                {stats.stdDev}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Entropy</TableCell>
              <TableCell sx={{ fontFamily: "monospace" }}>
                {stats.entropy} bits/byte
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Unique Values</TableCell>
              <TableCell sx={{ fontFamily: "monospace" }}>
                {stats.unique} / 256
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}

export default function ConversionPanel({
  results,
  bytes,
  activeTab,
  onTabChange,
}) {
  const tabs = useMemo(() => {
    const t = [
      { label: "Numeric", value: 0 },
      { label: "Text / Encoded", value: 1 },
      { label: "Byte Stats", value: 2 },
    ];
    return t;
  }, []);

  if (!bytes || bytes.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          Enter a value above to see conversions
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ mb: 2 }}>
      <Tabs
        value={activeTab}
        onChange={(_, v) => onTabChange(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: "divider", px: 1 }}
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.value}
            label={tab.label}
            sx={{ textTransform: "none", fontWeight: 600 }}
          />
        ))}
      </Tabs>
      <Box sx={{ p: 2.5 }}>
        {activeTab === 0 && <NumericTab results={results} />}
        {activeTab === 1 && <TextTab results={results} />}
        {activeTab === 2 && <ByteStatsTab results={results} />}
      </Box>
    </Paper>
  );
}
