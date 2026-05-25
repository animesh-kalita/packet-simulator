import { useState, useCallback } from 'react';
import { Paper, Typography, Box, Divider, Alert } from '@mui/material';
import InputPanel from './components/InputPanel';
import ConversionPanel from './components/ConversionPanel';
import FloatVisualizer from './components/FloatVisualizer';
import BitInspector from './components/BitInspector';
import TimestampTools from './components/TimestampTools';
import ColorTools from './components/ColorTools';
import EncodingTools from './components/EncodingTools';
import HashTools from './components/HashTools';
import { useConverter } from './hooks/useConverter';
import { useSettings } from './hooks/useSettings';

export default function UniversalConverter() {
  const { settings, updateSetting } = useSettings();
  const {
    input, setInput, clearInput, format, formatOverride,
    setFormatOverride, detection, bytes, error, results,
    settings: converterSettings, updateSetting: updateConverterSetting,
  } = useConverter(settings);

  const [activeTab, setActiveTab] = useState(0);

  const handleUpdateSetting = useCallback((key, value) => {
    updateSetting(key, value);
    updateConverterSetting(key, value);
  }, [updateSetting, updateConverterSetting]);

  return (
    <Paper
      elevation={2}
      sx={{
        p: { xs: 1.5, sm: 2.5 },
        m: { xs: 0.5, sm: 1 },
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1.15rem' }}>
          Universal Data Converter
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Developer conversion playground — Hex, Binary, Decimal, ASCII, Base64, IEEE754, Timestamps, Colors & more
        </Typography>
      </Box>

      <InputPanel
        input={input}
        onInputChange={setInput}
        onClear={clearInput}
        format={format}
        formatOverride={formatOverride}
        onFormatOverride={setFormatOverride}
        detection={detection}
        error={error}
        bytes={bytes}
        results={results}
        settings={converterSettings}
        onUpdateSetting={handleUpdateSetting}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <ConversionPanel
        results={results}
        bytes={bytes}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <BitInspector
        bytes={bytes}
        endianness={converterSettings.endianness}
        settings={converterSettings}
        onUpdateSetting={handleUpdateSetting}
      />

      <FloatVisualizer
        bytes={bytes}
        endianness={converterSettings.endianness}
      />

      <Divider sx={{ my: 1.5 }}>
        <Typography variant="caption" color="text.secondary">Developer Tools</Typography>
      </Divider>

      <TimestampTools />
      <ColorTools />
      <EncodingTools />
      <HashTools />
    </Paper>
  );
}
