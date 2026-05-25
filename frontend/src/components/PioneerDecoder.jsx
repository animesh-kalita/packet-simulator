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
import BleMessageDecoder from "./Pioneer/BleMessageDecoder";

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
    <Paper variant="outlined" sx={{ borderRadius: 1, overflow: "hidden" }}>
      <Box sx={{ p: { xs: 1.5, sm: 2.5 } }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Pioneer Protocol Tools
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          BLE packets, position decoding, alarms and driver behaviour
        </Typography>

        <Tabs
          value={tabValue}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            mb: 2,
            minHeight: 0,
            "& .MuiTab-root": {
              textTransform: "none",
              fontSize: "0.8rem",
              py: 1,
            },
          }}
        >
          <Tab label="BLE 0x25 0x25 0x10" />
          <Tab label="Position 0x25 0x25 0x13" />
          <Tab label="Alarm 0x25 0x25 0x14" />
          <Tab label="Driver Beh. 0x25 0x25 0x05" />
          <Tab label="Driver Beh. 0x25 0x25 0x06" />
          <Tab label="Accident 0x25 0x25 0x07" />
          <Tab label="BLE 0x10 Updated" />
          <Tab label="BLE 0x12" />
          <Tab label="Manual CAN 0x44" />
          <Tab label="X Position 0x33" />
          <Tab label="X Alarm 0x34" />
          <Tab label="Login 0x01" />
          <Tab label="Heartbeat 0x03" />
          <Tab label="BLE Msg 0x10" />
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
        <TabPanel value={tabValue} index={13}>
          <BleMessageDecoder />
        </TabPanel>
      </Box>
    </Paper>
  );
}
