import { Position } from "../models/Position.js";
import { calculateCRC16CCITT, formatCRC } from "./crc.js";
import { Buffer } from 'buffer';

window.Buffer = Buffer;

export const CODECS = {
  CODEC_GH3000: 0x07,
  CODEC_8: 0x08,
  CODEC_8_EXT: 0x8e,
  CODEC_12: 0x0c,
  CODEC_13: 0x0d,
  CODEC_16: 0x10,
};

export const CODEC_NAMES = {
  [CODECS.CODEC_GH3000]: "GH3000",
  [CODECS.CODEC_8]: "Codec 8",
  [CODECS.CODEC_8_EXT]: "Codec 8 Extended",
  [CODECS.CODEC_12]: "Codec 12",
  [CODECS.CODEC_13]: "Codec 13",
  [CODECS.CODEC_16]: "Codec 16",
};

export const DECODER_STATES = {
  WAITING_IMEI: "WAITING_IMEI",
  IMEI_RECEIVED: "IMEI_RECEIVED",
  WAITING_PACKET: "WAITING_PACKET",
  READING_AVL: "READING_AVL",
  VALIDATING_CRC: "VALIDATING_CRC",
  SENDING_ACK: "SENDING_ACK",
  ERROR: "ERROR",
  CLOSED: "CLOSED",
};

export const POSITION_KEYS = {
  PREFIX_IN: "in",
  PREFIX_OUT: "out",
  PREFIX_ADC: "adc",
  PREFIX_TEMP: "temp",
  PREFIX_IO: "io",
  KEY_ICCID: "iccid",
  KEY_FUEL_USED: "fuelUsed",
  KEY_FUEL_CONSUMPTION: "fuelConsumption",
  KEY_ODOMETER: "odometer",
  KEY_RSSI: "rssi",
  KEY_COOLANT_TEMP: "coolantTemp",
  KEY_POWER: "power",
  KEY_BATTERY: "battery",
  KEY_FUEL_LEVEL: "fuelLevel",
  KEY_RPM: "rpm",
  KEY_ODOMETER_TRIP: "odometerTrip",
  KEY_PDOP: "pdop",
  KEY_HDOP: "hdop",
  KEY_DOOR: "door",
  KEY_IGNITION: "ignition",
  KEY_MOTION: "motion",
  KEY_OPERATOR: "operator",
  KEY_SATELLITES: "satellites",
  KEY_EVENT: "event",
  KEY_VIN: "vin",
  KEY_DTCS: "dtcs",
  KEY_DRIVER_UNIQUE_ID: "driverUniqueId",
  KEY_OBD_SPEED: "obdSpeed",
  KEY_THROTTLE: "throttle",
  KEY_BATTERY_LEVEL: "batteryLevel",
};

const PARAMETERS = new Map();

const fmbXXX = new Set([
  "FMB001",
  "FMB010",
  "FMB002",
  "FMB020",
  "FMB003",
  "FMB110",
  "FMB120",
  "FMB122",
  "FMB125",
  "FMB130",
  "FMB140",
  "FMU125",
  "FMB900",
  "FMB920",
  "FMB962",
  "FMB964",
  "FM3001",
  "FMB202",
  "FMB204",
  "FMB206",
  "FMT100",
  "MTB100",
  "FMP100",
  "MSP500",
  "FMC125",
  "FMM125",
  "FMU130",
  "FMC130",
  "FMM130",
  "FMB150",
  "FMC150",
  "FMM150",
  "FMC920",
]);

function register(id, models, handler) {
  if (!PARAMETERS.has(id)) {
    PARAMETERS.set(id, new Map());
  }
  PARAMETERS.get(id).set(models, handler);
}

export function isBitSet(state, bitPosition) {
  return ((state >> bitPosition) & 1) !== 0;
}

function readValue(buf, offset, length) {
  switch (length) {
    case 1:
      return buf.readUInt8(offset);
    case 2:
      return buf.readUInt16BE(offset);
    case 4:
      return buf.readUInt32BE(offset);
    default:
      return Number(buf.readBigUInt64BE(offset));
  }
}

register(1, null, (p, b) => p.set(POSITION_KEYS.PREFIX_IN + 1, b.value > 0));
register(2, null, (p, b) => p.set(POSITION_KEYS.PREFIX_IN + 2, b.value > 0));
register(3, null, (p, b) => p.set(POSITION_KEYS.PREFIX_IN + 3, b.value > 0));
register(4, null, (p, b) => p.set(POSITION_KEYS.PREFIX_IN + 4, b.value > 0));
register(9, fmbXXX, (p, b) =>
  p.set(POSITION_KEYS.PREFIX_ADC + 1, b.value * 0.001),
);
register(10, fmbXXX, (p, b) =>
  p.set(POSITION_KEYS.PREFIX_ADC + 2, b.value * 0.001),
);
register(11, fmbXXX, (p, b) => p.set(POSITION_KEYS.KEY_ICCID, String(b.value)));
register(12, fmbXXX, (p, b) =>
  p.set(POSITION_KEYS.KEY_FUEL_USED, b.value * 0.001),
);
register(13, fmbXXX, (p, b) =>
  p.set(POSITION_KEYS.KEY_FUEL_CONSUMPTION, b.value * 0.01),
);
register(16, null, (p, b) => p.set(POSITION_KEYS.KEY_ODOMETER, b.value));
register(17, null, (p, b) => p.set("axisX", b.value));
register(18, null, (p, b) => p.set("axisY", b.value));
register(19, null, (p, b) => p.set("axisZ", b.value));
register(21, null, (p, b) => p.set(POSITION_KEYS.KEY_RSSI, b.value));
register(24, fmbXXX, (p, b) => p.setSpeed(b.value));
register(25, null, (p, b) => p.set("bleTemp1", b.value * 0.01));
register(26, null, (p, b) => p.set("bleTemp2", b.value * 0.01));
register(27, null, (p, b) => p.set("bleTemp3", b.value * 0.01));
register(28, null, (p, b) => p.set("bleTemp4", b.value * 0.01));
register(30, fmbXXX, (p, b) => p.set("faultCount", b.value));
register(32, fmbXXX, (p, b) => p.set(POSITION_KEYS.KEY_COOLANT_TEMP, b.value));
register(66, null, (p, b) => p.set(POSITION_KEYS.KEY_POWER, b.value * 0.001));
register(67, null, (p, b) => p.set(POSITION_KEYS.KEY_BATTERY, b.value * 0.001));
register(68, fmbXXX, (p, b) => p.set("batteryCurrent", b.value * 0.001));
register(72, fmbXXX, (p, b) =>
  p.set(POSITION_KEYS.PREFIX_TEMP + 1, b.value * 0.1),
);
register(73, fmbXXX, (p, b) =>
  p.set(POSITION_KEYS.PREFIX_TEMP + 2, b.value * 0.1),
);
register(74, fmbXXX, (p, b) =>
  p.set(POSITION_KEYS.PREFIX_TEMP + 3, b.value * 0.1),
);
register(75, fmbXXX, (p, b) =>
  p.set(POSITION_KEYS.PREFIX_TEMP + 4, b.value * 0.1),
);
register(78, null, (p, b) => {
  if (b.value !== 0)
    p.set(
      POSITION_KEYS.KEY_DRIVER_UNIQUE_ID,
      b.value.toString(16).toUpperCase().padStart(16, "0"),
    );
});
register(80, fmbXXX, (p, b) => p.set("dataMode", b.value));
register(81, fmbXXX, (p, b) => p.set(POSITION_KEYS.KEY_OBD_SPEED, b.value));
register(82, fmbXXX, (p, b) => p.set(POSITION_KEYS.KEY_THROTTLE, b.value));
register(83, fmbXXX, (p, b) =>
  p.set(POSITION_KEYS.KEY_FUEL_USED, b.value * 0.1),
);
register(84, fmbXXX, (p, b) =>
  p.set(POSITION_KEYS.KEY_FUEL_LEVEL, b.value * 0.1),
);
register(85, fmbXXX, (p, b) => p.set(POSITION_KEYS.KEY_RPM, b.value));
register(87, fmbXXX, (p, b) => p.set("obdOdometer", b.value));
register(89, fmbXXX, (p, b) => p.set("fuelLevelPercentage", b.value));
register(110, fmbXXX, (p, b) =>
  p.set(POSITION_KEYS.KEY_FUEL_CONSUMPTION, b.value * 0.1),
);
register(113, fmbXXX, (p, b) =>
  p.set(POSITION_KEYS.KEY_BATTERY_LEVEL, b.value),
);
register(115, fmbXXX, (p, b) => p.set("engineTemp", b.value * 0.1));
register(179, null, (p, b) => p.set(POSITION_KEYS.PREFIX_OUT + 1, b.value > 0));
register(180, null, (p, b) => p.set(POSITION_KEYS.PREFIX_OUT + 2, b.value > 0));
register(181, null, (p, b) => p.set(POSITION_KEYS.KEY_PDOP, b.value * 0.1));
register(182, null, (p, b) => p.set(POSITION_KEYS.KEY_HDOP, b.value * 0.1));
register(199, null, (p, b) => p.set(POSITION_KEYS.KEY_ODOMETER_TRIP, b.value));
register(200, fmbXXX, (p, b) => p.set("sleepMode", b.value));
register(205, fmbXXX, (p, b) => p.set("cid2g", b.value));
register(206, fmbXXX, (p, b) => p.set("lac", b.value));
register(232, fmbXXX, (p, b) => p.set("cngStatus", b.value > 0));
register(233, fmbXXX, (p, b) => p.set("cngUsed", b.value * 0.1));
register(234, fmbXXX, (p, b) => p.set("cngLevel", b.value));
register(235, fmbXXX, (p, b) => p.set("oilLevel", b.value));
register(236, null, (p, b) => {
  if (b.value > 0) p.addAlarm("general");
});
register(239, null, (p, b) => p.set(POSITION_KEYS.KEY_IGNITION, b.value > 0));
register(240, null, (p, b) => p.set(POSITION_KEYS.KEY_MOTION, b.value > 0));
register(241, null, (p, b) => p.set(POSITION_KEYS.KEY_OPERATOR, b.value));
register(246, fmbXXX, (p, b) => {
  if (b.value > 0) p.addAlarm("tow");
});
register(247, fmbXXX, (p, b) => {
  if (b.value > 0) p.addAlarm("accident");
});
register(249, fmbXXX, (p, b) => {
  if (b.value > 0) p.addAlarm("jamming");
});
register(251, fmbXXX, (p, b) => {
  if (b.value > 0) p.addAlarm("idle");
});
register(252, fmbXXX, (p, b) => {
  if (b.value > 0) p.addAlarm("powerCut");
});
register(253, null, (p, b) => {
  switch (b.value) {
    case 1:
      p.addAlarm("acceleration");
      break;
    case 2:
      p.addAlarm("braking");
      break;
    case 3:
      p.addAlarm("cornering");
      break;
  }
});
register(636, fmbXXX, (p, b) => p.set("cid4g", b.value));
register(662, fmbXXX, (p, b) => p.set(POSITION_KEYS.KEY_DOOR, b.value > 0));
register(10800, fmbXXX, (p, b) => p.set("eyeTemp1", b.value / 100));
register(10801, fmbXXX, (p, b) => p.set("eyeTemp2", b.value / 100));
register(10802, fmbXXX, (p, b) => p.set("eyeTemp3", b.value / 100));
register(10803, fmbXXX, (p, b) => p.set("eyeTemp4", b.value / 100));

function decodeGh3000Parameter(position, id, buf, offset, length) {
  const value = readValue(buf, offset, length);
  switch (id) {
    case 1:
      position.set(POSITION_KEYS.KEY_BATTERY_LEVEL, value);
      break;
    case 2:
      position.set("usbConnected", value === 1);
      break;
    case 5:
      position.set("uptime", value);
      break;
    case 20:
      position.set(POSITION_KEYS.KEY_HDOP, value * 0.1);
      break;
    case 21:
      position.set("vdop", value * 0.1);
      break;
    case 22:
      position.set(POSITION_KEYS.KEY_PDOP, value * 0.1);
      break;
    case 67:
      position.set(POSITION_KEYS.KEY_BATTERY, value * 0.001);
      break;
    case 221:
      position.set("button", value);
      break;
    case 222:
      if (value === 1) position.addAlarm("sos");
      break;
    case 240:
      position.set(POSITION_KEYS.KEY_MOTION, value === 1);
      break;
    case 244:
      position.set("roaming", value === 1);
      break;
    default:
      position.set(POSITION_KEYS.PREFIX_IO + id, value);
  }
}

function decodeParameter(position, id, buf, offset, length, codec, model) {
  if (codec === CODECS.CODEC_GH3000) {
    decodeGh3000Parameter(position, id, buf, offset, length);
    return;
  }
  if (length > 8) return;
  const params = PARAMETERS.get(id);
  if (params) {
    for (const [models, handler] of params.entries()) {
      if (models === null || (model && models.has(model))) {
        const value = readValue(buf, offset, length);
        handler(position, { value });
        return;
      }
    }
  }
  position.set(POSITION_KEYS.PREFIX_IO + id, readValue(buf, offset, length));
}

function readExtByte(buf, offset, codec, ...codecs) {
  if (codecs.includes(codec)) {
    return buf.readUInt16BE(offset);
  }
  return buf.readUInt8(offset);
}

function readExtByteAt(buf, offset, codec, ...codecs) {
  if (codecs.includes(codec)) {
    return { value: buf.readUInt16BE(offset), bytes: 2 };
  }
  return { value: buf.readUInt8(offset), bytes: 1 };
}

function readIoElements(position, buf, offset, codec, model, globalMask) {
  let off = offset;
  if (
    codec === CODECS.CODEC_8 ||
    codec === CODECS.CODEC_8_EXT ||
    codec === CODECS.CODEC_16
  ) {
    if (isBitSet(globalMask, 1)) {
      const { value: cnt, bytes } = readExtByteAt(
        buf,
        off,
        codec,
        CODECS.CODEC_8_EXT,
      );
      off += bytes;
      for (let j = 0; j < cnt; j++) {
        const { value: id, bytes: idBytes } = readExtByteAt(
          buf,
          off,
          codec,
          CODECS.CODEC_8_EXT,
          CODECS.CODEC_16,
        );
        off += idBytes;
        decodeParameter(position, id, buf, off, 1, codec, model);
        off += 1;
      }
    }
    if (isBitSet(globalMask, 2)) {
      const { value: cnt, bytes } = readExtByteAt(
        buf,
        off,
        codec,
        CODECS.CODEC_8_EXT,
      );
      off += bytes;
      for (let j = 0; j < cnt; j++) {
        const { value: id, bytes: idBytes } = readExtByteAt(
          buf,
          off,
          codec,
          CODECS.CODEC_8_EXT,
          CODECS.CODEC_16,
        );
        off += idBytes;
        decodeParameter(position, id, buf, off, 2, codec, model);
        off += 2;
      }
    }
    if (isBitSet(globalMask, 3)) {
      const { value: cnt, bytes } = readExtByteAt(
        buf,
        off,
        codec,
        CODECS.CODEC_8_EXT,
      );
      off += bytes;
      for (let j = 0; j < cnt; j++) {
        const { value: id, bytes: idBytes } = readExtByteAt(
          buf,
          off,
          codec,
          CODECS.CODEC_8_EXT,
          CODECS.CODEC_16,
        );
        off += idBytes;
        decodeParameter(position, id, buf, off, 4, codec, model);
        off += 4;
      }
    }
    const has8Byte =
      codec === CODECS.CODEC_8 ||
      codec === CODECS.CODEC_8_EXT ||
      codec === CODECS.CODEC_16;
    if (has8Byte) {
      const { value: cnt, bytes } = readExtByteAt(
        buf,
        off,
        codec,
        CODECS.CODEC_8_EXT,
      );
      off += bytes;
      for (let j = 0; j < cnt; j++) {
        const { value: id, bytes: idBytes } = readExtByteAt(
          buf,
          off,
          codec,
          CODECS.CODEC_8_EXT,
          CODECS.CODEC_16,
        );
        off += idBytes;
        decodeParameter(position, id, buf, off, 8, codec, model);
        off += 8;
      }
    }
    if (codec === CODECS.CODEC_8_EXT) {
      const cnt = buf.readUInt16BE(off);
      off += 2;
      for (let j = 0; j < cnt; j++) {
        const id = buf.readUInt16BE(off);
        off += 2;
        const length = buf.readUInt16BE(off);
        off += 2;
        if (id === 256) {
          position.set(
            POSITION_KEYS.KEY_VIN,
            buf.slice(off, off + length).toString("ascii"),
          );
        } else if (id === 281) {
          position.set(
            POSITION_KEYS.KEY_DTCS,
            buf
              .slice(off, off + length)
              .toString("ascii")
              .replace(/,/g, " "),
          );
        } else {
          position.set(
            POSITION_KEYS.PREFIX_IO + id,
            buf
              .slice(off, off + length)
              .toString("hex")
              .toUpperCase(),
          );
        }
        off += length;
      }
    }
  }
  return off;
}

function decodeLocation(position, buf, codec, model) {
  let off = 0;

  if (codec === CODECS.CODEC_GH3000) {
    let rawTime = buf.readUInt32BE(off) & 0x3fffffff;
    rawTime += 1167609600;
    off += 4;

    const globalMask = buf.readUInt8(off++);

    if (isBitSet(globalMask, 0)) {
      position.setTime(new Date(rawTime * 1000));
      const locationMask = buf.readUInt8(off++);
      if (isBitSet(locationMask, 0)) {
        position.setLatitude(buf.readFloatBE(off));
        position.setLongitude(buf.readFloatBE(off + 4));
        off += 8;
      }
      if (isBitSet(locationMask, 1)) {
        position.setAltitude(buf.readUInt16BE(off));
        off += 2;
      }
      if (isBitSet(locationMask, 2)) {
        position.setCourse((buf.readUInt8(off++) * 360.0) / 256);
      }
      if (isBitSet(locationMask, 3)) {
        position.setSpeed(buf.readUInt8(off++));
      }
      if (isBitSet(locationMask, 4)) {
        position.setSatellites(buf.readUInt8(off++));
      }
      if (isBitSet(locationMask, 5)) {
        off += 4;
        if (isBitSet(locationMask, 6)) off++;
        if (isBitSet(locationMask, 7)) off += 4;
      } else {
        if (isBitSet(locationMask, 6)) off++;
        if (isBitSet(locationMask, 7)) off += 4;
      }
    }
    off = readIoElements(position, buf, off, codec, model, globalMask);
  } else {
    position.setTimestamp(Number(buf.readBigUInt64BE(off)));
    position.setTime(new Date(position.timestamp));
    off += 8;

    position.set("priority", buf.readUInt8(off++));

    position.setLongitude(buf.readInt32BE(off) / 10000000.0);
    off += 4;
    position.setLatitude(buf.readInt32BE(off) / 10000000.0);
    off += 4;
    position.setAltitude(buf.readInt16BE(off));
    off += 2;
    position.setCourse(buf.readUInt16BE(off));
    off += 2;

    const satellites = buf.readUInt8(off++);
    position.setSatellites(satellites);
    position.set(POSITION_KEYS.KEY_SATELLITES, satellites);
    position.setValid(satellites !== 0);

    position.setSpeed(buf.readUInt16BE(off));
    off += 2;

    const { value: eventId, bytes: eventBytes } = readExtByteAt(
      buf,
      off,
      codec,
      CODECS.CODEC_8_EXT,
      CODECS.CODEC_16,
    );
    position.set(POSITION_KEYS.KEY_EVENT, eventId);
    off += eventBytes;

    if (codec === CODECS.CODEC_16) {
      off += 1; // generation type
    }

    const { bytes: totalIoBytes } = readExtByteAt(
      buf,
      off,
      codec,
      CODECS.CODEC_8_EXT,
    );
    off += totalIoBytes;

    const globalMask = 0x0f;
    off = readIoElements(position, buf, off, codec, model, globalMask);
  }

  if (model && model.match(/^FM\.6\.\.$/)) {
    const driverMsb = position.get("io195");
    const driverLsb = position.get("io196");
    if (driverMsb != null && driverLsb != null) {
      const driverBuf = Buffer.alloc(16);
      driverBuf.writeBigUInt64BE(BigInt(driverMsb), 0);
      driverBuf.writeBigUInt64BE(BigInt(driverLsb), 8);
      position.set(
        POSITION_KEYS.KEY_DRIVER_UNIQUE_ID,
        driverBuf.toString("utf8"),
      );
    }
  }

  return off;
}

export function parseIdentification(buf) {
  const length = buf.readUInt16BE(0);
  const imei = buf.slice(2, 2 + length).toString("ascii");
  return { imei, bytesConsumed: 2 + length };
}

export function parseData(buf) {
  const positions = [];
  const dataLength = buf.readUInt32BE(0);
  const codec = buf.readUInt8(4);
  const count = buf.readUInt8(5);

  let off = 6;

  for (let i = 0; i < count; i++) {
    const pos = new Position("teltonika");
    pos.setValid(true);

    if (codec === CODECS.CODEC_13) {
      const type = buf.readUInt8(off++);
      const length = buf.readInt32BE(off) - 4;
      off += 4;
      const timestamp = buf.readUInt32BE(off);
      off += 4;
      const length2 = length - 4;
      const data = buf.slice(off, off + length2);
      off += length2;
      const dataStr = data.toString("ascii").trim();
      if (dataStr.startsWith("GTSL")) {
        pos.set(POSITION_KEYS.KEY_DRIVER_UNIQUE_ID, dataStr.split("|")[4]);
      } else {
        pos.set("result", dataStr);
      }
    } else {
      const consumed = decodeLocation(pos, buf.slice(off), codec, "teltonika");
      off += consumed;
    }

    positions.push(pos);
  }

  return { positions, codec, count, dataLength, bytesConsumed: 4 + dataLength };
}

export function generateAckPacket(count, connectionless = false) {
  if (connectionless) {
    return Buffer.from([0x00, 0x05, 0x00, 0x00, 0x01, 0x00, count]);
  }
  const buf = Buffer.alloc(4);
  buf.writeUInt32BE(count, 0);
  return buf;
}

export function validateCrc(packetBuf) {
  if (packetBuf.length < 4)
    return { valid: false, error: "Packet too short for CRC" };
  const crcOffset = packetBuf.length - 4;
  const dataLength = packetBuf.readUInt32BE(0);
  const expectedCrcField = packetBuf.readUInt32BE(crcOffset);
  const crcData = packetBuf.slice(crcOffset, crcOffset + 4);
  const computed = calculateCRC16CCITT(crcData);
  const expected = expectedCrcField;
  return {
    valid: computed === expected,
    computed: formatCRC(computed),
    expected: formatCRC(expected),
    discrepancy: computed !== expected,
  };
}

export function isValidImei(imei) {
  if (!imei || typeof imei !== "string") return false;
  return /^\d{6,20}$/.test(imei);
}

export function isSupportedCodec(codec) {
  return Object.values(CODECS).includes(codec);
}

export function getCodecName(codec) {
  return (
    CODEC_NAMES[codec] || `Unknown (0x${codec.toString(16).toUpperCase()})`
  );
}

export function from(number, from) {
  return number >> from;
}

export function knotsFromKph(value) {
  return value * 0.539957;
}

export function isPrintable(buf, offset, length) {
  for (let i = 0; i < length; i++) {
    const byte = buf.readUInt8(offset + i);
    if (byte < 32 && byte !== 13 && byte !== 10) return false;
  }
  return true;
}

export class TeltonikaParser {
  constructor() {
    this.decoderState = DECODER_STATES.WAITING_IMEI;
    this.imei = null;
    this.codec = null;
    this.packetCount = 0;
    this.buffer = Buffer.alloc(0);
    this.pendingChunks = [];
    this.errors = [];
    this.logs = [];
    this.sessionState = "DISCONNECTED";
    this.positions = [];
  }

  appendData(hexString) {
    const newData = Buffer.from(hexString.replace(/\s/g, ""), "hex");
    this.buffer = Buffer.concat([this.buffer, newData]);
    this.addLog(
      "DATA_RECEIVED",
      `Appended ${newData.length} bytes. Buffer: ${this.buffer.length} bytes`,
    );
  }

  processBuffer() {
    const results = [];
    while (this.buffer.length > 0) {
      const result = this.processOnePacket();
      if (result) {
        results.push(result);
      } else {
        break;
      }
    }
    return results;
  }

  processOnePacket() {
    if (this.buffer.length === 1 && this.buffer[0] === 0xff) {
      this.buffer = Buffer.alloc(0);
      this.addLog("HEARTBEAT", "Received 0xFF heartbeat");
      return { type: "HEARTBEAT" };
    }

    if (this.buffer.length < 2) return null;

    const prefix = this.buffer.readUInt16BE(0);

    if (prefix > 0) {
      if (this.decoderState !== DECODER_STATES.WAITING_IMEI) {
        this.addLog("WARNING", "IMEI packet received in wrong state");
        this.decoderState = DECODER_STATES.ERROR;
        this.errors.push("Duplicate or out-of-sequence IMEI packet");
        return null;
      }

      if (this.buffer.length < 2 + prefix) {
        this.addLog(
          "WAITING_DATA",
          `IMEI packet incomplete, need ${2 + prefix}, have ${this.buffer.length}`,
        );
        return null;
      }

      const imei = this.buffer.slice(2, 2 + prefix).toString("ascii");
      if (!isValidImei(imei)) {
        this.addLog("WARNING", `Invalid IMEI format: ${imei}`);
      }

      this.imei = imei;
      this.decoderState = DECODER_STATES.IMEI_RECEIVED;
      this.sessionState = "AUTHENTICATED";
      this.buffer = this.buffer.slice(2 + prefix);
      this.addLog("IMEI_RECEIVED", `Device IMEI: ${imei}`);

      return { type: "IMEI", imei, ack: Buffer.from([0x01]) };
    }

    if (this.decoderState === DECODER_STATES.WAITING_IMEI) {
      this.addLog("ERROR", "AVL packet received before IMEI authentication");
      this.decoderState = DECODER_STATES.ERROR;
      this.errors.push("AVL packet received before IMEI authentication");
      return {
        type: "ERROR",
        message: "AVL packet received before IMEI authentication",
      };
    }

    if (this.buffer.length < 12) return null;

    const dataLength = this.buffer.readUInt32BE(4);
    const totalLength = 12 + dataLength;

    if (this.buffer.length < totalLength) {
      this.addLog(
        "WAITING_DATA",
        `AVL packet incomplete. Need ${totalLength}, have ${this.buffer.length}`,
      );
      return null;
    }

    this.decoderState = DECODER_STATES.READING_AVL;

    const packetData = this.buffer.slice(0, totalLength);
    this.buffer = this.buffer.slice(totalLength);

    const codec = packetData.readUInt8(8);
    const count = packetData.readUInt8(9);

    if (!isSupportedCodec(codec)) {
      this.addLog(
        "WARNING",
        `Unsupported codec detected: 0x${codec.toString(16).toUpperCase()}`,
      );
      this.errors.push(
        `Unsupported codec: 0x${codec.toString(16).toUpperCase()}`,
      );
    }

    this.decoderState = DECODER_STATES.VALIDATING_CRC;

    const crcField = packetData.readUInt32BE(totalLength - 4);
    const availCrc = (crcField >> 16) & 0xffff;
    const crcData = packetData.slice(0, totalLength - 4);
    const computedCrc = calculateCRC16CCITT(crcData);
    const crcValid = computedCrc === availCrc;

    this.codec = codec;
    this.packetCount++;

    let positions = [];
    let off = 10;

    for (let i = 0; i < count; i++) {
      const pos = new Position("teltonika");
      pos.setValid(true);

      if (codec === CODECS.CODEC_13) {
        off += 1;
        const length = packetData.readInt32BE(off) - 4;
        off += 4;
        const timestamp = packetData.readUInt32BE(off);
        off += 4;
        const length2 = length - 4;
        const dataBuf = packetData.slice(off, off + length2);
        off += length2;
        const dataStr = dataBuf.toString("ascii").trim();
        if (dataStr.startsWith("GTSL")) {
          pos.set(POSITION_KEYS.KEY_DRIVER_UNIQUE_ID, dataStr.split("|")[4]);
        } else {
          pos.set("result", dataStr);
        }
      } else {
        const consumed = decodeLocation(
          pos,
          packetData.slice(off),
          codec,
          "teltonika",
        );
        off += consumed;
      }

      positions.push(pos);
    }

    this.positions.push(...positions);
    this.decoderState = DECODER_STATES.SENDING_ACK;

    const shouldAck = codec !== CODECS.CODEC_12 && codec !== CODECS.CODEC_13;
    const ack = shouldAck ? generateAckPacket(count, false) : null;

    this.addLog(
      "AVL_PARSED",
      `Parsed ${count} records, codec 0x${codec.toString(16).toUpperCase()}, CRC ${crcValid ? "OK" : "FAIL"}`,
    );
    this.decoderState = DECODER_STATES.WAITING_PACKET;

    return {
      type: "AVL",
      codec,
      count,
      positions,
      ack,
      crcValid,
      crcComputed: formatCRC(computedCrc),
      crcExpected: formatCRC(availCrc),
    };
  }

  reset() {
    this.buffer = Buffer.alloc(0);
    this.pendingChunks = [];
    this.positions = [];
    this.errors = [];
    this.logs = [];
    this.imei = null;
    this.codec = null;
    this.packetCount = 0;
    this.decoderState = DECODER_STATES.WAITING_IMEI;
    this.sessionState = "DISCONNECTED";
  }

  connect() {
    this.sessionState = "CONNECTED";
    this.decoderState = DECODER_STATES.WAITING_IMEI;
    this.addLog("CONNECTED", "TCP connection established");
  }

  disconnect() {
    this.sessionState = "DISCONNECTED";
    this.decoderState = DECODER_STATES.CLOSED;
    this.addLog("DISCONNECTED", "TCP connection closed");
  }

  addLog(event, message) {
    this.logs.push({ timestamp: Date.now(), event, message });
  }

  getState() {
    return {
      decoderState: this.decoderState,
      sessionState: this.sessionState,
      imei: this.imei,
      codec: this.codec,
      packetCount: this.packetCount,
      bufferSize: this.buffer.length,
      errors: this.errors,
      logs: this.logs,
      positions: this.positions,
    };
  }
}

export default {
  TeltonikaParser,
  Position,
  parseIdentification,
  parseData,
  generateAckPacket,
  isValidImei,
  isSupportedCodec,
  getCodecName,
  CODECS,
  CODEC_NAMES,
  DECODER_STATES,
  POSITION_KEYS,
};
