import { useState } from "react";
import { Box, Tabs, Tab, Typography, Paper } from "@mui/material";

import PioneerBlePacketGenerator from "./Pioneer/PioneerBlePacketGenerator";
import PioneerPositionDecoder from "./Pioneer/PioneerPositionDecoder";
import AlarmDecoder from "./Pioneer/AlarmDecoder";
import DriverBehaviourDecoder from "./Pioneer/DriverBehaviourDecoder";

/* =====================
   Tab Panel Helper
===================== */
function TabPanel({ value, index, children }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function PioneerDecoder() {
  const [tabValue, setTabValue] = useState(0);

  const handleChange = (_, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box p={3}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Pioneer Protocol Tools
        </Typography>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          BLE packets, position decoding, alarms and driver behaviour
        </Typography>

        <Tabs
          value={tabValue}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2 }}
        >
          <Tab label="BLE 0x25 0x25 0x10" />
          <Tab label="Position Packet - 0x25 0x25 0x13 " />
          <Tab label="Alarm 0x25 0x25 0x14" />
          <Tab label="Driver Behaviour 0x25 0x25 0x05" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <PioneerBlePacketGenerator />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <PioneerPositionDecoder />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <AlarmDecoder />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <DriverBehaviourDecoder />
        </TabPanel>
      </Paper>
    </Box>
  );
}
