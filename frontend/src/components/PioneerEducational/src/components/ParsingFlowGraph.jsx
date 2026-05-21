import React from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Typography,
  Paper,
} from '@mui/material';

const FLOWS = {
  [0x02]: [
    { id: 'header', label: 'Header Detection', description: 'Identify 0x2323 header' },
    { id: 'length', label: 'Length Reading', description: 'Read packet length field' },
    { id: 'index', label: 'Index Extraction', description: 'Get packet sequence number' },
    { id: 'imei', label: 'IMEI Decoding', description: 'Extract BCD-encoded IMEI' },
    { id: 'config', label: 'Configuration', description: 'Read ACC/speed compensation' },
    { id: 'gps_signal', label: 'Signal Check', description: 'Verify GPS signal status' },
    { id: 'status', label: 'Status Parsing', description: 'Decode satellite count/flags' },
    { id: 'sensors', label: 'Sensor Data', description: 'Read GSensor, IO, etc.' },
    { id: 'position', label: 'Position Data', description: 'Extract GPS coordinates' },
    { id: 'timestamp', label: 'Time Processing', description: 'Parse date and timestamp' },
    { id: 'speed', label: 'Speed Calculation', description: 'Convert raw speed value' },
    { id: 'additional', label: 'Additional Fields', description: 'Process altitude, battery' },
    { id: 'packet_build', label: 'Packet Assembly', description: 'Build TrackingPacket object' },
    { id: 'kafka', label: 'Kafka Serialization', description: 'Convert to JSON and send' },
    { id: 'ack', label: 'ACK Generation', description: 'Create and send response' },
  ],
  [0x04]: [
    { id: 'header', label: 'Header Detection', description: 'Identify 0x2323 header' },
    { id: 'length', label: 'Length Reading', description: 'Read packet length' },
    { id: 'index', label: 'Index Extraction', description: 'Get sequence number' },
    { id: 'imei', label: 'IMEI Decoding', description: 'Extract BCD-encoded IMEI' },
    { id: 'alarm', label: 'Alarm Processing', description: 'Handle alarm/event data' },
    { id: 'ack', label: 'ACK Generation', description: 'Create and send response' },
  ],
  [0x12]: [
    { id: 'header', label: 'Header Detection', description: 'Identify 0x2323 header' },
    { id: 'length', label: 'Length Reading', description: 'Read packet length' },
    { id: 'index', label: 'Index Extraction', description: 'Get sequence number' },
    { id: 'imei', label: 'IMEI Decoding', description: 'Extract BCD-encoded IMEI' },
    { id: 'timestamp', label: 'Time Processing', description: 'Parse BLE timestamp' },
    { id: 'acc_status', label: 'ACC Check', description: 'Read accessory status' },
    { id: 'gnss', label: 'GNSS Data', description: 'Process GPS information' },
    { id: 'ble_data', label: 'BLE Payload', description: 'Handle BLE sensor data' },
    { id: 'packet_build', label: 'Packet Assembly', description: 'Build TrackingPacket' },
    { id: 'kafka', label: 'Kafka Serialization', description: 'Convert to JSON and send' },
    { id: 'ack', label: 'ACK Generation', description: 'Create and send response' },
  ],
  [0x44]: [
    { id: 'header', label: 'Header Detection', description: 'Identify 0x2323 header' },
    { id: 'length', label: 'Length Reading', description: 'Read packet length' },
    { id: 'index', label: 'Index Extraction', description: 'Get sequence number' },
    { id: 'imei', label: 'IMEI Decoding', description: 'Extract BCD-encoded IMEI' },
    { id: 'timestamp', label: 'Time Processing', description: 'Parse CAN timestamp' },
    { id: 'can_data', label: 'CAN Parsing', description: 'Process CAN bus data' },
    { id: 'packet_build', label: 'Packet Assembly', description: 'Build TrackingPacket' },
    { id: 'kafka', label: 'Kafka Serialization', description: 'Convert to JSON and send' },
    { id: 'ack', label: 'ACK Generation', description: 'Create and send response' },
  ],
};

const PACKET_TYPE_NAMES = {
  0x01: 'LOGIN', 0x02: 'GPS', 0x03: 'HEARTBEAT', 0x04: 'ALARM',
  0x05: 'NETWORK', 0x06: 'DRIVER_BEHAVIOR', 0x10: 'BLE', 0x11: 'NETWORK_2',
  0x12: 'BLE_LOCATION', 0x13: 'GPS_2', 0x14: 'ALARM_2', 0x44: 'MANUAL_CAN',
  0x33: 'PIONEER_X_33', 0x34: 'PIONEER_X', 0x81: 'COMMAND',
};

const ParsingFlowGraph = ({ packetType, currentStep }) => {
  const theme = useTheme();
  const flow = FLOWS[packetType] || FLOWS[0x02];
  const foundIndex = flow.findIndex(step => step.id === currentStep);
  const currentStepIndex = foundIndex !== -1 ? foundIndex : 0;

  return (
    <Paper elevation={3} sx={{ overflow: 'hidden' }}>
      <Box p={3}>
        <Typography variant="h5" gutterBottom>
          Parsing Flow Graph
        </Typography>

        <Box mb={3} p={2} sx={{ bgcolor: 'action.selected', borderRadius: 1 }}>
          <Typography variant="h6">
            {PACKET_TYPE_NAMES[packetType] || `TYPE_${packetType}`} Packet Flow
          </Typography>
        </Box>

        <Box sx={{ position: 'relative', minHeight: 120, overflow: 'visible' }}>
          <Box sx={{
            position: 'absolute', left: '50%', top: 0, bottom: 0,
            width: 4, marginLeft: -2, bgcolor: 'divider',
          }} />

          {flow.map((step, index) => (
            <Box key={step.id} sx={{ position: 'relative', px: 3, py: 2 }}>
              {index > 0 && index < flow.length - 1 && (
                <Box sx={{
                  position: 'absolute', left: '50%', top: index * 60 - 8,
                  width: 40, height: 4, marginLeft: -20,
                  bgcolor: index < currentStepIndex ? theme.palette.success.main : theme.palette.action.disabledBackground,
                }} />
              )}

              <Box sx={{
                position: 'absolute', left: '50%', top: index * 60,
                width: 4, height: index === 0 ? 30 : index === flow.length - 1 ? 30 : 60,
                marginLeft: -2,
                bgcolor: index <= currentStepIndex ? theme.palette.success.main : theme.palette.action.disabledBackground,
              }} />

              <Box sx={{
                position: 'absolute', left: '50%',
                top: index * 60 + (index === 0 ? 30 : index === flow.length - 1 ? -30 : 0),
                width: 24, height: 24, marginLeft: -12,
                backgroundColor: index < currentStepIndex ? theme.palette.success.main : index === currentStepIndex ? theme.palette.primary.main : theme.palette.action.disabledBackground,
                borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: 'common.white', fontWeight: 'bold', fontSize: 10,
              }}>
                {index + 1}
              </Box>

              <Box sx={{
                position: 'absolute', left: '50%',
                top: index * 60 + (index === 0 ? 60 : index === flow.length - 1 ? -60 : 30),
                width: 240, marginLeft: -120, textAlign: 'center',
                fontSize: 12, overflow: 'visible', whiteSpace: 'normal',
              }}>
                <Typography variant="body2" sx={{ mb: 0.5, wordBreak: 'break-word' }} color={index === currentStepIndex ? 'primary.main' : 'text.primary'}>
                  {step.label}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', wordBreak: 'break-word' }}>
                  {step.description}
                </Typography>
              </Box>
            </Box>
          ))}

          {currentStepIndex >= 0 && currentStepIndex < flow.length && (
            <Box sx={{
              position: 'absolute', left: '50%',
              top: currentStepIndex * 60 + (currentStepIndex === 0 ? 30 : currentStepIndex === flow.length - 1 ? -30 : 0),
              width: 32, height: 32, marginLeft: -16,
              border: '2px solid', borderColor: 'warning.main', borderRadius: '50%', pointerEvents: 'none',
            }} />
          )}
        </Box>

        {currentStepIndex >= 0 && currentStepIndex < flow.length && (
          <Box mt={4} p={2} sx={{ bgcolor: 'action.selected', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              Current Step: {flow[currentStepIndex].label}
            </Typography>
            <Typography variant="body1">
              {flow[currentStepIndex].description}
            </Typography>
          </Box>
        )}

        <Box mt={3} p={2} sx={{ bgcolor: 'action.selected', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            Flow Legend
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <Box sx={{ width: 16, height: 16, bgcolor: 'success.main', borderRadius: '50%' }} />
              <Typography variant="body2">Completed</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Box sx={{ width: 16, height: 16, bgcolor: 'primary.main', borderRadius: '50%' }} />
              <Typography variant="body2">Current</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Box sx={{ width: 16, height: 16, bgcolor: 'action.disabledBackground', borderRadius: '50%' }} />
              <Typography variant="body2">Pending</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default ParsingFlowGraph;