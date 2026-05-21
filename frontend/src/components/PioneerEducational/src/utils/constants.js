export const MSG_LOGIN = 0x01;
export const MSG_GPS = 0x02;
export const MSG_HEARTBEAT = 0x03;
export const MSG_ALARM = 0x04;
export const MSG_NETWORK = 0x05;
export const MSG_DRIVER_BEHAVIOR_1 = 0x15;
export const MSG_DRIVER_BEHAVIOR_2 = 0x06;
export const MSG_BLE = 0x10;
export const MSG_NETWORK_2 = 0x11;
export const MSG_BLE_LOCATION = 0x12;
export const MSG_GPS_2 = 0x13;
export const MSG_ALARM_2 = 0x14;
export const MSG_MANUAL_CAN = 0x44;
export const MSG_PIONEER_X_33 = 0x33;
export const MSG_PIONEER_X = 0x34;
export const MSG_COMMAND = 0x81;

export const PACKET_TYPES = {
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
};
// Header Constants
export const HEADERS = {
  DEFAULT: 0x2323,
  ALT_1: 0x2727,
  ALT_2: 0x2626,
  PIONEER: 0x2525,
};

// Packet Templates (real sample hex data)
export const PACKET_TEMPLATES = {
  GPS_PACKET: {
    name: "Standard GPS Packet (0x2525)",
    description: "GPS tracking packet with position, speed, and sensor data",
    hex: "2525130059E1600123456789101112000A001E1E000000414C0000050000004100000000000000FFFFFFFFFFFF00D5000186CB0026010816364466E64243B1489A428D68E541000000F003901257FFFFFF0000180000FFFFFF",
    type: PACKET_TYPES.MSG_GPS_2,
  },
  ALARM_PACKET: {
    name: "Alarm Packet (0x2525)",
    description: "Packet containing alarm/event data with GPS position",
    hex: "2525140059020D0867284063992640000A001E1E00000041490000050000000000000000000000FFFFFFFFFFFF17D5000186CB8926010901320766E64243B1489A428D68E541000000F003871250FFFFFF0000160001FFFFFF",
    type: PACKET_TYPES.MSG_ALARM_2,
  },
  BLE_PACKET: {
    name: "BLE Sensor Packet (0x2525)",
    description: "Bluetooth Low Energy beacon/sensor data packet",
    hex: "2525100013000112345678910111121A05150E101A010001",
    type: PACKET_TYPES.MSG_BLE,
  },
  NETWORK_PACKET: {
    name: "Network Packet (0x2525)",
    description: "Network/communication status packet with BLE MAC data",
    hex: "252505003C000101234567891011120126010914060958866B4276D6E342912AB4411115050526010916020358866B4276D6E342912AB44111150505",
    type: PACKET_TYPES.MSG_NETWORK,
  },
};

// Packet Structure Definitions
export const PACKET_STRUCTURES = {
  [PACKET_TYPES.MSG_GPS]: [
    { name: "Header", bytes: 2, description: "Packet identifier (0x2323)" },
    { name: "Length", bytes: 2, description: "Total packet length" },
    { name: "Index", bytes: 2, description: "Packet sequence number" },
    { name: "IMEI", bytes: 8, description: "Device identifier (BCD encoded)" },
    {
      name: "ACC On Interval",
      bytes: 2,
      description: "ACC on timeout interval",
    },
    {
      name: "ACC Off Interval",
      bytes: 2,
      description: "ACC off timeout interval",
    },
    {
      name: "Angle Compensation",
      bytes: 1,
      description: "Sensor angle compensation",
    },
    {
      name: "Distance Compensation",
      bytes: 2,
      description: "Odometer distance compensation",
    },
    {
      name: "Speed Compensation",
      bytes: 1,
      description: "Speed compensation value",
    },
    {
      name: "GPS Signal",
      bytes: 1,
      description: "GPS signal strength indicator",
    },
    {
      name: "Status Byte",
      bytes: 1,
      description: "Contains satellites, event code, GPS status",
    },
    { name: "GSensor Status", bytes: 1, description: "GSensor manager status" },
    { name: "Other Flags", bytes: 1, description: "Additional device flags" },
    { name: "Heartbeat", bytes: 1, description: "Device heartbeat counter" },
    { name: "Relay Status", bytes: 1, description: "Relay output status" },
    {
      name: "Drag Alarm Setting",
      bytes: 2,
      description: "Drag/sensitivity alarm threshold",
    },
    { name: "IO Status", bytes: 2, description: "Input/output pin status" },
    {
      name: "ADC Values",
      bytes: 4,
      description: "Analog to digital converter readings",
    },
    {
      name: "Distance Value",
      bytes: 4,
      description: "Odometer distance value",
    },
    { name: "Alarm Byte", bytes: 1, description: "Alarm/event indicators" },
    { name: "Reserved", bytes: 1, description: "Reserved for future use" },
    { name: "Odometer", bytes: 4, description: "Total odometer reading" },
    {
      name: "Battery Info",
      bytes: 2,
      description: "Battery voltage information",
    },
    { name: "Date", bytes: 4, description: "UTC date timestamp" },
    { name: "Altitude", bytes: 4, description: "GPS altitude (float LE)" },
    { name: "Longitude", bytes: 4, description: "GPS longitude (float LE)" },
    { name: "Latitude", bytes: 4, description: "GPS latitude (float LE)" },
    { name: "Speed", bytes: 4, description: "GPS speed value" },
    { name: "Padding", bytes: 2, description: "Alignment padding" },
  ],
  [PACKET_TYPES.MSG_BLE_LOCATION]: [
    { name: "Header", bytes: 2, description: "Packet identifier (0x2323)" },
    { name: "Length", bytes: 2, description: "Total packet length" },
    { name: "Index", bytes: 2, description: "Packet sequence number" },
    { name: "IMEI", bytes: 8, description: "Device identifier (BCD encoded)" },
    { name: "Year", bytes: 1, description: "Year offset from 2000" },
    { name: "Month", bytes: 1, description: "Month (1-12)" },
    { name: "Day", bytes: 1, description: "Day of month" },
    { name: "Hour", bytes: 1, description: "Hour (0-23)" },
    { name: "Minute", bytes: 1, description: "Minute (0-59)" },
    { name: "Second", bytes: 1, description: "Second (0-59)" },
    { name: "ACC Status", bytes: 1, description: "Accessory status" },
    {
      name: "Data/GNSS Status",
      bytes: 1,
      description: "Contains satellites, event code, GPS status",
    },
    { name: "Altitude", bytes: 4, description: "GPS altitude (float LE)" },
    { name: "Longitude", bytes: 4, description: "GPS longitude (float LE)" },
    { name: "Latitude", bytes: 4, description: "GPS latitude (float LE)" },
    { name: "Speed", bytes: 2, description: "Speed value (raw)" },
    { name: "Direction", bytes: 2, description: "Direction heading" },
    {
      name: "BLE Data Code",
      bytes: 2,
      description: "BLE sensor type identifier",
    },
  ],
  [PACKET_TYPES.MSG_GPS_2]: [
    { name: "Header", bytes: 2, description: "Packet identifier" },
    { name: "Length", bytes: 2, description: "Total packet length" },
    { name: "Index", bytes: 2, description: "Packet sequence number" },
    { name: "IMEI", bytes: 8, description: "Device identifier (BCD encoded)" },
    { name: "Protocol/Config", bytes: 6, description: "Protocol version & configuration flags" },
    { name: "Status", bytes: 2, description: "Device status flags" },
    { name: "GPS Data", bytes: 20, description: "Latitude, longitude, altitude, speed, direction" },
    { name: "Timestamp", bytes: 6, description: "Date/time of fix" },
    { name: "IO/ADC", bytes: 16, description: "IO status, ADC values, battery" },
    { name: "Reserved", bytes: 4, description: "Reserved bytes" },
  ],
  [PACKET_TYPES.MSG_ALARM_2]: [
    { name: "Header", bytes: 2, description: "Packet identifier" },
    { name: "Length", bytes: 2, description: "Total packet length" },
    { name: "Index", bytes: 2, description: "Packet sequence number" },
    { name: "IMEI", bytes: 8, description: "Device identifier (BCD encoded)" },
    { name: "Alarm Type", bytes: 8, description: "Alarm classification data" },
    { name: "Status", bytes: 2, description: "Device status flags" },
    { name: "GPS Data", bytes: 20, description: "Latitude, longitude, altitude, speed, direction" },
    { name: "Timestamp", bytes: 6, description: "Date/time of alarm" },
    { name: "IO/ADC", bytes: 16, description: "IO status, ADC values, battery" },
  ],
  [PACKET_TYPES.MSG_BLE]: [
    { name: "Header", bytes: 2, description: "Packet identifier (0x2525)" },
    { name: "Length", bytes: 2, description: "Total packet length" },
    { name: "Index", bytes: 2, description: "Packet sequence number" },
    { name: "IMEI", bytes: 8, description: "Device identifier (BCD encoded)" },
    { name: "BLE Data", bytes: 5, description: "BLE beacon payload" },
    { name: "RSSI", bytes: 1, description: "Signal strength indicator" },
  ],
  [PACKET_TYPES.MSG_NETWORK]: [
    { name: "Header", bytes: 2, description: "Packet identifier (0x2525)" },
    { name: "Length", bytes: 2, description: "Total packet length" },
    { name: "Index", bytes: 2, description: "Packet sequence number" },
    { name: "IMEI", bytes: 8, description: "Device identifier (BCD encoded)" },
    { name: "Network Data", bytes: 46, description: "Network status and BLE MAC entries" },
  ],
};
