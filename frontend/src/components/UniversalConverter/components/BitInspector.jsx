import { useState, useMemo, useCallback } from 'react';
import {
  Accordion, AccordionSummary, AccordionDetails, Typography, Box,
  Stack, Chip, ToggleButtonGroup, ToggleButton, Tooltip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { bytesToUnsignedInt, bytesToSignedInt } from '../utils/converters';

function BitCell({ bit, index, active, onClick }) {
  return (
    <Tooltip title={`Bit ${index}: ${bit}`} arrow>
      <Box
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
        aria-label={`Bit ${index}: ${bit}`}
        sx={{
          width: 28,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: active ? 'primary.main' : 'action.hover',
          color: active ? 'primary.contrastText' : 'text.secondary',
          fontSize: '0.75rem',
          fontFamily: 'monospace',
          fontWeight: 700,
          borderRadius: 0.5,
          cursor: onClick ? 'pointer' : 'default',
          border: '1px solid',
          borderColor: active ? 'primary.dark' : 'divider',
          transition: 'all 0.1s ease',
          '&:hover': onClick ? { opacity: 0.8 } : {},
          userSelect: 'none',
        }}
      >
        {bit}
      </Box>
    </Tooltip>
  );
}

export default function BitInspector({ bytes, endianness, settings, onUpdateSetting }) {
  const [editMode, setEditMode] = useState(false);
  const [editableBits, setEditableBits] = useState(null);

  const totalBits = useMemo(() => (bytes?.length || 0) * 8, [bytes]);
  const grouping = settings.bitLength;

  const bits = useMemo(() => {
    if (!bytes || bytes.length === 0) return [];
    if (editMode && editableBits) return editableBits;
    const result = [];
    for (const b of bytes) {
      for (let i = 7; i >= 0; i--) {
        result.push((b >> i) & 1);
      }
    }
    return result;
  }, [bytes, editMode, editableBits]);

  const toggleBit = useCallback((index) => {
    if (!editMode) return;
    const newBits = [...bits];
    newBits[index] = newBits[index] ? 0 : 1;
    setEditableBits(newBits);
  }, [bits, editMode]);

  const groupedBits = useMemo(() => {
    const groups = [];
    for (let i = 0; i < bits.length; i += grouping) {
      groups.push(bits.slice(i, i + grouping));
    }
    return groups;
  }, [bits, grouping]);

  const numericValues = useMemo(() => {
    return groupedBits.map(group => {
      let unsigned = 0;
      for (const bit of group) unsigned = (unsigned << 1) | bit;
      const bitLen = group.length;
      const signBit = 1 << (bitLen - 1);
      const signed = unsigned & signBit ? unsigned - (1 << bitLen) : unsigned;
      return { unsigned, signed };
    });
  }, [groupedBits]);

  const totalUnsigned = useMemo(() => {
    let val = 0;
    for (const group of groupedBits) {
      val = (val << group.length) | group.reduce((acc, b) => (acc << 1) | b, 0);
    }
    return val;
  }, [groupedBits]);

  if (!bytes || bytes.length === 0) {
    return null;
  }

  return (
    <Accordion variant="outlined" sx={{ mb: 2 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography fontWeight={600}>Bit Inspector</Typography>
        <Chip label={`${totalBits} bits`} size="small" sx={{ ml: 1.5 }} variant="outlined" />
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
            <ToggleButtonGroup
              size="small"
              value={grouping}
              exclusive
              onChange={(_, val) => val && onUpdateSetting('bitLength', val)}
              aria-label="Bit grouping"
            >
              {[8, 16, 32, 64].map(g => (
                <ToggleButton key={g} value={g} disabled={g > totalBits}>
                  {g}-bit
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            <ToggleButtonGroup
              size="small"
              value={editMode ? 'edit' : 'view'}
              exclusive
              onChange={(_, val) => {
                const enable = val === 'edit';
                setEditMode(enable);
                if (enable && !editableBits) setEditableBits([...bits]);
                if (!enable) setEditableBits(null);
              }}
              aria-label="Edit mode"
            >
              <ToggleButton value="view">View</ToggleButton>
              <ToggleButton value="edit">Edit</ToggleButton>
            </ToggleButtonGroup>

            <ToggleButtonGroup
              size="small"
              value={settings.signed ? 'signed' : 'unsigned'}
              exclusive
              onChange={(_, val) => val && onUpdateSetting('signed', val === 'signed')}
              aria-label="Interpretation"
            >
              <ToggleButton value="unsigned">Unsigned</ToggleButton>
              <ToggleButton value="signed">Signed</ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          {groupedBits.map((group, gi) => (
            <Box key={gi}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, minWidth: 60 }}>
                  Byte {gi * grouping / 8}-{(gi * grouping + group.length - 1) / 8}
                </Typography>
                {group.length >= 8 && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                    {numericValues[gi].unsigned.toString(16).toUpperCase().padStart(group.length / 4, '0')}h
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                  u:{numericValues[gi].unsigned} / s:{numericValues[gi].signed}
                </Typography>
              </Stack>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {group.map((bit, bi) => (
                  <BitCell
                    key={bi}
                    bit={bit}
                    index={gi * grouping + bi}
                    active={bit === 1}
                    onClick={editMode ? () => toggleBit(gi * grouping + bi) : null}
                  />
                ))}
              </Box>
            </Box>
          ))}

          {editMode && editableBits && (
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Chip
                label="Apply Changes"
                color="primary"
                size="small"
                onClick={() => {
                  // Rebuild bytes from editable bits
                  const newBytes = new Uint8Array(bytes.length);
                  for (let i = 0; i < bytes.length; i++) {
                    let byte = 0;
                    for (let j = 0; j < 8; j++) {
                      byte = (byte << 1) | (editableBits[i * 8 + j] || 0);
                    }
                    newBytes[i] = byte;
                  }
                  setEditMode(false);
                }}
              />
              <Chip
                label="Cancel"
                variant="outlined"
                size="small"
                onClick={() => { setEditableBits(null); setEditMode(false); }}
              />
            </Stack>
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
