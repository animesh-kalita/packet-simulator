import React, { useState } from "react";
import { Tabs, Tab, Box, Typography } from "@mui/material";

import TeltonikaTools from "./TeltonikaTools";
import TeltonikaDecoder from "./TeltonikaDecoder";
import PacketBreakdown from "./PacketBreakdown";
import ConcoxLoginPacketGenerator from "./ConcoxLoginPacketGenerator";
import ConcoxLoginPacketDecoder from "./ConcoxLoginPacketDecoder";
import APMDecoder from "./APMDecoder";
import SinocastelDecoder from "./SinocastelDecoder";
import Bharat101Builder from "../bharat101/Bharat101Builder";
import PioneerDecoder from "./PioneerDecoder";
import SimpleNavtelecomTabs from "./Navtelecom/SimpleNavtelecomTabs";
import SimpleRMA201Tabs from "./Apm_RMA_201/SimpleRMA201Tabs";
import CastelPacketLab from "./Sinocastel/CastelPacketLab";
import EventFlagTool from "./EventFlag";
import SinocastelPacketViewer from "./Sinocastel/SinocastelPacketViewer";
import SinocastelRawPacketViewer from "./Sinocastel/SinocastelRawPacketViewer";
import App from "./PioneerEducational/src/App";
import UniversalConverter from "./UniversalConverter/UniversalConverter";
import TeltonikaVisualizer from "./Teltonika/TeltonikaVisualizer";

const MenuBar = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const menus = [
    "event_flag",
    "teltonika",
    "teltonika-educational",
    "concox",
    "apm_rma_201",
    "sinocastel",
    "ais140",
    "apm_rmi_204",
    "bharat101",
    "pioneer",
    "pioneer-educational",
    "universal-converter",
    "navtelecom",
    // "dashcam",
    // "jimi_vl110c",
    // "jimi_vl502",
    // "mettax",
    // "queclink",
    // "transight",
    // Add more menu items here easily
  ];

  const renderContent = (selectedMenu) => {
    switch (selectedMenu) {
      case "teltonika":
        return (
          <>
            <TeltonikaTools />
            <TeltonikaDecoder />
            <PacketBreakdown />
          </>
        );
      case "teltonika-educational":
        return (
          <>
            <TeltonikaVisualizer />
          </>
        );
      case "concox":
        return (
          <>
            <ConcoxLoginPacketGenerator />
            <ConcoxLoginPacketDecoder />
          </>
        );
      case "apm_rma_201":
        return (
          <>
            <SimpleRMA201Tabs />
          </>
        );
      case "sinocastel":
        return (
          <>
            {/* <SinocastelDecoder /> */}
            <CastelPacketLab />
            {/* <SinocastelPacketViewer /> */}
            <SinocastelRawPacketViewer />
          </>
        );
      case "bharat101":
        return (
          <>
            <Bharat101Builder />
          </>
        );
      case "pioneer":
        return (
          <>
            {/* <PioneerPacketBuilder /> */}
            {/* <PioneerPositionDecoder /> */}
            <PioneerDecoder />
          </>
        );
      case "universal-converter":
        return <UniversalConverter />;
      case "pioneer-educational":
        return (
          <>
            {/* <PioneerPacketBuilder /> */}
            {/* <PioneerPositionDecoder /> */}
            <App />
          </>
        );
      case "navtelecom":
        return (
          <>
            <SimpleNavtelecomTabs />
          </>
        );
      case "event_flag":
        return <EventFlagTool />;

      // case "queclink":
      //   return <QueclinkTools />;

      default:
        return (
          <Typography variant="h6" color="text.secondary" align="center">
            Content for <strong>{selectedMenu}</strong> is not implemented yet.
          </Typography>
        );
    }
  };

  const selectedMenu = menus[value];

  return (
    <Box>
      <Tabs
        value={value}
        onChange={handleChange}
        aria-label="device menu tabs"
        variant="scrollable"
        scrollButtons="auto"
      >
        {menus.map((menu, index) => (
          <Tab key={menu} label={menu.toUpperCase()} value={index} />
        ))}
      </Tabs>

      <Box sx={{ p: 3 }}>{renderContent(selectedMenu)}</Box>
    </Box>
  );
};

export default MenuBar;
