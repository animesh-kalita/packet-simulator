# Pioneer GPS Protocol Packet Visualizer

This is a modular React + MUI based Packet Parsing Visualization System designed to visually explain Netty ByteBuf parsing for Pioneer GPS protocol packets.

## Overview

The system provides interactive visualizations to help beginners understand how binary packet parsing works internally, while still being technically accurate for real protocol debugging.

## Components

All components are designed to be modular and reusable - you can copy and paste them into your existing React application.

### Core Components

1. **PacketInputPanel.jsx** - Input interface for packet data (hex/ASCII) with sample loader
2. **ByteBufVisualizer.jsx** - Interactive Netty ByteBuf visualization with stepping controls
3. **PacketClassifier.jsx** - Automatic packet type detection and classification
4. **PacketTimeline.jsx** - Step-by-step parsing timeline visualization
5. **IMEIEditor.jsx** - Specialized editor for modifying IMEI in packets
6. **PacketStructureMap.jsx** - Visual packet structure mapping
7. **ParsingExplanationPanel.jsx** - Detailed explanations at beginner/intermediate/advanced levels
8. **ParsingFlowGraph.jsx** - Visual flow diagram of parsing process
9. **AckVisualizer.jsx** - ACK/response packet generation visualization

### Utilities

- **useBytesParser.js** - Custom hook for packet parsing simulation
- **bytesOperation.js** - Byte manipulation utilities (BCD encoding/decoding, bit operations)
- **packetClassifier.js** - Packet type classification logic
- **packetParser.js** - Packet parsing simulation for visualization
- **constants.js** - Packet type headers, templates, and structure definitions

## Usage

To use these components in your existing React application:

1. Copy the `src/components`, `src/hooks`, and `src/utils` directories to your project
2. Import the components you need:
   ```jsx
   import PacketInputPanel from './components/PacketInputPanel';
   import ByteBufVisualizer from './components/ByteBufVisualizer';
   // ... etc
   ```
3. Use them in your JSX:
   ```jsx
   function MyPacketViewer() {
     const [packetData, setPacketData] = useState('');
     
     return (
       <div>
         <PacketInputPanel onPacketChange={setPacketData} />
         {packetData && (
           <div>
             <PacketClassifier packetData={packetData} />
             <ByteBufVisualizer 
               packetData={packetData} 
               onStepChange={setCurrentStep} 
             />
           </div>
         )}
       </div>
     );
   }
   ```

## Features

- **Educational Focus**: Every parsing operation includes beginner-friendly explanations
- **Interactive Visualization**: See exactly how Netty ByteBuf moves during parsing
- **Multiple Packet Types**: Supports GPS, Alarm, BLE, CAN, and other Pioneer packet types
- **Step-by-Step Debugging**: Forward/backward stepping through parsing operations
- **IMEI Editing**: Modify IMEI while preserving packet integrity
- **Protocol Validation**: Detect invalid/corrupted packets with explanations
- **ACK Visualization**: See how response packets are generated
- **Real-time Classification**: Automatic packet type detection

## Design Principles

- **Beginner-Friendly**: Complex concepts explained at multiple levels
- **Technically Accurate**: Based on actual Pioneer parser implementation
- **Modular Architecture**: Each component can be used independently
- **Responsive Design**: Works on desktop and tablet screens
- **Modern UI**: Built with Material-UI for professional appearance

## Packet Types Supported

- Login (0x01)
- GPS (0x02)
- Heartbeat (0x03)
- Alarm (0x04)
- Network (0x05)
- Driver Behavior (0x05, 0x06)
- BLE (0x10)
- Network 2 (0x11)
- BLE Location (0x12)
- GPS 2 (0x13)
- Alarm 2 (0x14)
- Manual CAN (0x44)
- Pioneer X (0x33, 0x34)
- Command (0x81)

## Dependencies

- React 18+
- @mui/material 5+
- @mui/icons-material 5+

## Customization

Components can be customized by:
- Modifying the constants in `src/utils/constants.js`
- Adjusting styling through MUI theme overrides
- Extending the parsing logic in `src/utils/packetParser.js`
- Adding new packet types to the classification system

## Educational Approach

Each component includes:
- **Beginner Explanations**: Simple, analogy-based explanations
- **Intermediate Details**: Technical specifics of how parsing works
- **Advanced/Engineering**: Protocol specification details and implementation notes
- **Common Pitfalls**: Warnings about frequent mistakes and misunderstandings
- **Real-world Examples**: Practical scenarios showing why concepts matter