// Utility functions for byte operations similar to BytesOperation in Java code

export const decodeBCD = (bytes) => {
  if (!bytes || bytes.length === 0) return '';
  
  let result = '';
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    const highNibble = (byte >> 4) & 0x0F;
    const lowNibble = byte & 0x0F;
    
    // Only add nibbles that represent valid BCD digits (0-9)
    if (highNibble >= 0 && highNibble <= 9) {
      result += highNibble.toString();
    }
    if (lowNibble >= 0 && lowNibble <= 9) {
      result += lowNibble.toString();
    }
  }
  
  return result;
};

export const encodeBCD = (str) => {
  if (!str) return [];
  
  const bytes = [];
  // Ensure we have an even number of characters by padding with leading zero if needed
  let paddedStr = str.length % 2 === 0 ? str : '0' + str;
  
  for (let i = 0; i < paddedStr.length; i += 2) {
    const highNibble = parseInt(paddedStr.charAt(i), 10);
    const lowNibble = parseInt(paddedStr.charAt(i + 1), 10);
    
    if (!isNaN(highNibble) && highNibble >= 0 && highNibble <= 9 &&
        !isNaN(lowNibble) && lowNibble >= 0 && lowNibble <= 9) {
      const byte = (highNibble << 4) | lowNibble;
      bytes.push(byte);
    }
  }
  
  return bytes;
};

export const toInt = (value, bits) => {
  // Extract specific bits from a byte (similar to Java's BytesOperation.to)
  const mask = (1 << bits) - 1;
  return value & mask;
};

export const checkBit = (value, bitPosition) => {
  // Check if specific bit is set (similar to Java's BytesOperation.check)
  return (value & (1 << bitPosition)) !== 0;
};

export const readInteger = (bytes, byteCount) => {
  // Read integer from byte array (big-endian)
  let result = 0;
  for (let i = 0; i < byteCount && i < bytes.length; i++) {
    result = (result << 8) | bytes[i];
  }
  return result;
};

export const readFloatLE = (bytes) => {
  // Read 32-bit float in little-endian format
  if (bytes.length < 4) return 0;
  
  // Convert bytes to 32-bit float (little-endian)
  const view = new DataView(new ArrayBuffer(4));
  view.setUint8(0, bytes[0]);
  view.setUint8(1, bytes[1]);
  view.setUint8(2, bytes[2]);
  view.setUint8(3, bytes[3]);
  return view.getFloat32(0, true); // true = little-endian
};

export const readDate = (bytes) => {
  // Read date from 4 bytes (similar to Java implementation)
  // Format: year(1), month(1), day(1), hour(1), minute(1), second(1) - but packed differently
  // Based on the Java code, this appears to be a custom format
  
  if (bytes.length < 4) return new Date(0);
  
  // Based on Java code analysis:
  // year = bytes[0] + 2000
  // month = bytes[1]
  // day = bytes[2]
  // hour = bytes[3]
  // minute = bytes[4] (if available)
  // second = bytes[5] (if available)
  
  const year = 2000 + bytes[0];
  const month = Math.max(1, Math.min(12, bytes[1])); // Clamp to 1-12
  const day = Math.max(1, Math.min(31, bytes[2]));   // Clamp to 1-31
  const hour = Math.max(0, Math.min(23, bytes[3]));  // Clamp to 0-23
  const minute = bytes.length > 4 ? Math.max(0, Math.min(59, bytes[4])) : 0;
  const second = bytes.length > 5 ? Math.max(0, Math.min(59, bytes[5])) : 0;
  
  return new Date(year, month - 1, day, hour, minute, second);
};

export const knotsFromKph = (kph) => {
  // Convert kilometers per hour to knots
  return kph * 0.539957;
};

export const hexDump = (slice) => {
  // Convert byte slice to hex string (similar to ByteBufUtil.hexDump)
  if (!slice) return '';
  
  let result = '';
  for (let i = 0; i < slice.length; i++) {
    result += slice[i].toString(16).padStart(2, '0');
  }
  return result;
};