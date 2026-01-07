import React, { useState, useEffect } from "react";

// Pioneer Protocol Field Definitions
const PIONEER_FIELDS = [
  {
    index: 0,
    key: "header",
    label: "Header",
    bytes: 2,
    type: "HEX",
    default: "2525",
    desc: "Always 0x25 0x25",
  },
  {
    index: 1,
    key: "messageType",
    label: "Message Type",
    bytes: 1,
    type: "HEX",
    default: "13",
    desc: "Position Message",
  },
  {
    index: 2,
    key: "packetLength",
    label: "Packet Length",
    bytes: 2,
    type: "HEX",
    default: "004B",
    desc: "Total packet length",
  },
  {
    index: 3,
    key: "serialNumber",
    label: "Serial Number",
    bytes: 2,
    type: "HEX",
    default: "0001",
    desc: "Sequence ID",
  },
  {
    index: 4,
    key: "imei",
    label: "IMEI Number",
    bytes: 8,
    type: "BCD",
    default: "1234567890123456",
    desc: "Device ID (BCD)",
  },
  {
    index: 5,
    key: "ignitionOnInterval",
    label: "Ignition ON Interval",
    bytes: 2,
    type: "HEX",
    default: "000A",
    desc: "Upload freq (seconds)",
  },
  {
    index: 6,
    key: "ignitionOffInterval",
    label: "Ignition OFF Interval",
    bytes: 2,
    type: "HEX",
    default: "003C",
    desc: "Upload freq (seconds)",
  },
  {
    index: 7,
    key: "angleUploadInterval",
    label: "Angle Upload Interval",
    bytes: 1,
    type: "HEX",
    default: "0F",
    desc: "Threshold (degrees)",
  },
  {
    index: 8,
    key: "distanceUploadInterval",
    label: "Distance Upload Interval",
    bytes: 2,
    type: "HEX",
    default: "0064",
    desc: "Threshold (meters)",
  },
  {
    index: 9,
    key: "overSpeedAlarm",
    label: "Over Speed Alarm",
    bytes: 1,
    type: "HEX",
    default: "50",
    desc: "Speed limit",
  },
  {
    index: 10,
    key: "signalStrength",
    label: "Signal Strength",
    bytes: 1,
    type: "HEX",
    default: "64",
    desc: "GSM signal %",
  },
  {
    index: 11,
    key: "dataGnssStatus",
    label: "Data & GNSS Status",
    bytes: 1,
    type: "Bitmask",
    default: "A0",
    desc: "GPS validity",
  },
  {
    index: 12,
    key: "gsensorStatus",
    label: "Gsensor & Manager Status",
    bytes: 1,
    type: "Bitmask",
    default: "00",
    desc: "Motion flags",
  },
  {
    index: 13,
    key: "othersStatus",
    label: "Others Status",
    bytes: 1,
    type: "HEX",
    default: "00",
    desc: "Additional status",
  },
  {
    index: 14,
    key: "heartbeat",
    label: "Heartbeat",
    bytes: 1,
    type: "HEX",
    default: "05",
    desc: "Minutes between",
  },
  {
    index: 15,
    key: "relayStatus",
    label: "Relay Status",
    bytes: 1,
    type: "HEX",
    default: "00",
    desc: "Engine cut-off",
  },
  {
    index: 16,
    key: "dragAlarm",
    label: "Drag Alarm Setting",
    bytes: 2,
    type: "HEX",
    default: "0032",
    desc: "Distance threshold",
  },
  {
    index: 17,
    key: "digitalIO",
    label: "Digital I/O Status",
    bytes: 2,
    type: "HEX",
    default: "0000",
    desc: "Input pin states",
  },
  {
    index: 18,
    key: "digitalOut",
    label: "Digital OUT",
    bytes: 1,
    type: "HEX",
    default: "00",
    desc: "Output states",
  },
  {
    index: 19,
    key: "reserved1",
    label: "Reserved",
    bytes: 1,
    type: "HEX",
    default: "00",
    desc: "Reserved",
  },
  {
    index: 20,
    key: "analog1",
    label: "Analog Input 1",
    bytes: 2,
    type: "HEX",
    default: "0000",
    desc: "Voltage (V)",
  },
  {
    index: 21,
    key: "analog2",
    label: "Analog Input 2",
    bytes: 2,
    type: "HEX",
    default: "0000",
    desc: "Voltage (V)",
  },
  {
    index: 22,
    key: "analog3",
    label: "Analog Input 3",
    bytes: 2,
    type: "HEX",
    default: "0000",
    desc: "Voltage (V)",
  },
  {
    index: 23,
    key: "multiplex",
    label: "Multiplex Segment",
    bytes: 3,
    type: "Bitmask",
    default: "000000",
    desc: "Data notation",
  },
  {
    index: 24,
    key: "alarmType",
    label: "Alarm Type",
    bytes: 1,
    type: "HEX",
    default: "00",
    desc: "Alarm code",
  },
  {
    index: 25,
    key: "reserved2",
    label: "Reserved",
    bytes: 1,
    type: "HEX",
    default: "00",
    desc: "Reserved",
  },
  {
    index: 26,
    key: "odometer",
    label: "Odometer",
    bytes: 4,
    type: "HEX",
    default: "00000000",
    desc: "Total mileage (m)",
  },
  {
    index: 27,
    key: "batteryPercent",
    label: "Build-in Battery %",
    bytes: 1,
    type: "HEX",
    default: "64",
    desc: "Battery level",
  },
  {
    index: 28,
    key: "timestamp",
    label: "Timestamp",
    bytes: 6,
    type: "BCD",
    default: "260106153045",
    desc: "YY-MM-DD-HH-MM-SS",
  },
  {
    index: 29,
    key: "altitude",
    label: "Altitude",
    bytes: 2,
    type: "HEX",
    default: "0064",
    desc: "Height (m)",
  },
  {
    index: 30,
    key: "longitude",
    label: "Longitude",
    bytes: 4,
    type: "HEX",
    default: "04A3A244",
    desc: "Signed int / 1,000,000",
  },
  {
    index: 31,
    key: "latitude",
    label: "Latitude",
    bytes: 4,
    type: "HEX",
    default: "00C72D18",
    desc: "Signed int / 1,000,000",
  },
  {
    index: 32,
    key: "speed",
    label: "Speed",
    bytes: 2,
    type: "HEX",
    default: "0000",
    desc: "Ground speed (km/h)",
  },
  {
    index: 33,
    key: "direction",
    label: "Direction",
    bytes: 2,
    type: "HEX",
    default: "0099",
    desc: "Heading (degrees)",
  },
  {
    index: 34,
    key: "internalBatteryVoltage",
    label: "Internal Battery Voltage",
    bytes: 2,
    type: "HEX",
    default: "0108",
    desc: "Backup battery (V)",
  },
  {
    index: 35,
    key: "externalPowerSupply",
    label: "External Power Supply",
    bytes: 2,
    type: "HEX",
    default: "0618",
    desc: "Vehicle battery (V)",
  },
];

function encodePioneer(values) {
  let packet = "";
  PIONEER_FIELDS.forEach((field, idx) => {
    const val = values[idx] || field.default;
    packet += val.toUpperCase();
  });
  return packet;
}

function decodePioneer(hexPacket) {
  const clean = hexPacket.replace(/\s/g, "").toUpperCase();
  const decoded = {};
  let offset = 0;

  PIONEER_FIELDS.forEach((field) => {
    const length = field.bytes * 2;
    const hexValue = clean.substr(offset, length);
    decoded[field.key] = hexValue;
    offset += length;
  });

  return decoded;
}

function interpretDecoded(decoded) {
  const result = {};

  // IMEI
  result.imei = {
    raw: decoded.imei,
    value: decoded.imei,
    label: "IMEI Number",
  };

  // Intervals
  result.ignitionOnInterval = {
    raw: decoded.ignitionOnInterval,
    value: parseInt(decoded.ignitionOnInterval, 16) + " seconds",
    label: "Ignition ON Interval",
  };
  result.ignitionOffInterval = {
    raw: decoded.ignitionOffInterval,
    value: parseInt(decoded.ignitionOffInterval, 16) + " seconds",
    label: "Ignition OFF Interval",
  };

  // Thresholds
  result.angleUploadInterval = {
    raw: decoded.angleUploadInterval,
    value: parseInt(decoded.angleUploadInterval, 16) + "°",
    label: "Angle Upload Interval",
  };
  result.distanceUploadInterval = {
    raw: decoded.distanceUploadInterval,
    value: parseInt(decoded.distanceUploadInterval, 16) + " meters",
    label: "Distance Upload Interval",
  };

  // Speed and Alarm
  result.overSpeedAlarm = {
    raw: decoded.overSpeedAlarm,
    value: parseInt(decoded.overSpeedAlarm, 16) + " km/h",
    label: "Over Speed Alarm",
  };
  result.speed = {
    raw: decoded.speed,
    value: parseInt(decoded.speed, 16) + " km/h",
    label: "Speed",
  };

  // Signal Strength
  result.signalStrength = {
    raw: decoded.signalStrength,
    value: parseInt(decoded.signalStrength, 16) + "%",
    label: "GSM Signal Strength",
  };

  // Battery
  result.batteryPercent = {
    raw: decoded.batteryPercent,
    value: parseInt(decoded.batteryPercent, 16) + "%",
    label: "Internal Battery",
  };

  // Odometer
  result.odometer = {
    raw: decoded.odometer,
    value: (parseInt(decoded.odometer, 16) / 1000).toFixed(2) + " km",
    label: "Odometer",
  };

  // Coordinates (signed integer / 1,000,000)
  const lonInt = parseInt(decoded.longitude, 16);
  const latInt = parseInt(decoded.latitude, 16);
  result.longitude = {
    raw: decoded.longitude,
    value: (lonInt / 1000000).toFixed(6) + "°",
    label: "Longitude",
  };
  result.latitude = {
    raw: decoded.latitude,
    value: (latInt / 1000000).toFixed(6) + "°",
    label: "Latitude",
  };

  // Altitude
  result.altitude = {
    raw: decoded.altitude,
    value: parseInt(decoded.altitude, 16) + " m",
    label: "Altitude",
  };

  // Direction
  result.direction = {
    raw: decoded.direction,
    value: parseInt(decoded.direction, 16) + "°",
    label: "Direction/Heading",
  };

  // Voltages
  result.internalBatteryVoltage = {
    raw: decoded.internalBatteryVoltage,
    value:
      (parseInt(decoded.internalBatteryVoltage, 16) / 100).toFixed(2) + " V",
    label: "Internal Battery Voltage",
  };
  result.externalPowerSupply = {
    raw: decoded.externalPowerSupply,
    value: (parseInt(decoded.externalPowerSupply, 16) / 100).toFixed(2) + " V",
    label: "External Power Supply",
  };

  // Timestamp
  const ts = decoded.timestamp;
  result.timestamp = {
    raw: decoded.timestamp,
    value: `20${ts.substr(0, 2)}-${ts.substr(2, 2)}-${ts.substr(
      4,
      2
    )} ${ts.substr(6, 2)}:${ts.substr(8, 2)}:${ts.substr(10, 2)}`,
    label: "Timestamp",
  };

  return result;
}

export default function PioneerDecoder() {
  const [tabValue, setTabValue] = useState(0);
  const [values, setValues] = useState([]);
  const [hexInput, setHexInput] = useState("");
  const [decodedValues, setDecodedValues] = useState({});
  const [interpretedValues, setInterpretedValues] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    setValues(PIONEER_FIELDS.map((f) => f.default));
  }, []);

  const updateValue = (index, value) => {
    setValues((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const copyPacket = async () => {
    const packet = encodePioneer(values);
    await navigator.clipboard.writeText(packet);
    alert("Packet copied to clipboard!");
  };

  const handleDecode = () => {
    try {
      setError("");
      const decoded = decodePioneer(hexInput);
      const interpreted = interpretDecoded(decoded);
      setDecodedValues(decoded);
      setInterpretedValues(interpreted);
    } catch (err) {
      setError("Failed to decode: " + err.message);
    }
  };

  const loadDecodedToEncoder = () => {
    const newValues = PIONEER_FIELDS.map(
      (field) => decodedValues[field.key] || field.default
    );
    setValues(newValues);
    setTabValue(0);
  };

  const styles = {
    container: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "24px",
    },
    paper: {
      maxWidth: "1400px",
      margin: "0 auto",
      background: "white",
      borderRadius: "12px",
      boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      padding: "32px",
    },
    title: {
      fontSize: "32px",
      fontWeight: "bold",
      color: "#667eea",
      marginBottom: "8px",
    },
    subtitle: {
      color: "#666",
      marginBottom: "24px",
    },
    tabContainer: {
      borderBottom: "2px solid #e0e0e0",
      marginBottom: "24px",
      display: "flex",
      gap: "16px",
    },
    tab: {
      padding: "12px 24px",
      background: "none",
      border: "none",
      fontSize: "16px",
      fontWeight: "500",
      cursor: "pointer",
      borderBottom: "3px solid transparent",
      transition: "all 0.3s",
    },
    tabActive: {
      color: "#667eea",
      borderBottomColor: "#667eea",
    },
    tabInactive: {
      color: "#999",
    },
    sectionTitle: {
      fontSize: "20px",
      fontWeight: "600",
      marginBottom: "16px",
      color: "#333",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
      gap: "16px",
      marginBottom: "24px",
    },
    inputGroup: {
      marginBottom: "0",
    },
    label: {
      display: "block",
      fontSize: "13px",
      fontWeight: "600",
      color: "#555",
      marginBottom: "6px",
    },
    input: {
      width: "100%",
      padding: "10px 12px",
      border: "2px solid #e0e0e0",
      borderRadius: "6px",
      fontSize: "14px",
      fontFamily: "monospace",
      transition: "border-color 0.3s",
      boxSizing: "border-box",
    },
    inputFocus: {
      outline: "none",
      borderColor: "#667eea",
    },
    helperText: {
      fontSize: "11px",
      color: "#999",
      marginTop: "4px",
    },
    textarea: {
      width: "100%",
      padding: "12px",
      border: "2px solid #e0e0e0",
      borderRadius: "6px",
      fontSize: "13px",
      fontFamily: "monospace",
      resize: "vertical",
      boxSizing: "border-box",
    },
    button: {
      padding: "12px 32px",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: "16px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "transform 0.2s, box-shadow 0.2s",
      boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
    },
    buttonOutline: {
      padding: "10px 24px",
      background: "white",
      color: "#667eea",
      border: "2px solid #667eea",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      marginBottom: "24px",
    },
    error: {
      background: "#fee",
      border: "1px solid #fcc",
      borderRadius: "6px",
      padding: "12px",
      color: "#c33",
      marginBottom: "16px",
    },
    interpretedCard: {
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      borderRadius: "8px",
      padding: "16px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    },
    interpretedLabel: {
      fontSize: "12px",
      color: "#666",
      marginBottom: "4px",
      fontWeight: "600",
    },
    interpretedValue: {
      fontSize: "18px",
      fontWeight: "bold",
      color: "#333",
      marginBottom: "4px",
    },
    interpretedRaw: {
      fontSize: "11px",
      color: "#999",
      fontFamily: "monospace",
    },
    divider: {
      height: "1px",
      background: "#e0e0e0",
      margin: "24px 0",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.paper}>
        <h1 style={styles.title}>Pioneer Protocol Decoder/Encoder</h1>
        <p style={styles.subtitle}>
          Message Type: 0x13 (Position Message) - Full Protocol Implementation
        </p>

        <div style={styles.tabContainer}>
          <button
            onClick={() => setTabValue(0)}
            style={{
              ...styles.tab,
              ...(tabValue === 0 ? styles.tabActive : styles.tabInactive),
            }}
          >
            Encoder (Build Packet)
          </button>
          <button
            onClick={() => setTabValue(1)}
            style={{
              ...styles.tab,
              ...(tabValue === 1 ? styles.tabActive : styles.tabInactive),
            }}
          >
            Decoder (Parse Packet)
          </button>
        </div>

        {tabValue === 0 && (
          <div>
            <h2 style={styles.sectionTitle}>Configure Protocol Fields</h2>

            <div style={styles.grid}>
              {PIONEER_FIELDS.map((field, idx) => (
                <div key={field.key} style={styles.inputGroup}>
                  <label style={styles.label}>
                    [{field.bytes}B] {field.label}
                  </label>
                  <input
                    type="text"
                    value={values[idx] || ""}
                    onChange={(e) =>
                      updateValue(idx, e.target.value.toUpperCase())
                    }
                    maxLength={field.bytes * 2}
                    style={styles.input}
                    onFocus={(e) => (e.target.style.borderColor = "#667eea")}
                    onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
                  />
                  <p style={styles.helperText}>{field.desc}</p>
                </div>
              ))}
            </div>

            <div style={styles.divider}></div>

            <div style={{ marginBottom: "16px" }}>
              <label style={styles.label}>Generated HEX Packet</label>
              <textarea
                value={encodePioneer(values)}
                readOnly
                rows={4}
                style={{ ...styles.textarea, background: "#f5f5f5" }}
              />
            </div>

            <button
              style={styles.button}
              onClick={copyPacket}
              onMouseEnter={(e) =>
                (e.target.style.transform = "translateY(-2px)")
              }
              onMouseLeave={(e) => (e.target.style.transform = "translateY(0)")}
            >
              Copy Packet to Clipboard
            </button>
          </div>
        )}

        {tabValue === 1 && (
          <div>
            <h2 style={styles.sectionTitle}>Paste HEX Packet to Decode</h2>

            <div style={{ marginBottom: "16px" }}>
              <label style={styles.label}>Raw HEX Packet Input</label>
              <textarea
                value={hexInput}
                onChange={(e) => setHexInput(e.target.value)}
                rows={3}
                placeholder="Paste hex packet here (e.g., 252513004B0001...)"
                style={styles.textarea}
              />
            </div>

            <button
              style={styles.button}
              onClick={handleDecode}
              onMouseEnter={(e) =>
                (e.target.style.transform = "translateY(-2px)")
              }
              onMouseLeave={(e) => (e.target.style.transform = "translateY(0)")}
            >
              Decode Packet
            </button>

            {error && <div style={styles.error}>{error}</div>}

            {Object.keys(decodedValues).length > 0 && (
              <>
                <button
                  style={styles.buttonOutline}
                  onClick={loadDecodedToEncoder}
                >
                  Load Decoded Values to Encoder
                </button>

                <h3 style={styles.sectionTitle}>
                  Human-Readable Interpreted Values
                </h3>
                <div style={styles.grid}>
                  {Object.entries(interpretedValues).map(([key, data]) => (
                    <div key={key} style={styles.interpretedCard}>
                      <div style={styles.interpretedLabel}>{data.label}</div>
                      <div style={styles.interpretedValue}>{data.value}</div>
                      <div style={styles.interpretedRaw}>RAW: {data.raw}</div>
                    </div>
                  ))}
                </div>

                <div style={styles.divider}></div>

                <h3 style={styles.sectionTitle}>
                  All Raw Decoded Fields (HEX)
                </h3>
                <div style={styles.grid}>
                  {PIONEER_FIELDS.map((field) => (
                    <div key={field.key} style={styles.inputGroup}>
                      <label style={styles.label}>
                        [{field.bytes}B] {field.label}
                      </label>
                      <input
                        type="text"
                        value={decodedValues[field.key] || ""}
                        readOnly
                        style={{ ...styles.input, background: "#f5f5f5" }}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
