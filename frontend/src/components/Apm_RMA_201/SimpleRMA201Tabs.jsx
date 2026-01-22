import { useState } from "react";
import { Tabs, Tab, Box } from "@mui/material";
import APMDecoder from "../APMDecoder";
import FullMDPacketEditor from "./FullMDPacketEditor";

export default function SimpleRMA201Tabs() {
  const [tab, setTab] = useState(0);

  return (
    <>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} centered>
        <Tab label="APMDecoder" />
        <Tab label="FullMDPacketEditor" />

        {/* Add more <Tab /> here when needed */}
      </Tabs>

      <Box sx={{ p: 3 }}>
        {tab === 0 && <APMDecoder />}
        {tab === 1 && <FullMDPacketEditor />}

        {/* Add more conditions when adding tabs */}
      </Box>
    </>
  );
}
