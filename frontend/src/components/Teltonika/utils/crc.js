export function calculateCRC16CCITT(data) {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < data.length; i++) {
    crc ^= data[i] << 8;

    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ polynomial) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return crc;
}

export function calculateCRC16CCITTIncremental(currentCrc, data) {
  let crc = currentCrc ^ 0xffff;

  for (let i = 0; i < data.length; i++) {
    crc ^= data[i] << 8;

    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return crc ^ 0xffff;
}

export function validateCRC(data, expectedCRC) {
  const calculated = calculateCRC16CCITT(data);
  return calculated === expectedCRC;
}

export function formatCRC(crc) {
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export const CRC16 = {
  calculate: calculateCRC16CCITT,
  calculateIncremental: calculateCRC16CCITTIncremental,
  validate: validateCRC,
  format: formatCRC,
  POLYNOMIAL: 0x1021,
  INITIAL_VALUE: 0xffff,
};

export default CRC16;
