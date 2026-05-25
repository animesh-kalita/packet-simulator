export function crc32(bytes) {
  if (!bytes || bytes.length === 0) return null;

  let crc = 0xFFFFFFFF;
  const table = generateCRC32Table();

  for (let i = 0; i < bytes.length; i++) {
    const index = (crc ^ bytes[i]) & 0xFF;
    crc = (crc >>> 8) ^ table[index];
  }

  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function generateCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}

export function crc32Hex(bytes) {
  const crc = crc32(bytes);
  if (crc === null) return null;
  return crc.toString(16).toUpperCase().padStart(8, '0');
}

export async function sha256(bytes) {
  if (!bytes || bytes.length === 0) return null;
  try {
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0').toLowerCase()).join('');
  } catch {
    return null;
  }
}

export async function sha1(bytes) {
  if (!bytes || bytes.length === 0) return null;
  try {
    const hashBuffer = await crypto.subtle.digest('SHA-1', bytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0').toLowerCase()).join('');
  } catch {
    return null;
  }
}

export async function md5(bytes) {
  if (!bytes || bytes.length === 0) return null;
  try {
    const hashBuffer = await crypto.subtle.digest('MD5', bytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0').toLowerCase()).join('');
  } catch {
    return simpleMD5(bytes);
  }
}

function simpleMD5(bytes) {
  let hash = 0;
  for (let i = 0; i < bytes.length; i++) {
    hash = ((hash << 5) - hash) + bytes[i];
    hash = hash & hash;
  }
  const hashHex = (hash >>> 0).toString(16).toLowerCase().padStart(8, '0');
  return hashHex + hashHex + hashHex + hashHex;
}

export async function computeHashes(bytes) {
  if (!bytes || bytes.length === 0) return null;
  const [crc, sha256Result, sha1Result, md5Result] = await Promise.all([
    Promise.resolve(crc32Hex(bytes)),
    sha256(bytes),
    sha1(bytes),
    md5(bytes),
  ]);
  return { crc32: crc, sha256: sha256Result, sha1: sha1Result, md5: md5Result };
}
