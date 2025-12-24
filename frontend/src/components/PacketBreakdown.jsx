import React, { useState } from "react";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  AlertTitle,
  Chip,
  Divider,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

export default function PacketBreakdown() {
  const [hexInput, setHexInput] = useState(
    "000000000000007a08010000019aed154ee0012b2fee7d0e694e6f00ed00c7140000f01a07ef00f000150545010100b300ca1b0eb50009b6000642300f180000cde77bce14f3430fa34400000900d911ffc412ffb813ffe8c90267cb000003f100009e32c700000000100585704b020b00000000359895a60e00000001641f11020100009ebe"
  );
  const [breakdown, setBreakdown] = useState(null);

  const parsePacket = (hexString) => {
    const hex = hexString.replace(/\s/g, "");
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push(parseInt(hex.substr(i, 2), 16));
    }

    const sections = [];
    let offset = 0;
    let byteOffset = 0;

    // Helper to add section
    const addSection = (
      name,
      length,
      description,
      value = null,
      color = "default"
    ) => {
      const hexData = hex.substr(byteOffset * 2, length * 2);
      sections.push({
        name,
        hexData,
        description,
        value,
        color,
        byteStart: byteOffset,
        byteEnd: byteOffset + length,
        length,
      });
      byteOffset += length;
      offset += length;
      return hexData;
    };

    // Preamble
    addSection(
      "Preamble",
      4,
      "Start marker (always 00000000)",
      "00000000",
      "info"
    );

    // Data length
    const dataLengthHex = addSection(
      "Data Length",
      4,
      "Length of data field in bytes",
      null,
      "primary"
    );
    const dataLength =
      (bytes[4] << 24) | (bytes[5] << 16) | (bytes[6] << 8) | bytes[7];
    sections[sections.length - 1].value = `${dataLength} bytes`;

    // Codec ID
    const codecHex = addSection(
      "Codec ID",
      1,
      "Protocol version identifier",
      null,
      "secondary"
    );
    const codecId = bytes[8];
    sections[sections.length - 1].value = `0x${codecHex} (Codec ${codecId})`;

    // Number of records
    const numRecordsHex = addSection(
      "Number of Records",
      1,
      "How many data records in this packet",
      null,
      "success"
    );
    const numRecords = bytes[9];
    sections[sections.length - 1].value = `${numRecords} record(s)`;

    // Process first record
    sections.push({
      name: "═══ RECORD 1 START ═══",
      isHeader: true,
      color: "warning",
    });

    // Timestamp
    let timestamp = 0;
    for (let i = 0; i < 8; i++) {
      timestamp = timestamp * 256 + bytes[offset + i];
    }
    const tsHex = addSection(
      "Timestamp",
      8,
      "Unix timestamp in milliseconds",
      null,
      "info"
    );
    const date = new Date(timestamp);
    sections[
      sections.length - 1
    ].value = `${timestamp}ms → ${date.toISOString()}`;

    // Priority
    const priorityHex = addSection(
      "Priority",
      1,
      "Data priority level (0=Low, 1=High, 2=Panic)",
      null,
      "default"
    );
    sections[sections.length - 1].value = `Level ${bytes[offset - 1]}`;

    // GPS Data Header
    sections.push({
      name: "--- GPS Element ---",
      isSubHeader: true,
      color: "success",
    });

    // Longitude
    const lonBytes = bytes.slice(offset, offset + 4);
    const lonRaw =
      (lonBytes[0] << 24) |
      (lonBytes[1] << 16) |
      (lonBytes[2] << 8) |
      lonBytes[3];
    const longitude = lonRaw / 10000000;
    addSection(
      "Longitude",
      4,
      "Longitude coordinate (signed int / 10,000,000)",
      `${lonRaw} → ${longitude.toFixed(7)}° E`,
      "success"
    );

    // Latitude
    const latBytes = bytes.slice(offset, offset + 4);
    const latRaw =
      (latBytes[0] << 24) |
      (latBytes[1] << 16) |
      (latBytes[2] << 8) |
      latBytes[3];
    const latitude = latRaw / 10000000;
    addSection(
      "Latitude",
      4,
      "Latitude coordinate (signed int / 10,000,000)",
      `${latRaw} → ${latitude.toFixed(7)}° N`,
      "success"
    );

    // Altitude
    const altitude = (bytes[offset] << 8) | bytes[offset + 1];
    addSection(
      "Altitude",
      2,
      "Height above sea level in meters",
      `${altitude} meters`,
      "success"
    );

    // Angle
    const angle = (bytes[offset] << 8) | bytes[offset + 1];
    addSection(
      "Angle",
      2,
      "Movement direction (0-360°, 0=North, clockwise)",
      `${angle}°`,
      "success"
    );

    // Satellites
    const satellites = bytes[offset];
    addSection(
      "Satellites",
      1,
      "Number of visible GPS satellites",
      `${satellites} satellites`,
      "success"
    );

    // Speed
    const speed = (bytes[offset] << 8) | bytes[offset + 1];
    addSection(
      "Speed",
      2,
      "Movement speed in km/h",
      `${speed} km/h`,
      "success"
    );

    // IO Element Header
    sections.push({
      name: "--- IO Element ---",
      isSubHeader: true,
      color: "secondary",
    });

    // Event ID
    const eventId = bytes[offset];
    addSection(
      "Event IO ID",
      1,
      "Which IO element triggered this record",
      eventId === 0 ? "0 (No event - periodic record)" : `IO ${eventId}`,
      "secondary"
    );

    // Total elements
    const totalElements = bytes[offset];
    addSection(
      "Total IO Elements",
      1,
      "Total number of IO elements in this record",
      `${totalElements} elements`,
      "secondary"
    );

    // 1-byte IO elements
    const num1Byte = bytes[offset];
    addSection(
      "1-byte IO Count",
      1,
      "Number of IO elements with 1-byte values",
      `${num1Byte} element(s)`,
      "secondary"
    );

    for (let i = 0; i < num1Byte; i++) {
      const ioId = bytes[offset];
      const ioValue = bytes[offset + 1];
      addSection(
        `  IO ID ${ioId}`,
        1,
        `IO element identifier`,
        `ID ${ioId}`,
        "secondary"
      );

      let interpretation = `0x${ioValue
        .toString(16)
        .padStart(2, "0")} (${ioValue})`;
      if (ioId === 1) {
        interpretation += ` - Digital Inputs: DIN1=${
          ioValue & 0x01 ? "1" : "0"
        }, DIN2=${ioValue & 0x02 ? "1" : "0"}, DIN3=${
          ioValue & 0x04 ? "1" : "0"
        }, DIN4=${ioValue & 0x08 ? "1" : "0"}`;
      }
      addSection(
        `  IO Value ${ioId}`,
        1,
        `Value for IO element ${ioId}`,
        interpretation,
        "secondary"
      );
    }

    // 2-byte IO elements
    const num2Byte = bytes[offset];
    addSection(
      "2-byte IO Count",
      1,
      "Number of IO elements with 2-byte values",
      `${num2Byte} element(s)`,
      "secondary"
    );

    for (let i = 0; i < num2Byte; i++) {
      const ioId = bytes[offset];
      const ioValue = (bytes[offset + 1] << 8) | bytes[offset + 2];
      addSection(
        `  IO ID ${ioId}`,
        1,
        `IO element identifier`,
        `ID ${ioId}`,
        "secondary"
      );
      addSection(
        `  IO Value ${ioId}`,
        2,
        `Value for IO element ${ioId}`,
        `0x${ioValue.toString(16).padStart(4, "0")} (${ioValue})`,
        "secondary"
      );
    }

    // 4-byte IO elements
    const num4Byte = bytes[offset];
    addSection(
      "4-byte IO Count",
      1,
      "Number of IO elements with 4-byte values",
      `${num4Byte} element(s)`,
      "secondary"
    );

    for (let i = 0; i < num4Byte; i++) {
      const ioId = bytes[offset];
      const ioValue =
        (bytes[offset + 1] << 24) |
        (bytes[offset + 2] << 16) |
        (bytes[offset + 3] << 8) |
        bytes[offset + 4];
      addSection(
        `  IO ID ${ioId}`,
        1,
        `IO element identifier`,
        `ID ${ioId}`,
        "secondary"
      );
      addSection(
        `  IO Value ${ioId}`,
        4,
        `Value for IO element ${ioId}`,
        `0x${ioValue.toString(16).padStart(8, "0")} (${ioValue})`,
        "secondary"
      );
    }

    // 8-byte IO elements
    const num8Byte = bytes[offset];
    addSection(
      "8-byte IO Count",
      1,
      "Number of IO elements with 8-byte values",
      `${num8Byte} element(s)`,
      "secondary"
    );

    for (let i = 0; i < num8Byte; i++) {
      const ioId = bytes[offset];
      let ioValue = 0;
      for (let j = 0; j < 8; j++) {
        ioValue = ioValue * 256 + bytes[offset + 1 + j];
      }
      addSection(
        `  IO ID ${ioId}`,
        1,
        `IO element identifier`,
        `ID ${ioId}`,
        "secondary"
      );
      addSection(
        `  IO Value ${ioId}`,
        8,
        `Value for IO element ${ioId}`,
        `${ioValue}`,
        "secondary"
      );
    }

    sections.push({
      name: "═══ RECORD 1 END ═══",
      isHeader: true,
      color: "warning",
    });

    // Number of records (repeated)
    if (offset < bytes.length - 4) {
      const recordsConfirm = bytes[offset];
      addSection(
        "Number of Records (Confirmation)",
        1,
        "Record count must match the earlier count",
        `${recordsConfirm} record(s)`,
        "success"
      );
    }

    // CRC
    if (offset < bytes.length) {
      const remaining = bytes.length - offset;
      const crcHex = hex.substr(offset * 2);
      addSection(
        "CRC-16",
        remaining,
        "Checksum for data integrity verification",
        `0x${crcHex}`,
        "error"
      );
    }

    return sections;
  };

  const handleBreakdown = () => {
    try {
      const result = parsePacket(hexInput);
      setBreakdown(result);
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const getColorStyle = (color) => {
    const colors = {
      info: { bg: "#e3f2fd", border: "#2196f3", chip: "#1976d2" },
      primary: { bg: "#e8eaf6", border: "#3f51b5", chip: "#303f9f" },
      secondary: { bg: "#f3e5f5", border: "#9c27b0", chip: "#7b1fa2" },
      success: { bg: "#e8f5e9", border: "#4caf50", chip: "#388e3c" },
      warning: { bg: "#fff3e0", border: "#ff9800", chip: "#f57c00" },
      error: { bg: "#ffebee", border: "#f44336", chip: "#d32f2f" },
      default: { bg: "#f5f5f5", border: "#9e9e9e", chip: "#616161" },
    };
    return colors[color] || colors.default;
  };

  return (
    <Box sx={{ minHeight: "100vh", py: 3 }}>
      <Container maxWidth="lg">
        <Paper elevation={4} sx={{ p: 3, mb: 4 }}>
          <Typography
            variant="h5"
            component="h1"
            gutterBottom
            fontWeight="bold"
          >
            📦 Teltonika Packet Visual Breakdown
          </Typography>

          <Typography variant="body2" color="text.secondary" mb={2}>
            Paste your hex packet below to see a detailed byte-by-byte breakdown
            with explanations
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={3}
            value={hexInput}
            onChange={(e) => setHexInput(e.target.value)}
            placeholder="Enter hex packet data..."
            variant="outlined"
            size="small"
            sx={{ mb: 2 }}
            inputProps={{
              style: { fontFamily: "monospace", fontSize: "0.875rem" },
            }}
          />

          <Button
            onClick={handleBreakdown}
            variant="contained"
            color="primary"
            size="large"
          >
            🔍 Break Down Packet
          </Button>
        </Paper>

        {breakdown && (
          <Paper elevation={4} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Packet Structure Breakdown
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }} icon={<InfoOutlinedIcon />}>
              <AlertTitle sx={{ fontWeight: "bold" }}>Reading Guide</AlertTitle>
              Each colored block below represents a specific part of the packet.
              Click on any section to expand and see:
              <ul style={{ margin: "8px 0 0 0", paddingLeft: "20px" }}>
                <li>The raw hexadecimal data</li>
                <li>What that data represents</li>
                <li>The decoded/human-readable value</li>
                <li>Size in bytes and bits</li>
              </ul>
            </Alert>

            <Stack spacing={1}>
              {breakdown.map((section, idx) => {
                if (section.isHeader) {
                  return (
                    <Box key={idx} sx={{ py: 2 }}>
                      <Divider>
                        <Chip
                          label={section.name}
                          color={section.color}
                          sx={{
                            fontWeight: "bold",
                            fontSize: "0.95rem",
                            px: 2,
                          }}
                        />
                      </Divider>
                    </Box>
                  );
                }

                if (section.isSubHeader) {
                  return (
                    <Typography
                      key={idx}
                      variant="subtitle2"
                      sx={{
                        mt: 2,
                        mb: 1,
                        color: getColorStyle(section.color).border,
                        fontWeight: "bold",
                        fontSize: "0.95rem",
                      }}
                    >
                      {section.name}
                    </Typography>
                  );
                }

                const colorStyle = getColorStyle(section.color);

                return (
                  <Accordion key={idx} defaultExpanded={idx < 15}>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{
                        bgcolor: colorStyle.bg,
                        borderLeft: `4px solid ${colorStyle.border}`,
                        minHeight: "56px",
                        "&:hover": { bgcolor: colorStyle.bg, opacity: 0.9 },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          width: "100%",
                          flexWrap: "wrap",
                        }}
                      >
                        <Chip
                          label={`Bytes ${section.byteStart}-${
                            section.byteEnd - 1
                          }`}
                          size="small"
                          sx={{
                            bgcolor: colorStyle.chip,
                            color: "white",
                            fontWeight: "bold",
                            minWidth: "100px",
                          }}
                        />
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          sx={{ minWidth: "150px" }}
                        >
                          {section.name}
                        </Typography>
                        <Box sx={{ flexGrow: 1 }} />
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: "monospace",
                            bgcolor: "white",
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            border: "1px solid #e0e0e0",
                          }}
                        >
                          {section.hexData}
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails
                      sx={{
                        bgcolor: "grey.50",
                        borderTop: "1px solid #e0e0e0",
                      }}
                    >
                      <Stack spacing={2}>
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            fontWeight="bold"
                          >
                            📝 Description:
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {section.description}
                          </Typography>
                        </Box>
                        {section.value && (
                          <Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                              fontWeight="bold"
                            >
                              ✅ Decoded Value:
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                fontFamily: "monospace",
                                bgcolor: "white",
                                p: 1.5,
                                borderRadius: 1,
                                display: "inline-block",
                                mt: 0.5,
                                border: "1px solid #e0e0e0",
                              }}
                            >
                              {section.value}
                            </Typography>
                          </Box>
                        )}
                        <Box sx={{ display: "flex", gap: 3 }}>
                          <Typography variant="caption" color="text.secondary">
                            📏 Length:{" "}
                            <strong>
                              {section.length} byte
                              {section.length !== 1 ? "s" : ""}
                            </strong>{" "}
                            ({section.length * 8} bits)
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            📍 Position:{" "}
                            <strong>
                              Byte {section.byteStart} to {section.byteEnd - 1}
                            </strong>
                          </Typography>
                        </Box>
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Stack>

            <Alert severity="success" sx={{ mt: 3 }}>
              <AlertTitle sx={{ fontWeight: "bold" }}>
                Breakdown Complete!
              </AlertTitle>
              Total of{" "}
              {breakdown.filter((s) => !s.isHeader && !s.isSubHeader).length}{" "}
              packet components analyzed. The packet structure follows the
              Teltonika AVL protocol specification.
            </Alert>
          </Paper>
        )}
      </Container>
    </Box>
  );
}
