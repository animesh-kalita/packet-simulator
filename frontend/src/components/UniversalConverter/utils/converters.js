export function bytesToHex(bytes, options = {}) {
  const { separator = " ", prefix = "", upperCase = true } = options;
  const hex = bytes.map((b) => {
    const h = b.toString(16).padStart(2, "0");
    return upperCase ? h.toUpperCase() : h;
  });
  return prefix + hex.join(separator);
}

export function hexToBytes(hexStr) {
  const clean = hexStr.replace(/^0x/i, "").replace(/\s+/g, "");
  if (!/^[0-9A-Fa-f]*$/.test(clean)) return null;
  if (clean.length === 0) return new Uint8Array(0);
  if (clean.length % 2 !== 0) return null;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    const byte = parseInt(clean.substring(i, i + 2), 16);
    if (isNaN(byte)) return null;
    bytes[i / 2] = byte;
  }
  return bytes;
}

export function bytesToBinary(bytes, options = {}) {
  const { separator = " " } = options;
  return bytes.map((b) => b.toString(2).padStart(8, "0")).join(separator);
}

export function binaryToBytes(binStr) {
  const clean = binStr.replace(/\s+/g, "");
  if (!/^[01]*$/.test(clean)) return null;
  if (clean.length === 0) return new Uint8Array(0);
  const padded =
    clean.length % 8 === 0
      ? clean
      : clean.padStart(Math.ceil(clean.length / 8) * 8, "0");
  const bytes = new Uint8Array(padded.length / 8);
  for (let i = 0; i < padded.length; i += 8) {
    bytes[i / 8] = parseInt(padded.substring(i, i + 8), 2);
  }
  return bytes;
}

export function bytesToDecimal(bytes, options = {}) {
  const { separator = " " } = options;
  return bytes.map((b) => b.toString(10)).join(separator);
}

export function decimalToBytes(decStr) {
  const parts = decStr.trim().split(/\s+/);
  if (parts.length === 0) return null;
  const bytes = new Uint8Array(parts.length);
  for (let i = 0; i < parts.length; i++) {
    const val = parseInt(parts[i], 10);
    if (isNaN(val) || val < 0 || val > 255) return null;
    bytes[i] = val;
  }
  return bytes;
}

export function bytesToOctal(bytes, options = {}) {
  const { separator = " " } = options;
  return bytes.map((b) => b.toString(8).padStart(3, "0")).join(separator);
}

export function octalToBytes(octStr) {
  const parts = octStr.trim().split(/\s+/);
  if (parts.length === 0) return null;
  const bytes = new Uint8Array(parts.length);
  for (let i = 0; i < parts.length; i++) {
    const val = parseInt(parts[i], 8);
    if (isNaN(val) || val < 0 || val > 255) return null;
    bytes[i] = val;
  }
  return bytes;
}

export function bytesToASCII(bytes) {
  return bytes
    .map((b) =>
      (b >= 32 && b <= 126) || b === 10 || b === 13
        ? String.fromCharCode(b)
        : ".",
    )
    .join("");
}

export function asciiToBytes(str) {
  return new Uint8Array(str.split("").map((c) => c.charCodeAt(0)));
}

export function bytesToUTF8(bytes) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

export function utf8ToBytes(str) {
  return new TextEncoder().encode(str);
}

export function bytesToUTF16(bytes, endianness = "big") {
  try {
    const encoding = endianness === "big" ? "utf-16be" : "utf-16le";
    return new TextDecoder(encoding, { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

export function utf16ToBytes(str, endianness = "big") {
  const encoder = new TextEncoder();
  const utf8Bytes = encoder.encode(str);
  const utf16Bytes = new Uint16Array(str.length);
  for (let i = 0; i < str.length; i++) {
    utf16Bytes[i] = str.charCodeAt(i);
  }
  const result = new Uint8Array(str.length * 2);
  const view = new DataView(result.buffer);
  for (let i = 0; i < str.length; i++) {
    if (endianness === "big") {
      view.setUint16(i * 2, str.charCodeAt(i), false);
    } else {
      view.setUint16(i * 2, str.charCodeAt(i), true);
    }
  }
  return result;
}

export function bytesToBase64(bytes) {
  const binary = Array.from(bytes)
    .map((b) => String.fromCharCode(b))
    .join("");
  try {
    return btoa(binary);
  } catch {
    return null;
  }
}

export function base64ToBytes(base64Str) {
  try {
    const clean = base64Str.replace(/\s+/g, "");
    const binaryStr = atob(clean);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

export function bytesToByteArray(bytes) {
  const hex = Array.from(bytes).map(
    (b) => "0x" + b.toString(16).padStart(2, "0").toUpperCase(),
  );
  return "[" + hex.join(", ") + "]";
}

export function byteArrayToBytes(arrStr) {
  try {
    const clean = arrStr.replace(/\\[|\\]/g, "").trim();
    if (!clean) return new Uint8Array(0);
    const parts = clean.split(",").map((p) => p.trim());
    const bytes = new Uint8Array(parts.length);
    for (let i = 0; i < parts.length; i++) {
      let val;
      if (parts[i].startsWith("0x") || parts[i].startsWith("0X")) {
        val = parseInt(parts[i], 16);
      } else if (parts[i].startsWith("0b") || parts[i].startsWith("0B")) {
        val = parseInt(parts[i].substring(2), 2);
      } else {
        val = parseInt(parts[i], 10);
      }
      if (isNaN(val) || val < 0 || val > 255) return null;
      bytes[i] = val;
    }
    return bytes;
  } catch {
    return null;
  }
}

export function bytesToSignedInt(bytes, endianness = "big") {
  if (bytes.length === 0) return null;
  const ordered = endianness === "little" ? [...bytes].reverse() : [...bytes];
  let value = 0;
  for (const b of ordered) value = (value << 8) | b;
  const bitLength = bytes.length * 8;
  const signBit = 1 << (bitLength - 1);
  if (value & signBit) value -= 1 << bitLength;
  return value;
}

export function bytesToUnsignedInt(bytes, endianness = "big") {
  if (bytes.length === 0) return null;
  const ordered = endianness === "little" ? [...bytes].reverse() : [...bytes];
  let value = 0;
  for (const b of ordered) value = (value << 8) | b;
  return value;
}

export function signedIntToBytes(value, numBytes, endianness = "big") {
  if (numBytes <= 0) return null;
  const maxVal = 1 << (numBytes * 8 - 1);
  if (value < -maxVal || value >= maxVal) return null;
  const unsigned = value < 0 ? value + (1 << (numBytes * 8)) : value;
  const bytes = new Uint8Array(numBytes);
  let temp = unsigned;
  for (let i = numBytes - 1; i >= 0; i--) {
    bytes[i] = temp & 0xff;
    temp >>>= 8;
  }
  if (endianness === "little") bytes.reverse();
  return bytes;
}

export function unsignedIntToBytes(value, numBytes, endianness = "big") {
  if (numBytes <= 0) return null;
  const maxVal = (1 << (numBytes * 8)) - 1;
  if (value < 0 || value > maxVal) return null;
  const bytes = new Uint8Array(numBytes);
  let temp = value;
  for (let i = numBytes - 1; i >= 0; i--) {
    bytes[i] = temp & 0xff;
    temp >>>= 8;
  }
  if (endianness === "little") bytes.reverse();
  return bytes;
}

export function bytesToFloat32(bytes, endianness = "big") {
  if (bytes.length < 4) return null;
  const buf = new ArrayBuffer(4);
  const view = new DataView(buf);
  const slice = bytes.slice(0, 4);
  for (let i = 0; i < 4; i++) view.setUint8(i, slice[i]);
  return view.getFloat32(0, endianness === "little");
}

export function bytesToFloat64(bytes, endianness = "big") {
  if (bytes.length < 8) return null;
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  const slice = bytes.slice(0, 8);
  for (let i = 0; i < 8; i++) view.setUint8(i, slice[i]);
  return view.getFloat64(0, endianness === "little");
}

export function float32ToBytes(value, endianness = "big") {
  const buf = new ArrayBuffer(4);
  const view = new DataView(buf);
  view.setFloat32(0, value, endianness === "little");
  return new Uint8Array(buf);
}

export function float64ToBytes(value, endianness = "big") {
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setFloat64(0, value, endianness === "little");
  return new Uint8Array(buf);
}

export function getFloat32Bits(float) {
  const buf = new ArrayBuffer(4);
  new Float32Array(buf)[0] = float;
  const view = new Uint32Array(buf)[0];
  return {
    sign: (view >>> 31) & 0x1,
    exponent: (view >>> 23) & 0xff,
    mantissa: view & 0x7fffff,
    signBit: ((view >>> 31) & 0x1).toString(),
    exponentBits: ((view >>> 23) & 0xff).toString(2).padStart(8, "0"),
    mantissaBits: (view & 0x7fffff).toString(2).padStart(23, "0"),
  };
}

export function getFloat64Bits(float) {
  const buf = new ArrayBuffer(8);
  new Float64Array(buf)[0] = float;
  const view = new BigUint64Array(buf)[0];
  const sign = Number((view >> 63n) & 0x1n);
  const exponent = Number((view >> 52n) & 0x7ffn);
  const mantissa = view & 0xfffffffffffffn;
  return {
    sign,
    exponent,
    mantissa: mantissa.toString(),
    signBit: sign.toString(),
    exponentBits: exponent.toString(2).padStart(11, "0"),
    mantissaBits: mantissa.toString(2).padStart(52, "0"),
  };
}

export function urlEncode(str) {
  return encodeURIComponent(str);
}

export function urlDecode(str) {
  try {
    return decodeURIComponent(str);
  } catch {
    return null;
  }
}

export function computeByteStatistics(bytes) {
  if (!bytes || bytes.length === 0) return null;
  let sum = 0,
    min = 255,
    max = 0;
  const freq = new Array(256).fill(0);
  for (const b of bytes) {
    sum += b;
    min = Math.min(min, b);
    max = Math.max(max, b);
    freq[b]++;
  }
  const mean = sum / bytes.length;
  let variance = 0;
  for (const b of bytes) variance += (b - mean) ** 2;
  variance /= bytes.length;
  return {
    length: bytes.length,
    min,
    max,
    sum,
    mean: mean.toFixed(2),
    stdDev: Math.sqrt(variance).toFixed(2),
    entropy: computeEntropy(freq, bytes.length),
    unique: freq.filter((c) => c > 0).length,
  };
}

function computeEntropy(freq, total) {
  let entropy = 0;
  for (const count of freq) {
    if (count === 0) continue;
    const p = count / total;
    entropy -= p * Math.log2(p);
  }
  return entropy.toFixed(4);
}
