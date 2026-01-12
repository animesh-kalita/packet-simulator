import { useState } from "react";
import { Box, Tabs, Tab, Typography, Paper } from "@mui/material";

import PioneerBlePacketGenerator from "./Pioneer/PioneerBlePacketGenerator";
import PioneerPositionDecoder from "./Pioneer/PioneerPositionDecoder";
import AlarmDecoder from "./Pioneer/AlarmDecoder";
import DriverBehaviourDecoder from "./Pioneer/DriverBehaviourDecoder";
import DriverBehaviorDecoder0x06 from "./Pioneer/DriverBehaviorDecoder0x06";
import AccidentDecoder from "./Pioneer/AccidentDecoder";
import BleDecoder from "./Pioneer/BleDecoderx10";
import BleLocationDecoder from "./Pioneer/BleLocationDecoder";
import ManualCanDecoder from "./Pioneer/ManualCanDecoder";
import PioneerXPositionDecoder from "./Pioneer/PioneerXPositionDecoder";
import PioneerXAlarmDecoder from "./Pioneer/PioneerXAlarmDecoder";
import LoginDecoder from "./Pioneer/LoginDecoder";
import HeartbeatDecoder from "./Pioneer/HeartbeatDecoder";

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
          <Tab label="Driver Behaviour 0x25 0x25 0x06" />
          <Tab label="Accident 0x25 0x25 0x07" />
          <Tab label="BLE 0x10-Updated" />
          <Tab label="BLE 0x12" />
          <Tab label="Manual CAN - 0x44" />
          <Tab label="Pioneer X Position - 25x25x33" />
          <Tab label="Pioneer X Alarm - 25x25x34" />
          <Tab label="Login Message (from Device) (0x250x250x01)" />
          <Tab label="Heartbeat Message (from Device) (0x250x250x03)" />
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
        <TabPanel value={tabValue} index={4}>
          <DriverBehaviorDecoder0x06 />
        </TabPanel>
        <TabPanel value={tabValue} index={5}>
          <AccidentDecoder />
        </TabPanel>
        <TabPanel value={tabValue} index={6}>
          <BleDecoder />
        </TabPanel>
        <TabPanel value={tabValue} index={7}>
          <BleLocationDecoder />
        </TabPanel>
        <TabPanel value={tabValue} index={8}>
          <ManualCanDecoder />
        </TabPanel>
        <TabPanel value={tabValue} index={9}>
          <PioneerXPositionDecoder />
        </TabPanel>
        <TabPanel value={tabValue} index={10}>
          <PioneerXAlarmDecoder />
        </TabPanel>
        <TabPanel value={tabValue} index={11}>
          <LoginDecoder />
        </TabPanel>
        <TabPanel value={tabValue} index={12}>
          <HeartbeatDecoder />
        </TabPanel>
      </Paper>
    </Box>
  );
}
