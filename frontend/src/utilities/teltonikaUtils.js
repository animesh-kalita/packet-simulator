/**
 * Utility to manipulate Teltonika Hex Packets
 */

export const updateHexTimestamp = (hexString, epochMs) => {
  // Convert hex string to byte array
  const hex = hexString.replace(/\s/g, "");
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }

  // Teltonika Timestamp is 8 bytes starting at offset 10
  // (4 preamble + 4 length + 1 codec + 1 count = 10)
  let ts = BigInt(epochMs);

  for (let i = 7; i >= 0; i--) {
    bytes[10 + i] = Number(ts & 0xffn);
    ts >>= 8n;
  }

  // Convert bytes back to hex string
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
};
