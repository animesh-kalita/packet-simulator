export function clampLat(lat) {
  return Math.min(90, Math.max(-90, lat));
}

export function clampLng(lng) {
  return Math.min(180, Math.max(-180, lng));
}

export function toNumber(val, fallback = 0) {
  const n = Number(val);
  return isNaN(n) ? fallback : n;
}

export function padTime(value) {
  return value.toString().padStart(6, "0");
}
