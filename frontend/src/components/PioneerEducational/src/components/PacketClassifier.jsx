import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Grid,
} from "@mui/material";

import { PACKET_TYPES, HEADERS } from "../utils/constants";
import { classifyPacket } from "../utils/packetClassifier";

const PacketClassifier = ({ packetData }) => {
  const [classification, setClassification] = useState(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (packetData) {
      classifyPacketData();
    }
  }, [packetData]);

  const classifyPacketData = async () => {
    if (!packetData) {
      setClassification(null);
      return;
    }

    setIsClassifying(true);
    setError(null);

    try {
      const result = await classifyPacket(packetData);
      setClassification(result);
    } catch (err) {
      setError(`Classification failed: ${err.message}`);
      setClassification(null);
    } finally {
      setIsClassifying(false);
    }
  };

  if (!packetData) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary">
          No packet data to classify
        </Typography>
      </Box>
    );
  }

  if (isClassifying) {
    return (
      <Box textAlign="center" py={4}>
        <CircularProgress size={30} />
        <Typography variant="body2" mt={2}>
          Classifying packet...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!classification) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary">
          Waiting for classification...
        </Typography>
      </Box>
    );
  }

  const getHeaderName = (header) => {
    return (
      Object.keys(HEADERS).find((key) => HEADERS[key] === header) ||
      `Unknown (0x${header.toString(16)})`
    );
  };

  const getPacketTypeName = (type) => {
    return (
      Object.keys(PACKET_TYPES).find((key) => PACKET_TYPES[key] === type) ||
      `Unknown (0x${type.toString(16)})`
    );
  };

  return (
    <Paper elevation={3}>
      <Box p={3}>
        <Typography variant="h5" gutterBottom>
          Packet Classifier
        </Typography>

        {classification.confidence < 0.5 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Low confidence classification (
            {Math.floor(classification.confidence * 100)}%)
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Packet Type
              </Typography>

              <Typography variant="h6" color="primary">
                {getPacketTypeName(classification.type)}

                {!classification.isKnown && (
                  <Chip
                    label="Unknown"
                    size="small"
                    color="error"
                    sx={{ ml: 1 }}
                  />
                )}
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {classification.description}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Header
              </Typography>

              <Typography variant="h6" color="primary">
                0x
                {classification.header
                  .toString(16)
                  .toUpperCase()
                  .padStart(4, "0")}
                ({getHeaderName(classification.header)})
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Length
              </Typography>

              <Typography variant="h6" color="primary">
                {classification.length} bytes
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Index
              </Typography>

              <Typography variant="h6" color="primary">
                {classification.index}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                IMEI
              </Typography>

              <Typography
                variant="h6"
                color="primary"
                sx={{ wordBreak: "break-all" }}
              >
                {classification.imei || "Not found"}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Requires ACK
              </Typography>

              <Typography
                variant="h6"
                color={
                  classification.requiresAck ? "success.main" : "error.main"
                }
              >
                {classification.requiresAck ? "Yes" : "No"}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box mt={3} p={2} sx={{ bgcolor: 'action.selected', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>
                Classification Details
              </Typography>

              <Typography variant="body1">{classification.details}</Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default PacketClassifier;
