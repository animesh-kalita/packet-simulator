import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  IconButton,
  Divider,
} from "@mui/material";
import { ContentCopy, ErrorOutline } from "@mui/icons-material";

/* ============================
   IEEE-754 helpers
============================ */
const hexToFloat = (hex) => {
  if (!hex || hex.length !== 8) return 0;
  const buf = new ArrayBuffer(4);
  const view = new DataView(buf);
  view.setUint32(0, parseInt(hex, 16), false);
  return parseFloat(view.getFloat32(0, false).toFixed(3));
};

const floatToHex = (val) => {
  const buf = new ArrayBuffer(4);
  const view = new DataView(buf);
  view.setFloat32(0, Number(val) || 0, false);
  return view.getUint32(0, false).toString(16).padStart(8, "0").toUpperCase();
};

/* ============================
   Modbus parameter map
============================ */
const modbusFields = [
  "V1-N",
  "V2-N",
  "V3-N",
  "Avg LN",
  "V12",
  "V23",
  "V31",
  "Avg LL",
  "I1",
  "I2",
  "I3",
  "Avg I",
  "kW1",
  "kW2",
  "kW3",
  "Total kW",
  "kVA1",
  "kVA2",
  "kVA3",
  "Total kVA",
  "kVAr1",
  "kVAr2",
  "kVAr3",
  "Total kVAr",
  "PF1",
  "PF2",
  "PF3",
  "Avg PF",
  "Frequency",
  "kWh",
  "kVAh",
  "kVArh",
];

const SAMPLE_PACKET =
  "$,I204,V4.0.1,MD,862942074967464,L,05122025,122410,077,01,01,01,DSE4522,01:04,01,266,010480435535C30000000000000000428E23D743553D7100000000435523D7430E1EB83F9FBE7700000000000000003ED4FDF43E52A08100000000000000003E883C7000000000000000003E2CD9C800000000000000003E52A0813E883C703E2CD9C83F45E3543F8000003F8000003F45E35442474DD33E99999A3F0000003E99999A9D87,02,00,NAK,03,42,010310000A000000050190015E0000015E00015DB6,04,158,01034A0000000000000000000000000014000100020003000400050006000700080009000A000B000C000D000E000F001000110012001300140000000000000000000000000000000000000000BBAA, ,000567,47,*";

export default function FullMDPacketEditor() {
  const [rawPacket, setRawPacket] = useState(SAMPLE_PACKET);
  const [hexDataOnly, setHexDataOnly] = useState("");
  const [error, setError] = useState("");

  const [meta, setMeta] = useState({
    model: "I204",
    firmware: "V4.0.1",
    packetType: "MD",
    imei: "862942074967464",
    live: "L",
    date: "05122025",
    time: "122410",
    pktCount: "077",
    pktIndex: "01",
    events: "01",
    slaveCount: "01",
    slaveId: "DSE4522",
    rqCount: "01:04",
    rqNumber: "01",
    rqLength: "266",
    checksum: "47",
  });

  const [modbusValues, setModbusValues] = useState(
    Object.fromEntries(modbusFields.map((f) => [f, ""])),
  );

  // Load sample packet on mount
  useEffect(() => {
    decodePacket(SAMPLE_PACKET);
  }, []);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const decodePacket = (packet = rawPacket) => {
    try {
      setError("");
      const clean = packet.trim();
      if (!clean.startsWith("$")) {
        setError("Packet must start with $");
        return;
      }

      const withoutEnd = clean.replace("*", "");
      const parts = withoutEnd.split(",");

      if (parts.length < 17) {
        setError("Incomplete packet");
        return;
      }

      setMeta({
        model: parts[1] || "",
        firmware: parts[2] || "",
        packetType: parts[3] || "",
        imei: parts[4] || "",
        live: parts[5] || "",
        date: parts[6] || "",
        time: parts[7] || "",
        pktCount: parts[8] || "",
        pktIndex: parts[9] || "",
        events: parts[10] || "",
        slaveCount: parts[11] || "",
        slaveId: parts[12] || "",
        rqCount: parts[13] || "",
        rqNumber: parts[14] || "",
        rqLength: parts[15] || "",
        checksum: parts[parts.length - 2] || "",
      });

      // Extract the modbus data hex from field 16
      const dataField = parts[16] || "";

      // The data field format is: SlaveAddress + FunctionCode + DataLength + ModbusData
      // Example: 010480 + actual modbus data
      // We need to skip the first 6 characters (01 04 80)
      let modbusHex = dataField;
      if (dataField.length > 6) {
        modbusHex = dataField.substring(6);
      }

      setHexDataOnly(modbusHex);

      const decoded = {};
      modbusFields.forEach((f, i) => {
        const hexValue = modbusHex.substr(i * 8, 8);
        decoded[f] = hexValue ? hexToFloat(hexValue) : 0;
      });
      setModbusValues(decoded);
    } catch (err) {
      setError("Error decoding packet: " + err.message);
    }
  };

  const decodeHexOnly = () => {
    try {
      setError("");
      const cleanHex = hexDataOnly.replace(/\s/g, "");

      if (cleanHex.length !== 256) {
        setError(
          `Hex data should be 256 characters (32 parameters × 8 hex chars). Current length: ${cleanHex.length}`,
        );
      }

      const decoded = {};
      modbusFields.forEach((f, i) => {
        const hexValue = cleanHex.substr(i * 8, 8);
        decoded[f] = hexValue ? hexToFloat(hexValue) : 0;
      });
      setModbusValues(decoded);
    } catch (err) {
      setError("Error decoding hex: " + err.message);
    }
  };

  const encodePacket = () => {
    try {
      setError("");
      const modbusHex = modbusFields
        .map((f) => floatToHex(modbusValues[f]))
        .join("");

      setHexDataOnly(modbusHex);

      // Construct full data field with prefix
      const fullDataField = "010480" + modbusHex;

      // Build packet - simplified structure based on sample
      const pkt = [
        "$",
        meta.model,
        meta.firmware,
        meta.packetType,
        meta.imei,
        meta.live,
        meta.date,
        meta.time,
        meta.pktCount,
        meta.pktIndex,
        meta.events,
        meta.slaveCount,
        meta.slaveId,
        meta.rqCount,
        meta.rqNumber,
        meta.rqLength || (fullDataField.length / 2).toString(),
        fullDataField,
        "02",
        "00",
        "NAK",
        "03",
        "42",
        "010310000A000000050190015E0000015E00015DB6",
        "04",
        "158",
        "01034A0000000000000000000000000014000100020003000400050006000700080009000A000B000C000D000E000F001000110012001300140000000000000000000000000000000000000000BBAA",
        " ",
        "000567",
        meta.checksum,
        "*",
      ].join(",");

      setRawPacket(pkt);
    } catch (err) {
      setError("Error encoding packet: " + err.message);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", py: 3 }}>
      <Container maxWidth="xl">
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            APM RMI 201 – MD Packet Encoder / Decoder
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Decode and encode Modbus data packets from APM RMI 201 device
          </Typography>
        </Paper>

        {error && (
          <Alert severity="error" icon={<ErrorOutline />} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Full Packet Section */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6" fontWeight="semibold">
              Full Packet
            </Typography>
            <Button
              variant="contained"
              startIcon={<ContentCopy />}
              onClick={() => copyToClipboard(rawPacket)}
              size="small"
            >
              Copy
            </Button>
          </Box>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={rawPacket}
            onChange={(e) => setRawPacket(e.target.value)}
            placeholder="Paste full packet here..."
            sx={{ fontFamily: "monospace", mb: 2 }}
          />
          <Button
            variant="contained"
            color="success"
            onClick={() => decodePacket()}
          >
            Decode Full Packet
          </Button>
        </Paper>

        {/* Hex Data Only Section */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6" fontWeight="semibold">
              Modbus Hex Data Only (256 chars)
            </Typography>
            <Button
              variant="contained"
              startIcon={<ContentCopy />}
              onClick={() => copyToClipboard(hexDataOnly)}
              size="small"
            >
              Copy
            </Button>
          </Box>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={hexDataOnly}
            onChange={(e) => setHexDataOnly(e.target.value)}
            placeholder="Paste modbus hex data only (without 010480 prefix)..."
            sx={{ fontFamily: "monospace", mb: 2 }}
          />
          <Button variant="contained" color="success" onClick={decodeHexOnly}>
            Decode Hex Data
          </Button>
        </Paper>

        {/* Header/Meta Fields */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="semibold" sx={{ mb: 2 }}>
            Header / Metadata
          </Typography>
          <Grid container spacing={2}>
            {Object.keys(meta).map((k) => (
              <Grid item xs={6} sm={3} key={k}>
                <TextField
                  fullWidth
                  size="small"
                  label={k}
                  value={meta[k]}
                  onChange={(e) => setMeta({ ...meta, [k]: e.target.value })}
                />
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Modbus Parameters */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Typography variant="h6" fontWeight="semibold">
              Modbus Parameters
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              onClick={encodePacket}
            >
              Generate Packet from Values
            </Button>
          </Box>

          {/* Voltage Line-Neutral */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle1"
              fontWeight="semibold"
              sx={{ bgcolor: "primary.50", p: 1, borderRadius: 1, mb: 2 }}
            >
              Voltage Line-Neutral
            </Typography>
            <Grid container spacing={2}>
              {["V1-N", "V2-N", "V3-N", "Avg LN"].map((f) => (
                <Grid item xs={6} sm={3} key={f}>
                  <TextField
                    fullWidth
                    size="small"
                    label={f}
                    type="number"
                    inputProps={{ step: "0.001" }}
                    value={modbusValues[f]}
                    onChange={(e) =>
                      setModbusValues({ ...modbusValues, [f]: e.target.value })
                    }
                  />
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Voltage Line-Line */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle1"
              fontWeight="semibold"
              sx={{ bgcolor: "success.50", p: 1, borderRadius: 1, mb: 2 }}
            >
              Voltage Line-Line
            </Typography>
            <Grid container spacing={2}>
              {["V12", "V23", "V31", "Avg LL"].map((f) => (
                <Grid item xs={6} sm={3} key={f}>
                  <TextField
                    fullWidth
                    size="small"
                    label={f}
                    type="number"
                    inputProps={{ step: "0.001" }}
                    value={modbusValues[f]}
                    onChange={(e) =>
                      setModbusValues({ ...modbusValues, [f]: e.target.value })
                    }
                  />
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Current */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle1"
              fontWeight="semibold"
              sx={{ bgcolor: "warning.50", p: 1, borderRadius: 1, mb: 2 }}
            >
              Current
            </Typography>
            <Grid container spacing={2}>
              {["I1", "I2", "I3", "Avg I"].map((f) => (
                <Grid item xs={6} sm={3} key={f}>
                  <TextField
                    fullWidth
                    size="small"
                    label={f}
                    type="number"
                    inputProps={{ step: "0.001" }}
                    value={modbusValues[f]}
                    onChange={(e) =>
                      setModbusValues({ ...modbusValues, [f]: e.target.value })
                    }
                  />
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Power */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle1"
              fontWeight="semibold"
              sx={{ bgcolor: "error.50", p: 1, borderRadius: 1, mb: 2 }}
            >
              Power (kW)
            </Typography>
            <Grid container spacing={2}>
              {["kW1", "kW2", "kW3", "Total kW"].map((f) => (
                <Grid item xs={6} sm={3} key={f}>
                  <TextField
                    fullWidth
                    size="small"
                    label={f}
                    type="number"
                    inputProps={{ step: "0.001" }}
                    value={modbusValues[f]}
                    onChange={(e) =>
                      setModbusValues({ ...modbusValues, [f]: e.target.value })
                    }
                  />
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Apparent Power */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle1"
              fontWeight="semibold"
              sx={{ bgcolor: "secondary.50", p: 1, borderRadius: 1, mb: 2 }}
            >
              Apparent Power (kVA)
            </Typography>
            <Grid container spacing={2}>
              {["kVA1", "kVA2", "kVA3", "Total kVA"].map((f) => (
                <Grid item xs={6} sm={3} key={f}>
                  <TextField
                    fullWidth
                    size="small"
                    label={f}
                    type="number"
                    inputProps={{ step: "0.001" }}
                    value={modbusValues[f]}
                    onChange={(e) =>
                      setModbusValues({ ...modbusValues, [f]: e.target.value })
                    }
                  />
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Reactive Power */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="semibold">
              Reactive Power (kVAr)
            </Typography>
            <Grid container spacing={2}>
              {["kVAr1", "kVAr2", "kVAr3", "Total kVAr"].map((f) => (
                <Grid item xs={6} sm={3} key={f}>
                  <TextField
                    fullWidth
                    size="small"
                    label={f}
                    type="number"
                    inputProps={{ step: "0.001" }}
                    value={modbusValues[f]}
                    onChange={(e) =>
                      setModbusValues({ ...modbusValues, [f]: e.target.value })
                    }
                  />
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Power Factor */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="semibold">
              Power Factor
            </Typography>
            <Grid container spacing={2}>
              {["PF1", "PF2", "PF3", "Avg PF"].map((f) => (
                <Grid item xs={6} sm={3} key={f}>
                  <TextField
                    fullWidth
                    size="small"
                    label={f}
                    type="number"
                    inputProps={{ step: "0.01" }}
                    value={modbusValues[f]}
                    onChange={(e) =>
                      setModbusValues({ ...modbusValues, [f]: e.target.value })
                    }
                  />
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Energy & Frequency */}
          <Box>
            <Typography variant="subtitle1" fontWeight="semibold">
              Energy & Frequency
            </Typography>
            <Grid container spacing={2}>
              {["Frequency", "kWh", "kVAh", "kVArh"].map((f) => (
                <Grid item xs={6} sm={3} key={f}>
                  <TextField
                    fullWidth
                    size="small"
                    label={f}
                    type="number"
                    inputProps={{ step: "0.001" }}
                    value={modbusValues[f]}
                    onChange={(e) =>
                      setModbusValues({ ...modbusValues, [f]: e.target.value })
                    }
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
