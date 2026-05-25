import React, { useState, useEffect, useRef, useCallback } from "react";
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

function App() {
  const [packetData, setPacketData] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [packetType, setPacketType] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [parsingSteps, setParsingSteps] = useState([]);
  const [currentStepData, setCurrentStepData] = useState(null);
  const [stepBytes, setStepBytes] = useState([]);
  const parsingStepsRef = useRef([]);

  const handlePacketChange = (data) => {
    setPacketData(data);
    setCurrentStep(0);
    setParsingSteps([]);
    setCurrentStepData(null);
    setStepBytes([]);
  };

  const handleTemplateLoad = (template) => {
    setPacketData(template.hex);
    setCurrentStep(0);
    setParsingSteps([]);
    setCurrentStepData(null);
    setStepBytes([]);
  };

  useEffect(() => {
    if (packetData) {
      const cleaned = packetData.replace(/\s/g, "");
      if (cleaned.length >= 8) {
        try {
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

  const handleStepUpdate = useCallback(
    (steps, stepIndex, latestStep, bytes) => {
      setCurrentStep(stepIndex);
      setParsingSteps(steps);
      setCurrentStepData(latestStep);
      setStepBytes(bytes);
    },
    [],
  );

  const handleStepChange = (newStep) => {
    setCurrentStep(newStep);
    if (parsingSteps[newStep]) {
      setCurrentStepData(parsingSteps[newStep]);
    }
  };

  const tabComponents = [
    <PacketClassifier packetData={packetData} key="classifier" />,
    <ByteBufVisualizer
      packetData={packetData}
      onStepUpdate={handleStepUpdate}
      key="bytebuf"
    />,
    <PacketTimeline
      parsingSteps={parsingSteps}
      currentStepIndex={currentStep}
      onStepChange={handleStepChange}
      key="timeline"
    />,
    <PacketStructureMap
      packetType={packetType}
      currentPosition={currentStep}
      key="structure"
    />,
    <IMEIEditor
      packetBytes={stepBytes}
      onIMEIChange={(imei) => console.log("IMEI changed:", imei)}
      onPacketUpdate={(bytes) => console.log("Packet updated:", bytes)}
      key="imei"
    />,
    <ParsingExplanationPanel currentStep={currentStepData} key="explanation" />,
    <ParsingFlowGraph
      packetType={packetType}
      currentStep={currentStepData ? `step_${currentStep}` : null}
      key="flow"
    />,
    <AckVisualizer
      packetType={packetType !== null ? packetType : 0x02}
      imei="353377008888999"
      index={1}
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
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
            }}
          >
            {tabComponents[selectedTab]}
          </Box>
        </Box>
      )}

      {/* Footer */}
      <Box sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
        <Typography variant="body2">
          Educational Tool for Understanding Netty-Based GPS Packet Parsing
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          Built with React + MUI • Inspired by Wireshark and Protocol Analysis
          Tools
        </Typography>
      </Box>
    </Stack>
  );
}

export default App;
