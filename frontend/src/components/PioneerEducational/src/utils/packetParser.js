// Packet parsing simulation utility for visualizing Netty ByteBuf parsing steps

import {
  decodeBCD,
  toInt,
  checkBit,
  readInteger,
  readFloatLE,
  readDate,
  knotsFromKph,
  hexDump,
} from "./bytesOperation";
import {
  PACKET_TYPES,
  MSG_LOGIN,
  MSG_GPS,
  MSG_HEARTBEAT,
  MSG_ALARM,
  MSG_NETWORK,
  MSG_DRIVER_BEHAVIOR_1,
  MSG_DRIVER_BEHAVIOR_2,
  MSG_BLE,
  MSG_NETWORK_2,
  MSG_BLE_LOCATION,
  MSG_GPS_2,
  MSG_ALARM_2,
  MSG_MANUAL_CAN,
  MSG_PIONEER_X_33,
  MSG_PIONEER_X,
  MSG_COMMAND,
} from "../utils/constants";

const PARSER_STAGES = [
  { name: 'header', bytesNeeded: 2, label: 'Read Header' },
  { name: 'type', bytesNeeded: 1, label: 'Read Packet Type' },
  { name: 'length', bytesNeeded: 2, label: 'Read Packet Length' },
  { name: 'index', bytesNeeded: 2, label: 'Read Packet Index' },
  { name: 'imei', bytesNeeded: 8, label: 'Decode IMEI' },
  { name: 'gpsConfig', bytesNeeded: 8, label: 'Read GPS Configuration' },
  { name: 'gpsStatus', bytesNeeded: 2, label: 'Parse GPS Status' },
  { name: 'coordinates', bytesNeeded: 12, label: 'Parse GPS Coordinates' },
  { name: 'speed', bytesNeeded: 4, label: 'Parse Speed Value' },
  { name: 'timestamp', bytesNeeded: 6, label: 'Parse Timestamp' },
];

export const parsePacketStep = (parserState) => {
  const { bytes, history } = parserState;
  let { position } = parserState;

  if (position >= bytes.length) return null;

  const workingState = {
    bytes: [...bytes],
    position,
    history: [...history],
  };

  const stage = history.length;
  const stepNum = stage + 1;

  try {
    let stepInfo = null;

    if (stage < PARSER_STAGES.length) {
      const stageDef = PARSER_STAGES[stage];
      const needed = stageDef.bytesNeeded;

      if (position + needed > bytes.length) {
        const remainingBytes = bytes.slice(position);
        position = bytes.length;
        stepInfo = {
          step: stepNum,
          title: "Insufficient Data",
          description: `Expected ${needed} bytes for "${stageDef.label}" but only ${bytes.length - position + remainingBytes.length} remain`,
          explanation: "The packet is shorter than expected for this parsing stage. This usually indicates a truncated or malformed packet.",
          values: {
            "Expected": `${needed} bytes`,
            "Available": `${remainingBytes.length} bytes`,
            "Raw Remaining": hexDump(remainingBytes),
          },
        };
      } else {
        switch (stage) {
          case 0: {
            const headerByte1 = bytes[position];
            const headerByte2 = bytes[position + 1];
            const header = (headerByte1 << 8) | headerByte2;
            position += 2;

            stepInfo = {
              step: stepNum,
              title: "Read Header",
              description: `Read packet header: 0x${header.toString(16).toUpperCase()}`,
              explanation: "The header identifies the start of a Pioneer packet. Common headers are 0x2323 (##), 0x2727 ('' '') , or 0x2626 (& &).",
              values: { Header: `0x${header.toString(16).toUpperCase()}` },
              visualAids: [{ label: "Header Bytes", content: `${headerByte1.toString(16).toUpperCase()} ${headerByte2.toString(16).toUpperCase()}` }],
            };
            break;
          }
          case 1: {
            const type = bytes[position];
            position += 1;
            const typeName = Object.keys(PACKET_TYPES).find((key) => PACKET_TYPES[key] === type) || `UNKNOWN_0x${type.toString(16)}`;

            stepInfo = {
              step: stepNum,
              title: "Read Packet Type",
              description: `Read packet type: 0x${type.toString(16).toUpperCase()} (${typeName})`,
              explanation: "The packet type determines how the rest of the packet should be parsed. Different types have different structures and data fields.",
              values: { "Packet Type": `0x${type.toString(16).toUpperCase()} (${typeName})` },
              visualAids: [{ label: "Type Byte", content: `0x${type.toString(16).toUpperCase()}` }],
            };
            break;
          }
          case 2: {
            const lengthByte1 = bytes[position];
            const lengthByte2 = bytes[position + 1];
            const length = (lengthByte1 << 8) | lengthByte2;
            position += 2;

            stepInfo = {
              step: stepNum,
              title: "Read Packet Length",
              description: `Read packet length: ${length} bytes`,
              explanation: "The length field indicates the total packet size. This helps the parser validate packet integrity and know where the packet ends.",
              values: { Length: `${length} bytes` },
              visualAids: [{ label: "Length Bytes", content: `${lengthByte1.toString(16).toUpperCase()} ${lengthByte2.toString(16).toUpperCase()}` }],
            };
            break;
          }
          case 3: {
            const indexByte1 = bytes[position];
            const indexByte2 = bytes[position + 1];
            const index = (indexByte1 << 8) | indexByte2;
            position += 2;

            stepInfo = {
              step: stepNum,
              title: "Read Packet Index",
              description: `Read packet index: ${index}`,
              explanation: "The index is a sequence number that helps detect missing or duplicate packets. It increments with each new packet sent by the device.",
              values: { Index: `${index}` },
              visualAids: [{ label: "Index Bytes", content: `${indexByte1.toString(16).toUpperCase()} ${indexByte2.toString(16).toUpperCase()}` }],
            };
            break;
          }
          case 4: {
            const imeiBytes = bytes.slice(position, position + 8);
            const imei = decodeBCD(imeiBytes);
            position += 8;

            stepInfo = {
              step: stepNum,
              title: "Decode IMEI",
              description: `Decode IMEI: ${imei}`,
              explanation: "The IMEI is a unique 15-digit device identifier stored in BCD (Binary Coded Decimal) format where each digit occupies 4 bits (a nibble). 8 bytes become 15 digits.",
              values: { IMEI: imei, "Raw BCD Bytes": hexDump(imeiBytes) },
              visualAids: [{ label: "IMEI Digits", content: imei.split("").join(" ") }],
              commonPitfalls: [
                "If IMEI bytes are corrupted, parser alignment breaks and every subsequent field becomes misinterpreted.",
                "BCD encoding only uses values 0-9 per nibble; values A-F indicate corrupted or non-BCD data.",
              ],
            };
            break;
          }
          case 5: {
            const accOn = readInteger(bytes.slice(position, position + 2), 2);
            position += 2;
            const accOff = readInteger(bytes.slice(position, position + 2), 2);
            position += 2;
            const angleComp = bytes[position++];
            const distanceComp = readInteger(bytes.slice(position, position + 2), 2);
            position += 2;
            const speedComp = bytes[position++];

            stepInfo = {
              step: stepNum,
              title: "Read GPS Configuration",
              description: "Read ACC/speed compensation values",
              explanation: "These fields configure how the device reports acceleration events and compensates for speedometer inaccuracies.",
              values: {
                "ACC On Interval": `${accOn} seconds`,
                "ACC Off Interval": `${accOff} seconds`,
                "Angle Compensation": `${angleComp}`,
                "Distance Compensation": `${distanceComp}`,
                "Speed Compensation": `${speedComp}`,
              },
            };
            break;
          }
          case 6: {
            const gpsSignal = bytes[position++];
            const statusByte = bytes[position++];
            const satellites = toInt(statusByte, 5);
            const eventCodeBit = checkBit(statusByte, 7);
            const gpsStatusBit = checkBit(statusByte, 6);
            const gpsStatus = gpsStatusBit ? "A" : "V";

            stepInfo = {
              step: stepNum,
              title: "Parse GPS Status",
              description: `Parse GPS status and satellite count`,
              explanation: "The status byte contains critical information about GPS fix quality, live vs history classification, and satellite count.",
              values: {
                "GPS Signal": `${gpsSignal}`,
                "Satellites Tracked": `${satellites}`,
                "Packet Type": eventCodeBit ? "History" : "Live",
                "GPS Status": `${gpsStatus} (${gpsStatusBit ? "Valid" : "Invalid"} fix)`,
              },
              visualAids: [{
                label: "Status Byte Bits",
                content: `${statusByte.toString(2).padStart(8, "0")} (bit7:event, bit6:gps, bit5-0:satellites)`,
              }],
              commonPitfalls: [
                "Misinterpreting the status byte leads to incorrect classification of live vs history packets.",
                'Bit 6 = 0 means "V" (void) GPS fix — coordinates should not be trusted.',
              ],
            };
            break;
          }
          case 7: {
            const altitude = readFloatLE(bytes.slice(position, position + 4));
            position += 4;
            const longitude = readFloatLE(bytes.slice(position, position + 4));
            position += 4;
            const latitude = readFloatLE(bytes.slice(position, position + 4));
            position += 4;

            stepInfo = {
              step: stepNum,
              title: "Parse GPS Coordinates",
              description: `Lat=${latitude.toFixed(6)}, Lng=${longitude.toFixed(6)}, Alt=${altitude.toFixed(1)}m`,
              explanation: "GPS coordinates are stored as IEEE 754 32-bit floats in little-endian byte order. Each coordinate uses 4 bytes.",
              values: {
                Latitude: `${latitude.toFixed(6)}°`,
                Longitude: `${longitude.toFixed(6)}°`,
                Altitude: `${altitude.toFixed(1)} meters`,
              },
              visualAids: [{ label: "Coordinate Precision", content: "Each float uses 4 bytes, providing ~7 decimal digits of precision" }],
              commonPitfalls: [
                "Forgetting little-endian byte order produces completely wrong coordinate values.",
                'Invalid GPS fixes (status "V") may still contain coordinate values that should be ignored.',
              ],
            };
            break;
          }
          case 8: {
            const speedRaw = readInteger(bytes.slice(position, position + 4), 4);
            const speedKnots = knotsFromKph(speedRaw * 0.1);
            position += 4;

            stepInfo = {
              step: stepNum,
              title: "Parse Speed Value",
              description: `Parse speed: ${Math.round(speedRaw * 0.1)} km/h`,
              explanation: "Speed is stored as a 32-bit integer representing 0.1 knot units. Conversion to km/h or mph is needed for human readability.",
              values: {
                "Raw Speed Value": `${speedRaw} (0.1 knot units)`,
                Speed: `${Math.round(speedRaw * 0.1)} km/h`,
                "Speed in Knots": `${speedKnots.toFixed(1)} knots`,
              },
            };
            break;
          }
          case 9: {
            const year = 2000 + bytes[position++];
            const month = bytes[position++];
            const day = bytes[position++];
            const hour = bytes[position++];
            const minute = bytes[position++];
            const second = bytes[position++];
            const date = new Date(year, month - 1, day, hour, minute, second);

            stepInfo = {
              step: stepNum,
              title: "Parse Timestamp",
              description: `Parse timestamp: ${date.toLocaleString()}`,
              explanation: "The timestamp stores year (offset from 2000), month, day, hour, minute, second as individual bytes — more compact than Unix timestamps.",
              values: {
                Year: `${year}`, Month: `${month}`, Day: `${day}`,
                Hour: `${hour}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`,
                Timestamp: date.toLocaleString(),
              },
              visualAids: [{
                label: "Timestamp Bytes",
                content: `${(year - 2000).toString(16)} ${month.toString(16)} ${day.toString(16)} ${hour.toString(16)} ${minute.toString(16)} ${second.toString(16)}`.toUpperCase(),
              }],
            };
            break;
          }
        }
      }
    } else {
      const remainingBytes = bytes.slice(position);
      position = bytes.length;

      stepInfo = {
        step: stepNum,
        title: "Consume Remaining Bytes",
        description: `Consume ${remainingBytes.length} remaining bytes as raw data`,
        explanation: "When no specific parser logic matches, remaining bytes are consumed as raw payload data.",
        values: { "Remaining Bytes": `${remainingBytes.length}`, "Raw Data (Hex)": hexDump(remainingBytes) },
      };
    }

    workingState.position = position;
    workingState.history = [...workingState.history, stepInfo];

    return { parserState: workingState, stepInfo };
  } catch (error) {
    return {
      parserState: workingState,
      stepInfo: {
        step: stepNum,
        title: "Parse Error",
        description: `Error: ${error.message}`,
        explanation: "An error occurred during parsing. This could indicate corrupted data or an unexpected packet format.",
        values: { Error: error.message, Position: `${position}/${bytes.length}` },
      },
    };
  }
};

export default parsePacketStep;
