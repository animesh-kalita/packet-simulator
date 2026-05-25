import React from "react";
import { useTheme } from "@mui/material/styles";
import { Box, Typography, Paper, Tooltip, Chip } from "@mui/material";
import { PACKET_STRUCTURES, PACKET_TYPES } from "../utils/constants";

const PacketStructureMap = ({
  packetType,
  currentPosition,
  highlightedBytes = [],
}) => {
  const theme = useTheme();
  const structure = PACKET_STRUCTURES[packetType] || [];

  if (structure.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary">
          No structure defined for this packet type
        </Typography>
      </Box>
    );
  }

  const fieldsWithRanges = structure.reduce((acc, field, index) => {
    const startByte = acc.length > 0 ? acc[acc.length - 1].endByte + 1 : 0;
    const endByte = startByte + field.bytes - 1;
    return [...acc, { ...field, startByte, endByte }];
  }, []);

  const getFieldColor = (startByte, endByte) => {
    if (highlightedBytes.some((byte) => byte >= startByte && byte <= endByte)) {
      return theme.palette.warning.light;
    }
    if (endByte < currentPosition) {
      return theme.palette.success.light;
    }
    if (startByte <= currentPosition && endByte >= currentPosition) {
      return theme.palette.primary.light;
    }
    return theme.palette.action.hover;
  };

  const getFieldTooltip = (field, startByte, endByte) => {
    let tooltip = `${field.name}\\n`;
    tooltip += `Bytes: ${startByte}-${endByte} (${field.bytes} bytes)\\n`;
    tooltip += `Description: ${field.description}\\n`;

    if (endByte < currentPosition) {
      tooltip += "\\n✓ Already parsed";
    } else if (startByte <= currentPosition && endByte >= currentPosition) {
      tooltip += "\\n→ Currently parsing";
    } else {
      tooltip += "\\n○ Waiting to be parsed";
    }

    if (highlightedBytes.some((byte) => byte >= startByte && byte <= endByte)) {
      tooltip += "\\n⚠ Highlighted for inspection";
    }

    return tooltip;
  };

  return (
    <Paper elevation={3}>
      <Box p={3}>
        <Typography variant="h5" gutterBottom>
          Packet Structure Map
        </Typography>

        {/* Packet Type Label */}
        <Box mb={3} p={2} sx={{ bgcolor: "action.selected", borderRadius: 1 }}>
          <Typography variant="h6" sx={{ textTransform: "capitalize" }}>
            {Object.keys(PACKET_TYPES).find(
              (key) => PACKET_TYPES[key] === packetType,
            ) || "Unknown"}{" "}
            Packet
          </Typography>
        </Box>

        {/* Structure Visualization */}
        <Box sx={{ overflowX: "auto" }}>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {fieldsWithRanges.map((field, index) => {
              const color = getFieldColor(field.startByte, field.endByte);
              const tooltip = getFieldTooltip(
                field,
                field.startByte,
                field.endByte,
              );

              return (
                <Tooltip key={index} title={tooltip} placement="top">
                  <Box
                    sx={(t) => ({
                      minWidth: Math.max(60, field.bytes * 12),
                      height: 40,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: color,
                      borderRadius: 2,
                      fontSize: field.bytes >= 2 ? 11 : 9,
                      fontWeight: "medium",
                      color:
                        color === theme.palette.action.hover
                          ? t.palette.text.secondary
                          : t.palette.common.white,
                      textAlign: "center",
                      padding: 0.5,
                    })}
                  >
                    {field.name}
                    <Typography
                      variant="caption"
                      sx={{ display: "block", mt: 1, fontSize: 9 }}
                    >
                      [{field.startByte}-{field.endByte}]
                    </Typography>
                  </Box>
                </Tooltip>
              );
            })}
          </Box>
        </Box>

        {/* Field Details */}
        <Box mt={3}>
          <Typography variant="h6" gutterBottom>
            Field Details
          </Typography>
          <Box sx={{ maxHeight: 200, overflowY: "auto" }}>
            {fieldsWithRanges.map((field, index) => (
              <Box
                key={index}
                sx={{
                  mb: 2,
                  p: 1.5,
                  bgcolor:
                    getFieldColor(field.startByte, field.endByte) ===
                    theme.palette.action.hover
                      ? "action.hover"
                      : "background.paper",
                  borderRadius: 1,
                }}
              >
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {field.name}
                  <Chip
                    label={`${field.startByte}-${field.endByte}`}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  {field.bytes} bytes
                </Typography>
                <Typography variant="body1">{field.description}</Typography>

                {/* Show consumption status */}
                <Box mt={1.5} px={2}>
                  {field.endByte < currentPosition && (
                    <Typography variant="body2" color="success">
                      ✓ Consumed
                    </Typography>
                  )}
                  {field.startByte <= currentPosition &&
                    field.endByte >= currentPosition && (
                      <Typography variant="body2" color="primary">
                        → Currently Processing
                      </Typography>
                    )}
                  {field.startByte > currentPosition && (
                    <Typography variant="body2" color="text.secondary">
                      ○ Pending
                    </Typography>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Legend */}
        <Box mt={3} p={2} sx={{ bgcolor: "action.selected", borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            Color Legend
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  backgroundColor: "success.light",
                  borderRadius: 2,
                }}
              />
              <Typography variant="body2">Consumed (Parsed)</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  backgroundColor: "primary.light",
                  borderRadius: 2,
                }}
              />
              <Typography variant="body2">Currently Processing</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  backgroundColor: "action.hover",
                  borderRadius: 2,
                }}
              />
              <Typography variant="body2">Remaining (Not Parsed)</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  backgroundColor: "warning.light",
                  borderRadius: 2,
                }}
              />
              <Typography variant="body2">Highlighted/Selected</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default PacketStructureMap;
