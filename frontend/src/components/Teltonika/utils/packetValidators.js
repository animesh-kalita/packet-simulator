import { isValidImei, isSupportedCodec, CODECS } from "./teltonikaParser.js";

export function validatePacketStructure(buffer) {
  const errors = [];
  const warnings = [];

  if (buffer.length < 2) {
    errors.push({
      type: "TOO_SHORT",
      message: "Packet too short (minimum 2 bytes)",
    });
    return { valid: false, errors, warnings };
  }

  const prefix = buffer.readUInt16BE(0);

  if (prefix > 0) {
    if (buffer.length < 2 + prefix) {
      errors.push({
        type: "INCOMPLETE_IMEI",
        message: `IMEI packet incomplete. Declared ${2 + prefix} bytes, have ${buffer.length}`,
      });
    } else {
      const imei = buffer.slice(2, 2 + prefix).toString("ascii");
      if (!isValidImei(imei)) {
        warnings.push({
          type: "INVALID_IMEI_FORMAT",
          message: `IMEI format questionable: ${imei}`,
        });
      }
    }
  } else {
    if (buffer.length < 12) {
      errors.push({
        type: "INCOMPLETE_AVL",
        message: `AVL packet incomplete. Minimum 12 bytes needed, have ${buffer.length}`,
      });
      return { valid: false, errors, warnings };
    }

    const dataLength = buffer.readUInt32BE(4);
    const totalLength = 12 + dataLength;

    if (buffer.length < totalLength) {
      errors.push({
        type: "INCOMPLETE_DATA",
        message: `AVL data incomplete. Declared ${totalLength} bytes, have ${buffer.length}`,
      });
    }

    const codec = buffer.readUInt8(8);
    if (!isSupportedCodec(codec)) {
      warnings.push({
        type: "UNSUPPORTED_CODEC",
        message: `Codec 0x${codec.toString(16).toUpperCase()} not recognized`,
      });
    }

    const count = buffer.readUInt8(9);
    if (count === 0) {
      warnings.push({
        type: "ZERO_RECORDS",
        message: "AVL packet has zero records",
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateImeiPacket(buffer) {
  const errors = [];
  const warnings = [];

  if (buffer.length < 2) {
    errors.push({
      type: "TOO_SHORT",
      message: "IMEI packet must be at least 2 bytes",
    });
    return { valid: false, errors, warnings };
  }

  const length = buffer.readUInt16BE(0);

  if (length === 0) {
    errors.push({ type: "ZERO_LENGTH", message: "IMEI length cannot be zero" });
  }

  if (buffer.length < 2 + length) {
    errors.push({
      type: "INCOMPLETE",
      message: `IMEI data truncated. Expected ${length} bytes, got ${buffer.length - 2}`,
    });
  }

  if (errors.length === 0) {
    const imei = buffer.slice(2, 2 + length).toString("ascii");
    if (!isValidImei(imei)) {
      warnings.push({
        type: "INVALID_FORMAT",
        message: `IMEI "${imei}" does not match expected format`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    parsed: {
      length,
      imei:
        errors.length === 0
          ? buffer.slice(2, 2 + length).toString("ascii")
          : null,
    },
  };
}

export function validateAvlPacket(buffer) {
  const errors = [];
  const warnings = [];

  if (buffer.length < 12) {
    errors.push({
      type: "TOO_SHORT",
      message: "AVL packet must be at least 12 bytes",
    });
    return { valid: false, errors, warnings };
  }

  const dataLength = buffer.readUInt32BE(0);
  const codec = buffer.readUInt8(4);
  const recordCount = buffer.readUInt8(5);

  if (buffer.length < 12 + dataLength) {
    errors.push({
      type: "LENGTH_MISMATCH",
      message: `Packet length mismatch. Header declares ${dataLength} data bytes, but only ${buffer.length - 12} available`,
    });
  }

  if (!isSupportedCodec(codec)) {
    warnings.push({
      type: "UNKNOWN_CODEC",
      message: `Unsupported codec: 0x${codec.toString(16).toUpperCase()}`,
    });
  }

  if (recordCount === 0) {
    warnings.push({ type: "ZERO_RECORDS", message: "Record count is zero" });
  }

  if (recordCount > 255) {
    errors.push({
      type: "INVALID_COUNT",
      message: "Record count exceeds maximum (255)",
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    parsed: {
      dataLength,
      codec,
      recordCount,
    },
  };
}

export function validateSequence(decoderState, packetType) {
  const errors = [];
  const warnings = [];

  switch (decoderState) {
    case "WAITING_IMEI":
      if (packetType === "AVL") {
        errors.push({
          type: "SEQUENCE_ERROR",
          message: "AVL packet received before IMEI authentication",
        });
      }
      break;
    case "WAITING_PACKET":
    case "IMEI_RECEIVED":
      if (packetType === "IMEI") {
        warnings.push({
          type: "DUPLICATE_IMEI",
          message: "Duplicate IMEI identification received",
        });
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateDecoderState(state) {
  const validStates = [
    "WAITING_IMEI",
    "IMEI_RECEIVED",
    "WAITING_PACKET",
    "READING_AVL",
    "VALIDATING_CRC",
    "SENDING_ACK",
    "ERROR",
    "CLOSED",
  ];

  return validStates.includes(state);
}

export function validateSessionState(state) {
  const validStates = [
    "DISCONNECTED",
    "CONNECTED",
    "AUTHENTICATED",
    "ERROR",
    "CLOSED",
  ];

  return validStates.includes(state);
}

export function checkPacketFidelity(hexString, expectedStructure) {
  const errors = [];

  try {
    const buffer = Buffer.from(hexString.replace(/\s/g, ""), "hex");

    if (expectedStructure.type === "IMEI") {
      if (buffer.readUInt16BE(0) === 0) {
        errors.push({
          type: "PREAMBLE_ERROR",
          message: "IMEI packet has zero preamble",
        });
      }
      const imeiLen = buffer.readUInt16BE(0);
      if (buffer.length < 2 + imeiLen) {
        errors.push({
          type: "LENGTH_ERROR",
          message: "IMEI length exceeds packet size",
        });
      }
    } else if (expectedStructure.type === "AVL") {
      const dataLen = buffer.readUInt32BE(4);
      if (buffer.length !== 12 + dataLen) {
        errors.push({
          type: "LENGTH_MISMATCH",
          message: `Expected ${12 + dataLen} bytes, got ${buffer.length}`,
        });
      }

      const codec = buffer.readUInt8(8);
      if (expectedStructure.codec && codec !== expectedStructure.codec) {
        errors.push({
          type: "CODEC_MISMATCH",
          message: `Expected codec 0x${expectedStructure.codec.toString(16)}, got 0x${codec.toString(16)}`,
        });
      }

      const count = buffer.readUInt8(9);
      if (expectedStructure.count && count !== expectedStructure.count) {
        errors.push({
          type: "COUNT_MISMATCH",
          message: `Expected ${expectedStructure.count} records, got ${count}`,
        });
      }
    }
  } catch (e) {
    errors.push({ type: "PARSE_ERROR", message: e.message });
  }

  return {
    faithful: errors.length === 0,
    errors,
  };
}

export default {
  validatePacketStructure,
  validateImeiPacket,
  validateAvlPacket,
  validateSequence,
  validateDecoderState,
  validateSessionState,
  checkPacketFidelity,
};
