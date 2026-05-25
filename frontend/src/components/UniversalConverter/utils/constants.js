export const INPUT_FORMATS = {
  HEX: 'hex',
  BINARY: 'binary',
  DECIMAL: 'decimal',
  OCTAL: 'octal',
  ASCII: 'ascii',
  UTF8: 'utf8',
  UTF16: 'utf16',
  BASE64: 'base64',
  BYTE_ARRAY: 'byteArray',
  FLOAT32: 'float32',
  FLOAT64: 'float64',
  TIMESTAMP: 'timestamp',
  COLOR: 'color',
};

export const INPUT_FORMAT_LABELS = {
  hex: 'Hex',
  binary: 'Binary',
  decimal: 'Decimal',
  octal: 'Octal',
  ascii: 'ASCII',
  utf8: 'UTF-8',
  utf16: 'UTF-16',
  base64: 'Base64',
  byteArray: 'Byte Array',
  float32: 'Float32',
  float64: 'Float64',
  timestamp: 'Timestamp',
  color: 'Color',
};

export const INPUT_FORMAT_COLORS = {
  hex: '#4CAF50',
  binary: '#2196F3',
  decimal: '#FF9800',
  octal: '#9C27B0',
  ascii: '#00BCD4',
  utf8: '#E91E63',
  utf16: '#F44336',
  base64: '#607D8B',
  byteArray: '#795548',
  float32: '#3F51B5',
  float64: '#009688',
  timestamp: '#FF5722',
  color: '#CDDC39',
};

export const ENDIANNESS = {
  BIG: 'big',
  LITTLE: 'little',
};

export const BIT_LENGTHS = [8, 16, 32, 64];

export const BYTE_SEPARATORS = [' ', ', ', ':', '-', ''];

export const TIMESTAMP_PRESETS = [
  { label: 'Current Unix Timestamp (seconds)', getValue: () => Math.floor(Date.now() / 1000) },
  { label: 'Current Unix Timestamp (ms)', getValue: () => Date.now() },
  { label: 'Current ISO String', getValue: () => new Date().toISOString() },
  { label: 'Start of Today (Unix s)', getValue: () => { const d = new Date(); d.setHours(0,0,0,0); return Math.floor(d.getTime() / 1000); } },
];

export const INPUT_EXAMPLES = {
  hex: '0x1A FF 2B',
  binary: '10101010 11110000',
  decimal: '255 128 64',
  octal: '377 200',
  ascii: 'Hello World',
  utf8: 'Hello ñáéíóú',
  base64: 'SGVsbG8gd29ybGQ=',
  byteArray: '[0xFF, 0xAA, 0x1B]',
};

export const DETECTION_CONFIDENCE = {
  HIGH: 90,
  MEDIUM: 70,
  LOW: 50,
  GUESS: 30,
};

export const DEFAULT_BYTE_SEPARATOR = ' ';
