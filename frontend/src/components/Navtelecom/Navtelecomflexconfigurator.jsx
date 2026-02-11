import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  TextField,
  Button,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Paper,
  Divider,
  FormControlLabel,
  Alert,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SettingsIcon from "@mui/icons-material/Settings";
import DataObjectIcon from "@mui/icons-material/DataObject";

// Field definitions based on Parser_Navtelecom.java
const FIELD_DEFINITIONS = {
  1: { name: "Index", length: 4, type: "U32", description: "Message index" },
  2: { name: "Event", length: 2, type: "U16", description: "Event code" },
  3: {
    name: "Timestamp",
    length: 4,
    type: "U32",
    description: "Unix timestamp (seconds)",
  },
  4: {
    name: "Device Status",
    length: 1,
    type: "U8",
    description: "Device status bit field",
  },
  5: {
    name: "GSM Info",
    length: 1,
    type: "U8",
    description: "GSM information",
  },
  7: {
    name: "GSM Signal",
    length: 1,
    type: "U8",
    description: "GSM signal strength (0-31, 99)",
  },
  8: {
    name: "GPS Status",
    length: 1,
    type: "U8",
    description: "GPS status and satellites",
  },
  9: {
    name: "Fix Time",
    length: 4,
    type: "U32",
    description: "GPS fix timestamp",
  },
  10: {
    name: "Latitude",
    length: 4,
    type: "I32",
    description: "Latitude * 600000",
  },
  11: {
    name: "Longitude",
    length: 4,
    type: "I32",
    description: "Longitude * 600000",
  },
  12: {
    name: "Altitude",
    length: 4,
    type: "I32",
    description: "Altitude * 10 (meters)",
  },
  13: { name: "Speed", length: 4, type: "F32", description: "Speed (km/h)" },
  14: {
    name: "Course",
    length: 2,
    type: "U16",
    description: "Course (degrees)",
  },
  15: {
    name: "Odometer",
    length: 4,
    type: "F32",
    description: "Odometer (km)",
  },
  19: {
    name: "Ext Battery",
    length: 2,
    type: "I16",
    description: "External battery (mV)",
  },
  20: {
    name: "Int Battery",
    length: 2,
    type: "I16",
    description: "Internal battery (mV)",
  },
  21: {
    name: "ADC 1",
    length: 2,
    type: "U16",
    description: "ADC input 1 (mV)",
  },
  22: {
    name: "ADC 2",
    length: 2,
    type: "U16",
    description: "ADC input 2 (mV)",
  },
  23: {
    name: "ADC 3",
    length: 2,
    type: "U16",
    description: "ADC input 3 (mV)",
  },
  24: {
    name: "ADC 4",
    length: 2,
    type: "U16",
    description: "ADC input 4 (mV)",
  },
  25: {
    name: "ADC 5",
    length: 2,
    type: "U16",
    description: "ADC input 5 (mV)",
  },
  26: {
    name: "ADC 6",
    length: 2,
    type: "U16",
    description: "ADC input 6 (mV)",
  },
  29: {
    name: "Digital Inputs",
    length: 1,
    type: "U8",
    description: "Digital inputs 1-8",
  },
  31: {
    name: "Digital Outputs",
    length: 1,
    type: "U8",
    description: "Digital outputs 1-4",
  },
  33: { name: "Counter 1", length: 4, type: "U32", description: "Counter 1" },
  34: { name: "Counter 2", length: 4, type: "U32", description: "Counter 2" },
  35: {
    name: "Fuel Freq 1",
    length: 2,
    type: "U16",
    description: "Fuel sensor 1 frequency (Hz)",
  },
  36: {
    name: "Fuel Freq 2",
    length: 2,
    type: "U16",
    description: "Fuel sensor 2 frequency (Hz)",
  },
  37: {
    name: "Engine Hours",
    length: 4,
    type: "U32",
    description: "Engine hours (seconds)",
  },
  38: {
    name: "Fuel Level 1",
    length: 2,
    type: "U16",
    description: "Fuel level 1 (liters)",
  },
  39: {
    name: "Fuel Level 2",
    length: 2,
    type: "U16",
    description: "Fuel level 2 (liters)",
  },
  40: {
    name: "Fuel Level 3",
    length: 2,
    type: "U16",
    description: "Fuel level 3 (liters)",
  },
  41: {
    name: "Fuel Level 4",
    length: 2,
    type: "U16",
    description: "Fuel level 4 (liters)",
  },
  42: {
    name: "Fuel Level 5",
    length: 2,
    type: "U16",
    description: "Fuel level 5 (liters)",
  },
  43: {
    name: "Fuel Level 6",
    length: 2,
    type: "U16",
    description: "Fuel level 6 (liters)",
  },
  44: {
    name: "Fuel Level",
    length: 2,
    type: "U16",
    description: "Main fuel level (liters)",
  },
  45: {
    name: "Temp 1",
    length: 1,
    type: "I8",
    description: "Temperature 1 (°C)",
  },
  46: {
    name: "Temp 2",
    length: 1,
    type: "I8",
    description: "Temperature 2 (°C)",
  },
  47: {
    name: "Temp 3",
    length: 1,
    type: "I8",
    description: "Temperature 3 (°C)",
  },
  48: {
    name: "Temp 4",
    length: 1,
    type: "I8",
    description: "Temperature 4 (°C)",
  },
  49: {
    name: "Temp 5",
    length: 1,
    type: "I8",
    description: "Temperature 5 (°C)",
  },
  50: {
    name: "Temp 6",
    length: 1,
    type: "I8",
    description: "Temperature 6 (°C)",
  },
  51: {
    name: "Temp 7",
    length: 1,
    type: "I8",
    description: "Temperature 7 (°C)",
  },
  52: {
    name: "Temp 8",
    length: 1,
    type: "I8",
    description: "Temperature 8 (°C)",
  },
  53: {
    name: "OBD Fuel",
    length: 2,
    type: "U16",
    description: "OBD fuel level/consumption",
  },
  54: {
    name: "Fuel Used",
    length: 4,
    type: "F32",
    description: "Fuel used (liters)",
  },
  55: { name: "RPM", length: 2, type: "U16", description: "Engine RPM" },
  56: {
    name: "Coolant Temp",
    length: 1,
    type: "I8",
    description: "Coolant temperature (°C)",
  },
  57: {
    name: "OBD Odometer",
    length: 4,
    type: "F32",
    description: "OBD odometer (km)",
  },
  58: {
    name: "Axle Weight 1",
    length: 2,
    type: "U16",
    description: "Axle weight 1 (kg)",
  },
  59: {
    name: "Axle Weight 2",
    length: 2,
    type: "U16",
    description: "Axle weight 2 (kg)",
  },
  60: {
    name: "Axle Weight 3",
    length: 2,
    type: "U16",
    description: "Axle weight 3 (kg)",
  },
  61: {
    name: "Axle Weight 4",
    length: 2,
    type: "U16",
    description: "Axle weight 4 (kg)",
  },
  62: {
    name: "Axle Weight 5",
    length: 2,
    type: "U16",
    description: "Axle weight 5 (kg)",
  },
  63: {
    name: "Accelerator Pos",
    length: 1,
    type: "U8",
    description: "Accelerator position (%)",
  },
  64: {
    name: "Brake Pos",
    length: 1,
    type: "U8",
    description: "Brake position (%)",
  },
  65: {
    name: "Engine Load",
    length: 1,
    type: "U8",
    description: "Engine load (%)",
  },
  66: {
    name: "AdBlue",
    length: 2,
    type: "U16",
    description: "AdBlue level/consumption",
  },
  67: {
    name: "OBD Hours",
    length: 4,
    type: "U32",
    description: "OBD engine hours (seconds)",
  },
  68: {
    name: "Service Odo",
    length: 2,
    type: "U16",
    description: "Service odometer (km)",
  },
  69: {
    name: "OBD Speed",
    length: 1,
    type: "U8",
    description: "OBD speed (km/h)",
  },
  70: {
    name: "Navigation Info",
    length: 8,
    type: "U8[8]",
    description: "Satellite systems info",
  },
  71: {
    name: "HDOP/PDOP",
    length: 2,
    type: "U8[2]",
    description: "HDOP and PDOP * 10",
  },
  78: {
    name: "Fuel Temp 1",
    length: 1,
    type: "I8",
    description: "Fuel temperature 1 (°C)",
  },
  79: {
    name: "Fuel Temp 2",
    length: 1,
    type: "I8",
    description: "Fuel temperature 2 (°C)",
  },
  80: {
    name: "Fuel Temp 3",
    length: 1,
    type: "I8",
    description: "Fuel temperature 3 (°C)",
  },
  81: {
    name: "Fuel Temp 4",
    length: 1,
    type: "I8",
    description: "Fuel temperature 4 (°C)",
  },
  82: {
    name: "Fuel Temp 5",
    length: 1,
    type: "I8",
    description: "Fuel temperature 5 (°C)",
  },
  83: {
    name: "Fuel Temp 6",
    length: 1,
    type: "I8",
    description: "Fuel temperature 6 (°C)",
  },
  123: {
    name: "Device Status 2",
    length: 1,
    type: "U8",
    description: "Device status 2 bit field",
  },
  124: {
    name: "Function Modules",
    length: 1,
    type: "U8",
    description: "Function modules status",
  },
  125: {
    name: "Communication",
    length: 1,
    type: "U8",
    description: "Communication status",
  },
  139: {
    name: "Accelerometer",
    length: 1,
    type: "U8",
    description: "Accelerometer sensors",
  },
  140: {
    name: "Int Tilt Angle",
    length: 1,
    type: "U8",
    description: "Internal tilt angle * 4",
  },
  141: {
    name: "Int Tilt Sensor",
    length: 2,
    type: "I8[2]",
    description: "Pitch and roll angles",
  },
  142: {
    name: "Ext Tilt Sensor",
    length: 3,
    type: "U8[3]",
    description: "External tilt X,Y,Z",
  },
  163: {
    name: "Temp 9",
    length: 2,
    type: "I16",
    description: "Temperature 9 * 20 (°C)",
  },
  164: {
    name: "Temp 10",
    length: 2,
    type: "I16",
    description: "Temperature 10 * 20 (°C)",
  },
  165: {
    name: "Temp 11",
    length: 2,
    type: "I16",
    description: "Temperature 11 * 20 (°C)",
  },
  166: {
    name: "Temp 12",
    length: 2,
    type: "I16",
    description: "Temperature 12 * 20 (°C)",
  },
  167: {
    name: "Humidity 1",
    length: 1,
    type: "U8",
    description: "Humidity 1 * 2 (%)",
  },
  168: {
    name: "Humidity 2",
    length: 1,
    type: "U8",
    description: "Humidity 2 * 2 (%)",
  },
  169: {
    name: "Humidity 3",
    length: 1,
    type: "U8",
    description: "Humidity 3 * 2 (%)",
  },
  170: {
    name: "Humidity 4",
    length: 1,
    type: "U8",
    description: "Humidity 4 * 2 (%)",
  },
  200: {
    name: "Geofences",
    length: 2,
    type: "U16",
    description: "Geofence status bits 1-10",
  },
  206: {
    name: "Diagnostic",
    length: 4,
    type: "U32",
    description: "Diagnostic code",
  },
};

// Group fields by category
const FIELD_CATEGORIES = {
  "Basic Info": [1, 2, 3, 4, 5, 7, 8],
  "GPS Data": [9, 10, 11, 12, 13, 14, 15, 70, 71],
  Power: [19, 20],
  "Analog Inputs": [21, 22, 23, 24, 25, 26],
  "Digital I/O": [29, 31, 33, 34],
  Fuel: [35, 36, 38, 39, 40, 41, 42, 43, 44, 53, 54, 78, 79, 80, 81, 82, 83],
  Temperature: [45, 46, 47, 48, 49, 50, 51, 52, 56, 163, 164, 165, 166],
  Humidity: [167, 168, 169, 170],
  "Engine (OBD)": [37, 55, 57, 65, 67, 68, 69],
  Vehicle: [58, 59, 60, 61, 62, 63, 64, 66],
  Sensors: [123, 124, 125, 139, 140, 141, 142],
  Other: [200, 206],
};

const NavtelecomFlexConfigurator = () => {
  const [enabledFields, setEnabledFields] = useState({});
  const [fieldValues, setFieldValues] = useState({});
  const [flexHex, setFlexHex] = useState("");
  const [gpsDataHex, setGpsDataHex] = useState("");
  const [messageCount, setMessageCount] = useState(1);
  const [protocol, setProtocol] = useState("1");
  const [protocolVersion, setProtocolVersion] = useState("5");
  const [structVersion, setStructVersion] = useState("7");

  // Initialize with some common fields enabled
  useEffect(() => {
    const initialFields = {
      3: true, // Timestamp
      8: true, // GPS Status
      10: true, // Latitude
      11: true, // Longitude
      13: true, // Speed
      14: true, // Course
    };
    const initialValues = {
      3: Math.floor(Date.now() / 1000).toString(),
      8: "12", // Valid GPS with 4 satellites
      10: "2074567800", // Example latitude
      11: "4947001400", // Example longitude
      13: "50.5",
      14: "180",
    };
    setEnabledFields(initialFields);
    setFieldValues(initialValues);
  }, []);

  const toggleField = (fieldId) => {
    setEnabledFields((prev) => ({
      ...prev,
      [fieldId]: !prev[fieldId],
    }));

    if (!enabledFields[fieldId] && !fieldValues[fieldId]) {
      setFieldValues((prev) => ({
        ...prev,
        [fieldId]: getDefaultValue(fieldId),
      }));
    }
  };

  const getDefaultValue = (fieldId) => {
    const field = FIELD_DEFINITIONS[fieldId];
    if (!field) return "0";

    switch (fieldId) {
      case 3:
        return Math.floor(Date.now() / 1000).toString();
      case 10:
        return "2074567800";
      case 11:
        return "4947001400";
      case 12:
        return "5000";
      case 13:
        return "50.0";
      case 14:
        return "180";
      default:
        return "0";
    }
  };

  const updateFieldValue = (fieldId, value) => {
    setFieldValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const calculateXOR = (hexString) => {
    let checksum = 0;
    for (let i = 0; i < hexString.length; i += 2) {
      checksum ^= parseInt(hexString.substr(i, 2), 16);
    }
    return checksum.toString(16).padStart(2, "0");
  };

  const calculateCRC8EGTS = (hexString) => {
    const bytes = [];
    for (let i = 0; i < hexString.length; i += 2) {
      bytes.push(parseInt(hexString.substr(i, 2), 16));
    }

    let crc = 0xff;
    for (const byte of bytes) {
      crc ^= byte;
      for (let i = 0; i < 8; i++) {
        if (crc & 0x80) {
          crc = (crc << 1) ^ 0x31;
        } else {
          crc = crc << 1;
        }
      }
      crc &= 0xff;
    }
    return crc.toString(16).padStart(2, "0");
  };

  // Generate FLEX configuration message
  const generateFlexHex = () => {
    try {
      const sortedFieldIds = Object.keys(enabledFields)
        .filter((id) => enabledFields[id])
        .map((id) => parseInt(id))
        .sort((a, b) => a - b);

      if (sortedFieldIds.length === 0) {
        setFlexHex("No fields enabled");
        return;
      }

      const maxFieldId = Math.max(...sortedFieldIds);
      const bitCount = maxFieldId;

      let payload = "";
      payload += "*>FLEX";
      payload += parseInt(protocol).toString(16).padStart(2, "0");
      payload += parseInt(protocolVersion).toString(16).padStart(2, "0");
      payload += parseInt(structVersion).toString(16).padStart(2, "0");
      payload += bitCount.toString(16).padStart(2, "0");

      const byteCount = Math.ceil(bitCount / 8);
      const bitBytes = new Array(byteCount).fill(0);

      sortedFieldIds.forEach((fieldId) => {
        const byteIndex = Math.floor((fieldId - 1) / 8);
        const bitIndex = 7 - ((fieldId - 1) % 8);
        bitBytes[byteIndex] |= 1 << bitIndex;
      });

      bitBytes.forEach((byte) => {
        payload += byte.toString(16).padStart(2, "0");
      });

      let message = "";
      message += "404e5443"; // "@NTC"
      message += "00000000"; // Receiver ID
      message += "01000000"; // Sender ID

      const payloadHex = Array.from(payload)
        .map((char) => char.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("");

      const payloadLength = payloadHex.length / 2;
      message += (payloadLength & 0xff).toString(16).padStart(2, "0");
      message += ((payloadLength >> 8) & 0xff).toString(16).padStart(2, "0");

      const dataChecksum = calculateXOR(payloadHex);
      const headerChecksum = calculateXOR(message);

      message += dataChecksum;
      message += headerChecksum;
      message += payloadHex;

      const formatted = message
        .match(/.{1,2}/g)
        .join(" ")
        .toUpperCase();
      setFlexHex(formatted);
    } catch (error) {
      setFlexHex(`Error: ${error.message}`);
    }
  };

  const numberToHexLE = (value, length, type) => {
    let num;

    if (type.startsWith("F")) {
      const buffer = new ArrayBuffer(4);
      const view = new DataView(buffer);
      view.setFloat32(0, parseFloat(value), true);
      return Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    } else if (type.startsWith("I")) {
      num = parseInt(value);
      const buffer = new ArrayBuffer(length);
      const view = new DataView(buffer);
      if (length === 1) view.setInt8(0, num);
      else if (length === 2) view.setInt16(0, num, true);
      else if (length === 4) view.setInt32(0, num, true);
      return Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    } else {
      num = parseInt(value);
      const buffer = new ArrayBuffer(length);
      const view = new DataView(buffer);
      if (length === 1) view.setUint8(0, num);
      else if (length === 2) view.setUint16(0, num, true);
      else if (length === 4) view.setUint32(0, num, true);
      return Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }
  };

  const generateGpsDataHex = () => {
    try {
      const sortedFieldIds = Object.keys(enabledFields)
        .filter((id) => enabledFields[id])
        .map((id) => parseInt(id))
        .sort((a, b) => a - b);

      if (sortedFieldIds.length === 0) {
        setGpsDataHex("No fields enabled");
        return;
      }

      let gpsDataPayloads = [];
      for (let msgIdx = 0; msgIdx < messageCount; msgIdx++) {
        let payload = "";

        for (const fieldId of sortedFieldIds) {
          const field = FIELD_DEFINITIONS[fieldId];
          const value = fieldValues[fieldId] || "0";

          if (field.type.includes("[")) {
            const values = value.split(/[,\s]+/).filter((v) => v);
            const arrayLength = parseInt(field.type.match(/\[(\d+)\]/)[1]);
            const elementType = field.type.split("[")[0];

            for (let i = 0; i < arrayLength; i++) {
              const val = values[i] || "0";
              payload += numberToHexLE(val, 1, elementType);
            }
          } else {
            payload += numberToHexLE(value, field.length, field.type);
          }
        }

        gpsDataPayloads.push(payload);
      }

      let gpsMessage = "7e41";
      gpsMessage += messageCount.toString(16).padStart(2, "0");

      gpsDataPayloads.forEach((payload) => {
        gpsMessage += payload;
      });

      const crc8 = calculateCRC8EGTS(gpsMessage);
      gpsMessage += crc8;

      const formatted = gpsMessage
        .match(/.{1,2}/g)
        .join(" ")
        .toUpperCase();
      setGpsDataHex(formatted);
    } catch (error) {
      setGpsDataHex(`Error: ${error.message}`);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text.replace(/\s/g, ""));
  };

  const enablePreset = (preset) => {
    const presets = {
      basic: [3, 8, 10, 11, 13, 14],
      full_gps: [3, 8, 9, 10, 11, 12, 13, 14, 15, 70, 71],
      vehicle: [3, 8, 10, 11, 13, 14, 37, 55, 56, 57, 65],
      fuel: [3, 10, 11, 38, 39, 40, 44, 54, 78],
      sensors: [3, 10, 11, 45, 46, 47, 48, 167, 168],
    };

    const newEnabled = {};
    const newValues = { ...fieldValues };

    presets[preset].forEach((id) => {
      newEnabled[id] = true;
      if (!newValues[id]) {
        newValues[id] = getDefaultValue(id);
      }
    });

    setEnabledFields(newEnabled);
    setFieldValues(newValues);
  };

  const renderFieldInput = (fieldId) => {
    const field = FIELD_DEFINITIONS[fieldId];
    const value = fieldValues[fieldId] || "";

    return (
      <TextField
        size="small"
        fullWidth
        label={`Value (${field.type})`}
        value={value}
        onChange={(e) => updateFieldValue(fieldId, e.target.value)}
        helperText={field.description}
        disabled={!enabledFields[fieldId]}
      />
    );
  };

  const renderCategory = (category, fieldIds) => {
    const categoryFields = fieldIds.filter((id) => FIELD_DEFINITIONS[id]);
    if (categoryFields.length === 0) return null;

    const enabledCount = categoryFields.filter(
      (id) => enabledFields[id],
    ).length;

    return (
      <Accordion key={category}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              width: "100%",
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              {category}
            </Typography>
            <Chip
              label={`${enabledCount}/${categoryFields.length}`}
              size="small"
              color={enabledCount > 0 ? "primary" : "default"}
            />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {categoryFields.map((fieldId) => {
              const field = FIELD_DEFINITIONS[fieldId];
              return (
                <Grid item xs={12} md={6} key={fieldId}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={enabledFields[fieldId] || false}
                            onChange={() => toggleField(fieldId)}
                            color="primary"
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              [{fieldId}] {field.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {field.length} byte(s) • {field.type}
                            </Typography>
                          </Box>
                        }
                      />
                    </Box>
                    {renderFieldInput(fieldId)}
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </AccordionDetails>
      </Accordion>
    );
  };

  const totalEnabled = Object.values(enabledFields).filter((v) => v).length;

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto", p: 3 }}>
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
            Navtelecom FLEX Configurator
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Configure FLEX parameters and generate protocol messages for
            Navtelecom devices
          </Typography>

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => enablePreset("basic")}
            >
              Basic GPS
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => enablePreset("full_gps")}
            >
              Full GPS
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => enablePreset("vehicle")}
            >
              Vehicle Data
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => enablePreset("fuel")}
            >
              Fuel Monitoring
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => enablePreset("sensors")}
            >
              Sensors
            </Button>
            <Button
              variant="outlined"
              size="small"
              color="error"
              onClick={() => setEnabledFields({})}
            >
              Clear All
            </Button>
          </Box>

          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>{totalEnabled}</strong> field(s) enabled
          </Alert>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Field Configuration
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {Object.entries(FIELD_CATEGORIES).map(([category, fieldIds]) =>
                renderCategory(category, fieldIds),
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Box sx={{ position: "sticky", top: 16 }}>
            {/* FLEX Configuration Hex */}
            <Card elevation={2} sx={{ mb: 2 }}>
              <CardContent>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  <SettingsIcon color="primary" />
                  <Typography variant="h6">FLEX Configuration</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Protocol"
                      value={protocol}
                      onChange={(e) => setProtocol(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Version"
                      value={protocolVersion}
                      onChange={(e) => setProtocolVersion(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Struct"
                      value={structVersion}
                      onChange={(e) => setStructVersion(e.target.value)}
                    />
                  </Grid>
                </Grid>

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<PlayArrowIcon />}
                  onClick={generateFlexHex}
                  sx={{ mb: 2 }}
                >
                  Generate FLEX Hex
                </Button>

                {flexHex && (
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 1,
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight={600}>
                        FLEX Message:
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<ContentCopyIcon />}
                        onClick={() => copyToClipboard(flexHex)}
                      >
                        Copy
                      </Button>
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: "monospace",
                        wordBreak: "break-all",
                        fontSize: "0.75rem",
                        bgcolor: "white",
                        p: 1,
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      {flexHex}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1, display: "block" }}
                    >
                      Length: {flexHex.replace(/\s/g, "").length / 2} bytes
                    </Typography>
                  </Paper>
                )}

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                  FLEX Structure:
                </Typography>
                <Typography
                  variant="caption"
                  component="div"
                  sx={{ fontFamily: "monospace", lineHeight: 1.8 }}
                >
                  @NTC + Header (10 bytes)
                  <br />
                  *&gt;FLEX (6 bytes)
                  <br />
                  Protocol (1 byte)
                  <br />
                  Version (1 byte)
                  <br />
                  Struct (1 byte)
                  <br />
                  Bit count (1 byte)
                  <br />
                  Bit field (variable)
                </Typography>
              </CardContent>
            </Card>

            {/* GPS Data Hex */}
            <Card elevation={2}>
              <CardContent>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  <DataObjectIcon color="success" />
                  <Typography variant="h6">GPS Data Message</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />

                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Message Count"
                  value={messageCount}
                  onChange={(e) =>
                    setMessageCount(
                      Math.max(1, Math.min(255, parseInt(e.target.value) || 1)),
                    )
                  }
                  sx={{ mb: 2 }}
                  helperText="Number of GPS messages (1-255)"
                />

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  color="success"
                  startIcon={<PlayArrowIcon />}
                  onClick={generateGpsDataHex}
                  sx={{ mb: 2 }}
                >
                  Generate GPS Data
                </Button>

                {gpsDataHex && (
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 1,
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight={600}>
                        GPS Message:
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<ContentCopyIcon />}
                        onClick={() => copyToClipboard(gpsDataHex)}
                      >
                        Copy
                      </Button>
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: "monospace",
                        wordBreak: "break-all",
                        fontSize: "0.75rem",
                        bgcolor: "white",
                        p: 1,
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      {gpsDataHex}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1, display: "block" }}
                    >
                      Length: {gpsDataHex.replace(/\s/g, "").length / 2} bytes
                    </Typography>
                  </Paper>
                )}

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                  GPS Structure:
                </Typography>
                <Typography
                  variant="caption"
                  component="div"
                  sx={{ fontFamily: "monospace", lineHeight: 1.8 }}
                >
                  7E 41 = "~A" (GPS type)
                  <br />
                  XX = Message count
                  <br />
                  [Field data in order]
                  <br />
                  XX = CRC8-EGTS checksum
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default NavtelecomFlexConfigurator;
