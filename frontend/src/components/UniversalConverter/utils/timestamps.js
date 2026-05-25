export function unixToDate(unixSeconds) {
  const d = new Date(unixSeconds * 1000);
  return isValidDate(d) ? d : null;
}

export function unixMsToDate(unixMs) {
  const d = new Date(unixMs);
  return isValidDate(d) ? d : null;
}

export function dateToUnix(d) {
  return Math.floor(d.getTime() / 1000);
}

export function dateToUnixMs(d) {
  return d.getTime();
}

export function dateToISO(d) {
  return d.toISOString();
}

export function dateToUTCString(d) {
  return d.toUTCString();
}

export function dateToLocaleString(d, tz) {
  try {
    return d.toLocaleString("en-US", tz ? { timeZone: tz } : {});
  } catch {
    return d.toLocaleString("en-US");
  }
}

export function parseTimestamp(input) {
  if (!input || input.trim() === "") return null;

  const trimmed = input.trim();

  const unixRx = /^\d{8,10}$/;
  if (unixRx.test(trimmed)) {
    const d = unixToDate(parseInt(trimmed, 10));
    if (d) return { date: d, source: "Unix (seconds)" };
  }

  const unixMsRx = /^\d{13}$/;
  if (unixMsRx.test(trimmed)) {
    const d = unixMsToDate(parseInt(trimmed, 10));
    if (d) return { date: d, source: "Unix (milliseconds)" };
  }

  const d = new Date(trimmed);
  if (isValidDate(d)) {
    return { date: d, source: "Date string" };
  }

  return null;
}

export function getRelativeTime(d) {
  const now = Date.now();
  const diff = now - d.getTime();
  const absDiff = Math.abs(diff);
  const prefix = diff >= 0 ? "" : "in ";

  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0)
    return `${prefix}${years} year${years > 1 ? "s" : ""}${diff >= 0 ? " ago" : ""}`;
  if (months > 0)
    return `${prefix}${months} month${months > 1 ? "s" : ""}${diff >= 0 ? " ago" : ""}`;
  if (days > 0)
    return `${prefix}${days} day${days > 1 ? "s" : ""}${diff >= 0 ? " ago" : ""}`;
  if (hours > 0)
    return `${prefix}${hours} hour${hours > 1 ? "s" : ""}${diff >= 0 ? " ago" : ""}`;
  if (minutes > 0)
    return `${prefix}${minutes} minute${minutes > 1 ? "s" : ""}${diff >= 0 ? " ago" : ""}`;
  return `${prefix}${seconds} second${seconds !== 1 ? "s" : ""}${diff >= 0 ? " ago" : ""}`;
}

function isValidDate(d) {
  return d instanceof Date && !isNaN(d.getTime());
}

export function getCommonTimezones() {
  return [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Europe/Moscow",
    "Asia/Dubai",
    "Asia/Kolkata",
    "Asia/Shanghai",
    "Asia/Tokyo",
    "Asia/Singapore",
    "Australia/Sydney",
    "Pacific/Auckland",
  ];
}
