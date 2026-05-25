import React, { useState, useEffect } from "react";
import { Box, Typography, Tabs, Tab, Stack } from "@mui/material";
import PacketInputPanel from "./components/PacketInputPanel";
import ByteBufVisualizer from "./components/ByteBufVisualizer";
import PacketClassifier from "./components/PacketClassifier";
import PacketTimeline from "./components/PacketTimeline";
import IMEIEditor from "./components/IMEIEditor";
import PacketStructureMap from "./components/PacketStructureMap";
import ParsingExplanationPanel from "./components/ParsingExplanationPanel";
import ParsingFlowGraph from "./components/ParsingFlowGraph";
import AckVisualizer from "./components/AckVisualizer";

// Rename App to PioneerEducationalPacketVisualizer for modularity
function PioneerEducationalPacketVisualizer() {
  const [packetData, setPacketData] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [packetType, setPacketType] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0); // New state for tab selection

  // Handle packet data changes from input panel
  const handlePacketChange = (data) => {
    setPacketData(data);
    setCurrentStep(0); // Reset to first step when new packet is loaded
    setSelectedTab(0); // Reset to first tab
  };

  // Handle template loading
  const handleTemplateLoad = (template) => {
    setPacketData(template.hex);
    setCurrentStep(0);
    setSelectedTab(0); // Reset to first tab
    // In a real app, you might set the packet type here based on template
  };

  // Update packet type based on classification (simplified, will be replaced by real classifier)
  useEffect(() => {
    if (packetData) {
      const cleaned = packetData.replace(/\s/g, "");
      if (cleaned.length >= 8) {
        try {
          // Simple heuristic to determine packet type from first few bytes (placeholder)
          const typeByte = parseInt(cleaned.substring(4, 6), 16);
          setPacketType(typeByte);
        } catch (e) {
          setPacketType(null);
        }
      } else {
        setPacketType(null);
      }
    } else {
      setPacketType(null);
    }
  }, [packetData]);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  // Define tab content components
  const tabComponents = [
    <PacketClassifier packetData={packetData} key="classifier" />,
    <ByteBufVisualizer
      packetData={packetData}
      onStepChange={setCurrentStep}
      key="bytebuf"
    />,
    <PacketTimeline
      parsingSteps={[]} // Placeholder
      currentStepIndex={currentStep}
      onStepChange={setCurrentStep}
      key="timeline"
    />,
    <PacketStructureMap
      packetType={packetType}
      currentPosition={currentStep}
      key="structure"
    />,
    <IMEIEditor
      packetBytes={[]} // Placeholder
      onIMEIChange={(imei) => console.log("IMEI changed:", imei)}
      onPacketUpdate={(bytes) => console.log("Packet updated:", bytes)}
      key="imei"
    />,
    <ParsingExplanationPanel
      currentStep={{}} // Placeholder
      key="explanation"
    />,
    <ParsingFlowGraph
      packetType={packetType}
      currentStep={packetType !== null ? `step_${currentStep}` : null}
      key="flow"
    />,
    <AckVisualizer
      packetType={packetType !== null ? packetType : 0x02} // Placeholder default
      imei="353377008888999" // Placeholder
      index={1} // Placeholder
      key="ack"
    />,
  ];

  return (
    <Stack spacing={3} sx={{ p: 2 }}>
      {/* Header */}
      <Box>
        <Typography variant="h4" align="center" gutterBottom>
          Pioneer GPS Protocol Packet Visualizer
        </Typography>
        <Typography
          variant="h6"
          align="center"
          color="text.secondary"
          gutterBottom
        >
          Interactive Educational Tool for Netty ByteBuf Parsing
        </Typography>
      </Box>

      {/* Packet Input Panel - Always Visible */}
      <PacketInputPanel
        onPacketChange={handlePacketChange}
        onTemplateLoad={handleTemplateLoad}
      />

      {/* Main Content Tabs */}
      {packetData && (
        <Box>
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            sx={{ width: "100%" }}
          >
            <Tab label="Packet Classification" />
            <Tab label="ByteBuf Visualizer" />
            <Tab label="Parsing Timeline" />
            <Tab label="Packet Structure" />
            <Tab label="IMEI Editor" />
            <Tab label="Explanations" />
            <Tab label="Flow Graph" />
            <Tab label="ACK Response" />
          </Tabs>

          <Box
            sx={{
              mt: 3,
              p: 3,
              border: "1px solid",
              borderColor: "grey.300",
              borderRadius: 1,
            }}
          >
            {tabComponents[selectedTab]}
          </Box>
        </Box>
      )}
    </Stack>
  );
}

export default PioneerEducationalPacketVisualizer;
