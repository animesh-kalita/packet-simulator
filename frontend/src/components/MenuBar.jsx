import React, { useState } from "react";
import { Tabs, Tab, Box, Typography } from "@mui/material";

import TeltonikaTools from "./TeltonikaTools";
import TeltonikaDecoder from "./TeltonikaDecoder";
import PacketBreakdown from "./PacketBreakdown";
import ConcoxLoginPacketGenerator from "./ConcoxLoginPacketGenerator";
import ConcoxLoginPacketDecoder from "./ConcoxLoginPacketDecoder";

const MenuBar = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const menus = [
    "teltonika",
    "concox",
    "ais140",
    "apm_rma_201",
    "apm_rmi_204",
    "bharat101",
    // "dashcam",
    // "jimi_vl110c",
    // "jimi_vl502",
    // "mettax",
    // "navtelecom",
    // "pioneer",
    // "queclink",
    // "sinocastel",
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
      case "concox":
        return (
          <>
            <ConcoxLoginPacketGenerator />
            <ConcoxLoginPacketDecoder />
          </>
        );

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
