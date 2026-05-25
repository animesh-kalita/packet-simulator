import React, { useState } from "react";
import { Tabs, Tab, Box, Paper } from "@mui/material";
import NavtelecomDecoder from "./NavtelecomDecoder";
import NavtelecomGpsGenerator from "./NavtelecomGpsGenerator";
import NavtelecomGpsEncoder from "./NavtelecomGpsEncoder";
import NavtelecomFlexDecoder from "./NavtelecomFlexDecoder";
import NavtelecomFlexDecoderReal from "./NavtelecomFlexDecoder_Real";
import NavtelecomFlexDecoderExtended from "./NavtelecomFlexDecoderExtended";
import NavtelecomFlexDecoderFull from "./NavtelecomFlexDecoder_Full";
import NavtelecomImeiEncoderDecoder from "./NavtelecomIMEI-encode-decode";
import FlexMaskDecoder from "./FlexMaskDecoder";
import NavtelecomFlexConfigurator from "./Navtelecomflexconfigurator";

export default function SimpleNavtelecomTabs() {
  const [tab, setTab] = useState(0);

  return (
    <Paper variant="outlined" sx={{ borderRadius: 1 }}>
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="Navtelecom tools"
        sx={{ borderBottom: 1, borderColor: "divider" }}
      >
        <Tab label="Decoder" />
        <Tab label="GPS Generator" />
        <Tab label="GPS Encoder" />
        <Tab label="Flex Decoder" />
        <Tab label="Flex Real" />
        <Tab label="Flex Extended" />
        <Tab label="Flex Full" />
        <Tab label="IMEI" />
        <Tab label="Flex Mask" />
        <Tab label="Flex Configurator" />
        {/* Add more <Tab /> here when needed */}
      </Tabs>

      <Box sx={{ p: 2 }}>
        {tab === 0 && <NavtelecomDecoder />}
        {tab === 1 && <NavtelecomGpsGenerator />}
        {tab === 2 && <NavtelecomGpsEncoder />}
        {tab === 3 && <NavtelecomFlexDecoder />}
        {tab === 4 && <NavtelecomFlexDecoderReal />}
        {tab === 5 && <NavtelecomFlexDecoderExtended />}
        {tab === 6 && <NavtelecomFlexDecoderFull />}
        {tab === 7 && <NavtelecomImeiEncoderDecoder />}
        {tab === 8 && <FlexMaskDecoder />}
        {tab === 9 && <NavtelecomFlexConfigurator />}

        {/* Add more conditions when adding tabs */}
      </Box>
    </Paper>
  );
}
