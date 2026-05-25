import {
  INPUT_FORMATS,
  DETECTION_CONFIDENCE,
  INPUT_FORMAT_LABELS,
} from "./constants";
import {
  hexToBytes,
  binaryToBytes,
  decimalToBytes,
  octalToBytes,
  asciiToBytes,
  utf8ToBytes,
  utf16ToBytes,
  base64ToBytes,
  byteArrayToBytes,
  bytesToFloat32,
  bytesToFloat64,
} from "./converters";

export function parseInput(input, format, endianness) {
  if (!input || input.trim() === "") {
    return { bytes: null, error: null };
  }

  try {
    let bytes = null;

    switch (format) {
      case INPUT_FORMATS.HEX:
        bytes = hexToBytes(input);
        if (!bytes)
          return {
            bytes: null,
            error: 'Invalid hex string. Expected format: "1A FF" or "0x1AFF"',
          };
        break;
      case INPUT_FORMATS.BINARY:
        bytes = binaryToBytes(input);
        if (!bytes)
          return {
            bytes: null,
            error:
              'Invalid binary string. Expected format: "10101010 11110000"',
          };
        break;
      case INPUT_FORMATS.DECIMAL:
        bytes = decimalToBytes(input);
        if (!bytes)
          return {
            bytes: null,
            error:
              "Invalid decimal values. Expected space-separated numbers 0-255",
          };
        break;
      case INPUT_FORMATS.OCTAL:
        bytes = octalToBytes(input);
        if (!bytes)
          return {
            bytes: null,
            error:
              "Invalid octal values. Expected space-separated octal numbers 0-377",
          };
        break;
      case INPUT_FORMATS.ASCII:
        bytes = asciiToBytes(input);
        break;
      case INPUT_FORMATS.UTF8:
        bytes = utf8ToBytes(input);
        break;
      case INPUT_FORMATS.UTF16:
        bytes = utf16ToBytes(input, endianness);
        break;
      case INPUT_FORMATS.BASE64:
        bytes = base64ToBytes(input);
        if (!bytes)
          return {
            bytes: null,
            error: "Invalid Base64 string. Check padding and characters",
          };
        break;
      case INPUT_FORMATS.BYTE_ARRAY:
        bytes = byteArrayToBytes(input);
        if (!bytes)
          return {
            bytes: null,
            error:
              'Invalid byte array. Expected format: "[0xFF, 0xAA]" or "[255, 170]"',
          };
        break;
      default:
        return { bytes: null, error: "Unsupported input format" };
    }

    return { bytes, error: null };
  } catch (e) {
    return { bytes: null, error: `Conversion error: ${e.message}` };
  }
}

export function autoDetectFormat(input) {
  if (!input || input.trim() === "") {
    return { type: null, confidence: 0 };
  }

  const trimmed = input.trim();

  const detections = [];

  const hexScore = detectHex(trimmed);
  if (hexScore) detections.push(hexScore);

  const binaryScore = detectBinary(trimmed);
  if (binaryScore) detections.push(binaryScore);

  const base64Score = detectBase64(trimmed);
  if (base64Score) detections.push(base64Score);

  const byteArrayScore = detectByteArray(trimmed);
  if (byteArrayScore) detections.push(byteArrayScore);

  const decimalScore = detectDecimal(trimmed);
  if (decimalScore) detections.push(decimalScore);

  const octalScore = detectOctal(trimmed);
  if (octalScore) detections.push(octalScore);

  const asciiScore = detectASCII(trimmed);
  if (asciiScore) detections.push(asciiScore);

  const timestampScore = detectTimestamp(trimmed);
  if (timestampScore) detections.push(timestampScore);

  detections.sort((a, b) => b.confidence - a.confidence);

  if (
    detections.length > 0 &&
    detections[0].confidence >= DETECTION_CONFIDENCE.GUESS
  ) {
    return detections[0];
  }

  return {
    type: INPUT_FORMATS.HEX,
    confidence: DETECTION_CONFIDENCE.GUESS,
    label: "Hex (best guess)",
  };
}

function detectHex(input) {
  const clean = input.replace(/^0x/i, "").replace(/\s+/g, "");
  if (clean.length === 0) return null;
  if (!/^[0-9A-Fa-f]+$/.test(clean)) return null;

  if (input.toLowerCase().startsWith("0x")) {
    return {
      type: INPUT_FORMATS.HEX,
      confidence: DETECTION_CONFIDENCE.HIGH,
      label: "Hex (0x prefix)",
    };
  }

  if (clean.length % 2 === 0) {
    const hasMixedHex = /[A-Fa-f]/.test(clean);
    const confidence =
      hasMixedHex && clean.length >= 4
        ? DETECTION_CONFIDENCE.HIGH - 5
        : DETECTION_CONFIDENCE.MEDIUM;
    return { type: INPUT_FORMATS.HEX, confidence, label: "Hex" };
  }

  if (clean.length > 2) {
    return {
      type: INPUT_FORMATS.HEX,
      confidence: DETECTION_CONFIDENCE.LOW,
      label: "Hex (odd length)",
    };
  }

  return null;
}

function detectBinary(input) {
  const clean = input.replace(/\s+/g, "");
  if (clean.length === 0) return null;
  if (!/^[01]+$/.test(clean)) return null;

  if (input.toLowerCase().startsWith("0b")) {
    return {
      type: INPUT_FORMATS.BINARY,
      confidence: DETECTION_CONFIDENCE.HIGH,
      label: "Binary (0b prefix)",
    };
  }

  if (clean.length >= 8 && /^[01]+$/.test(clean)) {
    return {
      type: INPUT_FORMATS.BINARY,
      confidence: DETECTION_CONFIDENCE.HIGH - 5,
      label: "Binary",
    };
  }

  return {
    type: INPUT_FORMATS.BINARY,
    confidence: DETECTION_CONFIDENCE.MEDIUM,
    label: "Binary",
  };
}

function detectBase64(input) {
  const clean = input.replace(/\s+/g, "");
  if (clean.length < 4) return null;
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean)) return null;
  if (clean.length % 4 !== 0 && !clean.endsWith("=")) {
    if (clean.length % 4 === 0) {
    } else {
      return null;
    }
  }

  if (clean.length > 8 && clean.endsWith("=")) {
    return {
      type: INPUT_FORMATS.BASE64,
      confidence: DETECTION_CONFIDENCE.MEDIUM,
      label: "Base64 (with padding)",
    };
  }

  const hasOnlyBase64Chars = /^[A-Za-z0-9+/=]+$/.test(clean);
  if (hasOnlyBase64Chars && !/[g-zG-Z]/.test(clean) && clean.length <= 24) {
    return null;
  }

  if (hasOnlyBase64Chars && clean.length >= 8) {
    try {
      atob(clean);
      return {
        type: INPUT_FORMATS.BASE64,
        confidence: DETECTION_CONFIDENCE.HIGH - 10,
        label: "Base64 (valid decode)",
      };
    } catch {
      return null;
    }
  }

  return null;
}

function detectByteArray(input) {
  const trimmed = input.trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) return null;
  const inside = trimmed.slice(1, -1).trim();
  if (!inside) return null;

  const parts = inside.split(",").map((p) => p.trim());
  if (parts.length > 64) return null;

  for (const part of parts) {
    if (!part) return null;
    if (part.startsWith("0x") || part.startsWith("0X")) {
      const hexVal = part.substring(2);
      if (!/^[0-9A-Fa-f]{1,2}$/.test(hexVal)) return null;
    } else if (part.startsWith("0b") || part.startsWith("0B")) {
      const binVal = part.substring(2);
      if (!/^[01]{1,8}$/.test(binVal)) return null;
    } else if (/^\d+$/.test(part)) {
      const num = parseInt(part, 10);
      if (num < 0 || num > 255) return null;
    } else {
      return null;
    }
  }

  return {
    type: INPUT_FORMATS.BYTE_ARRAY,
    confidence: DETECTION_CONFIDENCE.HIGH,
    label: "Byte Array",
  };
}

function detectDecimal(input) {
  const parts = input.trim().split(/\s+/);
  if (parts.length === 0 || parts.length > 64) return null;
  if (parts.some((p) => !/^\d+$/.test(p))) return null;
  const nums = parts.map((p) => parseInt(p, 10));
  if (nums.some((n) => n < 0 || n > 255)) {
    if (nums.some((n) => n > 100000)) return null;
    return null;
  }

  if (parts.length === 1) {
    if (nums[0] >= 0 && nums[0] <= 255) {
      return {
        type: INPUT_FORMATS.DECIMAL,
        confidence: DETECTION_CONFIDENCE.LOW,
        label: "Decimal (single byte)",
      };
    }
    return null;
  }

  return {
    type: INPUT_FORMATS.DECIMAL,
    confidence: DETECTION_CONFIDENCE.MEDIUM,
    label: "Decimal",
  };
}

function detectOctal(input) {
  const parts = input.trim().split(/\s+/);
  if (parts.length > 64) return null;
  if (parts.some((p) => !/^[0-7]+$/.test(p))) return null;
  if (parts.some((p) => p.length > 1 && p.startsWith("0") && /[0-7]/.test(p))) {
    return {
      type: INPUT_FORMATS.OCTAL,
      confidence: DETECTION_CONFIDENCE.MEDIUM,
      label: "Octal (leading zero)",
    };
  }
  const hasDigit8or9 = input
    .replace(/\s+/g, "")
    .split("")
    .some((c) => c === "8" || c === "9");
  if (hasDigit8or9) return null;
  if (parts.length >= 2) {
    return {
      type: INPUT_FORMATS.OCTAL,
      confidence: DETECTION_CONFIDENCE.LOW,
      label: "Octal",
    };
  }
  return null;
}

function detectASCII(input) {
  const printable = input
    .split("")
    .filter((c) => c >= " " && c <= "~")
    .join("");
  if (printable.length === input.length && input.length >= 2) {
    const allHex = /^[0-9A-Fa-f\s]+$/.test(input);
    const allDec = /^[0-9\s]+$/.test(input);
    if (allHex || allDec) return null;

    if (input.length >= 4 && /[a-z]/.test(input) && /[A-Za-z]/.test(input)) {
      return {
        type: INPUT_FORMATS.ASCII,
        confidence: DETECTION_CONFIDENCE.MEDIUM,
        label: "ASCII text",
      };
    }

    return {
      type: INPUT_FORMATS.ASCII,
      confidence: DETECTION_CONFIDENCE.LOW,
      label: "ASCII",
    };
  }
  return null;
}

function detectTimestamp(input) {
  const trimmed = input.trim();

  const unixRx = /^\d{8,10}$/;
  if (unixRx.test(trimmed)) {
    const num = parseInt(trimmed, 10);
    const d = new Date(num * 1000);
    if (d.getFullYear() >= 2000 && d.getFullYear() <= 2100) {
      return {
        type: INPUT_FORMATS.TIMESTAMP,
        confidence: DETECTION_CONFIDENCE.HIGH,
        label: "Unix Timestamp (seconds)",
      };
    }
  }

  const unixMsRx = /^\d{13}$/;
  if (unixMsRx.test(trimmed)) {
    const d = new Date(parseInt(trimmed, 10));
    if (d.getFullYear() >= 2000 && d.getFullYear() <= 2100) {
      return {
        type: INPUT_FORMATS.TIMESTAMP,
        confidence: DETECTION_CONFIDENCE.HIGH,
        label: "Unix Timestamp (ms)",
      };
    }
  }

  try {
    const d = new Date(trimmed);
    if (
      !isNaN(d.getTime()) &&
      d.getFullYear() >= 2000 &&
      d.getFullYear() <= 2100
    ) {
      return {
        type: INPUT_FORMATS.TIMESTAMP,
        confidence: DETECTION_CONFIDENCE.MEDIUM,
        label: "ISO Date String",
      };
    }
  } catch {}

  return null;
}

export function validateFormat(input, format) {
  if (!input || input.trim() === "") return { valid: true, error: null };
  const trimmed = input.trim();

  switch (format) {
    case INPUT_FORMATS.HEX: {
      const clean = trimmed.replace(/^0x/i, "").replace(/\s+/g, "");
      if (!/^[0-9A-Fa-f]*$/.test(clean))
        return { valid: false, error: "Contains invalid hex characters" };
      if (clean.length > 0 && clean.length % 2 !== 0)
        return {
          valid: false,
          error: "Hex string has odd length (need pairs)",
        };
      return { valid: true, error: null };
    }
    case INPUT_FORMATS.BINARY: {
      const clean = trimmed.replace(/\s+/g, "");
      if (!/^[01]*$/.test(clean))
        return { valid: false, error: "Only 0 and 1 allowed" };
      return { valid: true, error: null };
    }
    case INPUT_FORMATS.DECIMAL: {
      const parts = trimmed.split(/\s+/);
      for (const p of parts) {
        if (!/^\d+$/.test(p))
          return { valid: false, error: `Invalid decimal: "${p}"` };
        const n = parseInt(p, 10);
        if (n < 0 || n > 255)
          return { valid: false, error: `Value ${n} out of range (0-255)` };
      }
      return { valid: true, error: null };
    }
    case INPUT_FORMATS.OCTAL: {
      const parts = trimmed.split(/\s+/);
      for (const p of parts) {
        if (!/^[0-7]+$/.test(p))
          return { valid: false, error: `Invalid octal: "${p}"` };
        const n = parseInt(p, 8);
        if (n < 0 || n > 255)
          return {
            valid: false,
            error: `Value ${n} out of range (0-377 octal)`,
          };
      }
      return { valid: true, error: null };
    }
    case INPUT_FORMATS.ASCII:
    case INPUT_FORMATS.UTF8:
    case INPUT_FORMATS.UTF16:
      return { valid: true, error: null };
    case INPUT_FORMATS.BASE64: {
      const clean = trimmed.replace(/\s+/g, "");
      try {
        atob(clean);
        return { valid: true, error: null };
      } catch {
        return { valid: false, error: "Invalid Base64 encoding" };
      }
    }
    case INPUT_FORMATS.BYTE_ARRAY: {
      if (!trimmed.startsWith("[") || !trimmed.endsWith("]"))
        return { valid: false, error: "Must start with [ and end with ]" };
      return { valid: true, error: null };
    }
    default:
      return { valid: true, error: null };
  }
}
