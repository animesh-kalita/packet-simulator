export function hexToBuffer(hexString) {
  const cleanHex = hexString.replace(/\s/g, "");
  if (!/^[0-9A-Fa-f]*$/.test(cleanHex)) {
    throw new Error("Invalid hex string");
  }
  if (cleanHex.length % 2 !== 0) {
    throw new Error("Hex string must have even length");
  }
  return Buffer.from(cleanHex, "hex");
}

export function bufferToHex(buffer) {
  return buffer.toString("hex").toUpperCase();
}

export function hexToBytes(hexString) {
  const buffer = hexToBuffer(hexString);
  return Array.from(buffer);
}

export function bytesToHex(bytes) {
  return Buffer.from(bytes).toString("hex").toUpperCase();
}

export function formatHexWithSpaces(hexString, groupSize = 2) {
  const cleanHex = hexString.replace(/\s/g, "");
  const groups = [];
  for (let i = 0; i < cleanHex.length; i += groupSize) {
    groups.push(cleanHex.slice(i, i + groupSize));
  }
  return groups.join(" ");
}

export function parseHexDump(hexString) {
  const lines = hexString.split("\n");
  const result = [];

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    for (const part of parts) {
      if (/^[0-9A-Fa-f]{2}$/.test(part)) {
        result.push(parseInt(part, 16));
      }
    }
  }

  return Buffer.from(result);
}

export function highlightByte(byte, index) {
  const value = byte.toString(16).toUpperCase().padStart(2, "0");
  const char = byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : ".";
  return { value, char, index, raw: byte };
}

export function parseHexStringToSections(hexString) {
  const buffer = hexToBuffer(hexString);
  const sections = [];

  let offset = 0;

  if (buffer.length >= 2) {
    const prefix = buffer.readUInt16BE(0);
    if (prefix > 0 && buffer.length >= 2 + prefix) {
      sections.push({
        name: "IMEI Length",
        offset: 0,
        length: 2,
        hex: buffer.slice(0, 2).toString("hex").toUpperCase(),
        value: prefix,
        description: "Two-byte length prefix",
      });

      sections.push({
        name: "IMEI",
        offset: 2,
        length: prefix,
        hex: buffer
          .slice(2, 2 + prefix)
          .toString("hex")
          .toUpperCase(),
        value: buffer.slice(2, 2 + prefix).toString("ascii"),
        description: "Device IMEI in ASCII",
      });

      offset = 2 + prefix;
    } else if (buffer.length >= 12) {
      sections.push({
        name: "Data Length",
        offset: 0,
        length: 4,
        hex: buffer.slice(0, 4).toString("hex").toUpperCase(),
        value: buffer.readUInt32BE(0),
        description: "Four-byte data length",
      });

      sections.push({
        name: "Codec ID",
        offset: 4,
        length: 1,
        hex: buffer.slice(4, 5).toString("hex").toUpperCase(),
        value: buffer.readUInt8(4),
        description: "Codec type identifier",
      });

      sections.push({
        name: "Record Count",
        offset: 5,
        length: 1,
        hex: buffer.slice(5, 6).toString("hex").toUpperCase(),
        value: buffer.readUInt8(5),
        description: "Number of AVL records",
      });

      const dataLength = buffer.readUInt32BE(0);
      const avlDataLen = Math.max(0, dataLength - 6);
      const crcStart = dataLength;
      sections.push({
        name: "AVL Data",
        offset: 6,
        length: avlDataLen,
        hex: buffer
          .slice(6, 6 + avlDataLen)
          .toString("hex")
          .toUpperCase(),
        value: `${avlDataLen} bytes`,
        description: "AVL record data",
      });

      if (buffer.length >= crcStart + 4) {
        sections.push({
          name: "CRC",
          offset: crcStart,
          length: 4,
          hex: buffer
            .slice(crcStart, crcStart + 4)
            .toString("hex")
            .toUpperCase(),
          value: buffer.readUInt16BE(crcStart),
          description: "CRC16 checksum",
        });
      }
    }
  }

  return sections;
}

export function createChunkedStream(hexString, chunkSize) {
  const buffer = hexToBuffer(hexString);
  const chunks = [];

  for (let i = 0; i < buffer.length; i += chunkSize) {
    chunks.push(buffer.slice(i, Math.min(i + chunkSize, buffer.length)));
  }

  return chunks;
}

export function simulateFragmentation(hexString, minChunk = 4, maxChunk = 16) {
  const buffer = hexToBuffer(hexString);
  const chunks = [];
  let i = 0;

  while (i < buffer.length) {
    const chunkSize =
      Math.floor(Math.random() * (maxChunk - minChunk + 1)) + minChunk;
    chunks.push(buffer.slice(i, Math.min(i + chunkSize, buffer.length)));
    i += chunkSize;
  }

  return chunks;
}

export function injectError(hexString, errorType, position = null) {
  const buffer = hexToBuffer(hexString);
  const errorBuffer = Buffer.from(buffer);

  switch (errorType) {
    case "invalid_crc":
      if (errorBuffer.length > 6) {
        const crcPos = errorBuffer.length - 2;
        errorBuffer.writeUInt16BE(
          errorBuffer.readUInt16BE(crcPos) ^ 0xffff,
          crcPos,
        );
      }
      break;
    case "wrong_codec":
      if (errorBuffer.length > 4) {
        errorBuffer.writeUInt8(0xff, 4);
      }
      break;
    case "wrong_size":
      if (errorBuffer.length > 4) {
        errorBuffer.writeUInt32BE(errorBuffer.readUInt32BE(0) + 100, 0);
      }
      break;
    case "corrupt_avl_count":
      if (errorBuffer.length > 5) {
        errorBuffer.writeUInt8(errorBuffer.readUInt8(5) + 5, 5);
      }
      break;
    case "truncated":
      return errorBuffer.slice(0, Math.floor(errorBuffer.length / 2));
    case "random_byte":
      const injectPos =
        position !== null
          ? position
          : Math.floor(Math.random() * errorBuffer.length);
      const randomByte = Math.floor(Math.random() * 256);
      errorBuffer[injectPos] = randomByte;
      break;
  }

  return errorBuffer;
}

export default {
  hexToBuffer,
  bufferToHex,
  hexToBytes,
  bytesToHex,
  formatHexWithSpaces,
  parseHexDump,
  highlightByte,
  parseHexStringToSections,
  createChunkedStream,
  simulateFragmentation,
  injectError,
};
