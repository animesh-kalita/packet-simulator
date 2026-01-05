export const BHARAT_101_FIELDS = [
  { index: 0, key: "header", label: "Header", default: "$Header" },
  { index: 1, key: "vendor", label: "Vendor", default: "iTriangle" },
  {
    index: 2,
    key: "firmware",
    label: "Firmware / Model",
    default: "TB040000_A02_0004",
  },
  { index: 3, key: "packetType", label: "Packet Type", default: "NR" },
  { index: 4, key: "version", label: "Message Version", default: "1" },
  { index: 5, key: "liveFlag", label: "Live / History (L/H)", default: "L" },

  { index: 6, key: "imei", label: "IMEI", default: "123456789101112" },
  { index: 7, key: "vehicleNo", label: "Vehicle Reg No", default: "KA1234" },
  { index: 8, key: "ignition", label: "Ignition (0/1)", default: "1" },

  { index: 9, key: "date", label: "Date (DDMMYYYY)", default: "04012026" },
  { index: 10, key: "time", label: "Time (HHMMSS)", default: "153216" },

  { index: 11, key: "latitude", label: "Latitude", default: "13.058544" },
  { index: 12, key: "latDir", label: "Lat Dir (N/S)", default: "N" },
  { index: 13, key: "longitude", label: "Longitude", default: "77.439964" },
  { index: 14, key: "lonDir", label: "Lon Dir (E/W)", default: "E" },

  { index: 15, key: "speed", label: "Speed (km/h)", default: "0.0" },
  { index: 16, key: "heading", label: "Heading", default: "153" },
  { index: 17, key: "satellites", label: "Satellites", default: "37" },
  { index: 18, key: "altitude", label: "Altitude (m)", default: "862.0" },

  { index: 19, key: "hdop", label: "HDOP", default: "0.83" },
  { index: 20, key: "vdop", label: "VDOP", default: "0.45" },

  { index: 21, key: "operator", label: "GSM Operator", default: "IND airtel" },
  { index: 22, key: "gsmSignal", label: "GSM Signal", default: "0" },
  {
    index: 23,
    key: "networkReg",
    label: "Network Registered (0/1)",
    default: "1",
  },

  {
    index: 24,
    key: "extBattery",
    label: "External Battery (V)",
    default: "24.6",
  },
  {
    index: 25,
    key: "intBattery",
    label: "Internal Battery (V)",
    default: "4.2",
  },
  { index: 26, key: "charging", label: "Charging (0/1)", default: "0" },

  { index: 27, key: "gpsFix", label: "GPS Fix (A/V/C)", default: "C" },

  { index: 28, key: "mcc", label: "MCC", default: "31" },
  { index: 29, key: "mnc", label: "MNC", default: "404" },
  { index: 30, key: "lac", label: "LAC", default: "45" },
  { index: 31, key: "cellId", label: "Cell ID", default: "1bd1" },
  { index: 32, key: "extCell", label: "Extended Cell", default: "2c6330d" },

  ...Array.from({ length: 12 }).map((_, i) => ({
    index: 33 + i,
    key: `reserved_${33 + i}`,
    label: `Reserved ${33 + i}`,
    default: "0",
  })),

  { index: 45, key: "alarmBits", label: "Alarm Bits", default: "0000" },
  { index: 46, key: "eventBits", label: "Event Bits", default: "0000" },

  { index: 47, key: "odometer", label: "Odometer", default: "478879" },

  { index: 48, key: "accX", label: "Accel X", default: "0.000" },
  { index: 49, key: "accY", label: "Accel Y", default: "0.000" },
  { index: 50, key: "accZ", label: "Accel Z", default: "0.000" },

  {
    index: 51,
    key: "checksum",
    label: "Checksum + Battery %",
    default: "()*57",
  },
];
