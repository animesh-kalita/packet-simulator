import React, { useState } from "react";
import { Tabs, Tab, Box } from "@mui/material";
import NavtelecomDecoder from "./NavtelecomDecoder";
import NavtelecomGpsGenerator from "./NavtelecomGpsGenerator";
import NavtelecomGpsEncoder from "./NavtelecomGpsEncoder";
import NavtelecomFlexDecoder from "./NavtelecomFlexDecoder";
import NavtelecomFlexDecoderReal from "./NavtelecomFlexDecoder_Real";
import NavtelecomFlexDecoderExtended from "./NavtelecomFlexDecoderExtended";
import NavtelecomFlexDecoderFull from "./NavtelecomFlexDecoder_Full";
import NavtelecomImeiEncoderDecoder from "./NavtelecomIMEI-encode-decode";

export default function SimpleNavtelecomTabs() {
  const [tab, setTab] = useState(0);

  return (
    <>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} centered>
        <Tab label="Decoder" />
        <Tab label="GPS Generator" />
        <Tab label="GPS Encoder" />
        <Tab label="Navtelecom Flex Decoder" />
        <Tab label="Navtelecom Flex Real" />
        <Tab label="Navtelecom Flex Extended" />
        <Tab label="Navtelecom Flex Full" />
        <Tab label="Navtelecom IMEI" />
        {/* Add more <Tab /> here when needed */}
      </Tabs>

      <Box sx={{ p: 3 }}>
        {tab === 0 && <NavtelecomDecoder />}
        {tab === 1 && <NavtelecomGpsGenerator />}
        {tab === 2 && <NavtelecomGpsEncoder />}
        {tab === 3 && <NavtelecomFlexDecoder />}
        {tab === 4 && <NavtelecomFlexDecoderReal />}
        {tab === 5 && <NavtelecomFlexDecoderExtended />}
        {tab === 6 && <NavtelecomFlexDecoderFull />}
        {tab === 7 && <NavtelecomImeiEncoderDecoder />}

        {/* Add more conditions when adding tabs */}
      </Box>
    </>
  );
}
