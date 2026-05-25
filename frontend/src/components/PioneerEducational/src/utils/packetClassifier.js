// Packet classification utility for Pioneer protocol

import { PACKET_TYPES, HEADERS } from "../utils/constants";

export const classifyPacket = (packetHex) => {
  if (!packetHex) {
    return null;
  }

  // Clean the hex string
  const cleanedHex = packetHex.replace(/\s/g, "").toLowerCase();

  // Need at least 4 bytes (8 hex chars) to read header and type
  if (cleanedHex.length < 8) {
    return {
      type: null,
      header: null,
      length: 0,
      index: 0,
      imei: "",
      confidence: 0,
      requiresAck: false,
      details: "Packet too short to classify",
    };
  }

  try {
    // Parse header (first 2 bytes, big-endian)
    const headerByte1 = parseInt(cleanedHex.substring(0, 2), 16);
    const headerByte2 = parseInt(cleanedHex.substring(2, 4), 16);
    const header = (headerByte1 << 8) | headerByte2;

    // Parse type (3rd byte)
    const typeByte = parseInt(cleanedHex.substring(4, 6), 16);

    // Parse length (4th and 5th bytes, big-endian)
    const lengthByte1 = parseInt(cleanedHex.substring(6, 8), 16);
    const lengthByte2 = parseInt(cleanedHex.substring(8, 10), 16);
    const length = (lengthByte1 << 8) | lengthByte2;

    // Parse index (6th and 7th bytes, big-endian)
    const indexByte1 = parseInt(cleanedHex.substring(10, 12), 16);
    const indexByte2 = parseInt(cleanedHex.substring(12, 14), 16);
    const index = (indexByte1 << 8) | indexByte2;

    // Extract IMEI (next 8 bytes, positions 14-29 in hex string)
    const imeiHex = cleanedHex.substring(14, 30);
    let imei = "";
    if (imeiHex.length === 16) {
      // 8 bytes = 16 hex chars
      // Convert BCD to ASCII
      for (let i = 0; i < imeiHex.length; i += 2) {
        const byte = parseInt(imeiHex.substring(i, i + 2), 16);
        const highNibble = (byte >> 4) & 0x0f;
        const lowNibble = byte & 0x0f;
        if (highNibble >= 0 && highNibble <= 9) imei += highNibble.toString();
        if (lowNibble >= 0 && lowNibble <= 9) imei += lowNibble.toString();
      }
    }

    // Determine packet type
    const packetTypeName =
      Object.keys(PACKET_TYPES).find((key) => PACKET_TYPES[key] === typeByte) ||
      `UNKNOWN_0x${typeByte.toString(16)}`;

    // Determine header type
    const headerTypeName =
      Object.keys(HEADERS).find((key) => HEADERS[key] === header) ||
      `UNKNOWN_0x${header.toString(16)}`;

    // Calculate confidence based on known headers and types
    let confidence = 0.5; // Base confidence

    if (
      [HEADERS.DEFAULT, HEADERS.ALT_1, HEADERS.ALT_2, HEADERS.PIONEER].includes(
        header,
      )
    ) {
      confidence += 0.3;
    }

    // Boost confidence for known packet types
    if (Object.values(PACKET_TYPES).includes(typeByte)) {
      confidence += 0.2;
    }

    // Cap confidence at 1.0
    confidence = Math.min(1.0, confidence);

    // Determine if ACK is required
    const requiresAck = [
      PACKET_TYPES.MSG_GPS,
      PACKET_TYPES.MSG_GPS_2,
      PACKET_TYPES.MSG_ALARM,
      PACKET_TYPES.MSG_ALARM_2,
      PACKET_TYPES.MSG_PIONEER_X,
      PACKET_TYPES.MSG_PIONEER_X_33,
      PACKET_TYPES.MSG_BLE_LOCATION,
    ].includes(typeByte);

    // Generate details string
    const details =
      `Header: 0x${header.toString(16).toUpperCase()} (${headerTypeName}), ` +
      `Type: 0x${typeByte.toString(16).toUpperCase()} (${packetTypeName}), ` +
      `Length: ${length} bytes, Index: ${index}, IMEI: ${imei || "Not detected"}`;

    return {
      type: typeByte,
      header: header,
      length: length,
      index: index,
      imei: imei,
      confidence: confidence,
      requiresAck: requiresAck,
      details: details,
      isKnown:
        Object.values(PACKET_TYPES).includes(typeByte) &&
        [
          HEADERS.DEFAULT,
          HEADERS.ALT_1,
          HEADERS.ALT_2,
          HEADERS.PIONEER,
        ].includes(header),
    };
  } catch (error) {
    return {
      type: null,
      header: null,
      length: 0,
      index: 0,
      imei: "",
      confidence: 0,
      requiresAck: false,
      details: `Classification error: ${error.message}`,
    };
  }
};
