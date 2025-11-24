const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const simulationEngine = require("../simulation/engine");
const logger = require("../utils/logger");

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [".txt", ".js"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only .txt and .js files are allowed"));
    }
  },
});

// Parse packets from different sources
function parsePackets(
  source,
  type,
  fileContent = null,
  convertToBinary = false
) {
  let packets = [];

  if (type === "text") {
    packets = source
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  } else if (type === "file" && fileContent) {
    const ext = path.extname(source).toLowerCase();

    if (ext === ".txt") {
      packets = fileContent
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    } else if (ext === ".js") {
      try {
        // Create a temporary file and require it
        const tempPath = path.join(
          __dirname,
          "../temp",
          `temp_${Date.now()}.js`
        );
        fs.mkdirSync(path.dirname(tempPath), { recursive: true });
        fs.writeFileSync(tempPath, fileContent);

        delete require.cache[require.resolve(tempPath)];
        const packetModule = require(tempPath);

        if (Array.isArray(packetModule)) {
          packets = packetModule;
        } else {
          throw new Error("JS file must export an array of packets");
        }

        // Clean up temp file
        fs.unlinkSync(tempPath);
      } catch (error) {
        throw new Error(`Error parsing JS file: ${error.message}`);
      }
    }
  }

  // Binary mode means packets are already in hex format - no conversion needed
  if (convertToBinary) {
    console.log(
      "[DEBUG] Binary mode enabled - packets will be treated as hex strings"
    );
    packets.forEach((packet, i) => {
      console.log(`[DEBUG] Packet ${i + 1}:`, packet.substring(0, 50));
    });
  }

  return packets;
}

// Start simulation
router.post("/start", upload.single("packetFile"), async (req, res) => {
  try {
    const {
      protocol,
      host,
      port,
      url,
      method,
      headers,
      delimiter,
      interval,
      inputType,
      textInput,
      convertToBinary,
    } = req.body;

    const shouldConvertToBinary =
      convertToBinary === "true" || convertToBinary === true;
    console.log(
      "[DEBUG START] convertToBinary received:",
      convertToBinary,
      "| shouldConvertToBinary:",
      shouldConvertToBinary
    );
    let packets = [];

    if (inputType === "text") {
      packets = parsePackets(textInput, "text", null, shouldConvertToBinary);
    } else if (inputType === "file" && req.file) {
      const fileContent = fs.readFileSync(req.file.path, "utf-8");
      packets = parsePackets(
        req.file.originalname,
        "file",
        fileContent,
        shouldConvertToBinary
      );

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
    } else {
      return res.status(400).json({ error: "No packets provided" });
    }

    if (packets.length === 0) {
      return res.status(400).json({ error: "No valid packets found" });
    }

    const config = {
      protocol,
      packets,
      interval: parseInt(interval) || 5,
      delimiter: delimiter || "\r\n",
      isBinaryMode: shouldConvertToBinary,
    };

    console.log("[DEBUG] Config isBinaryMode:", config.isBinaryMode);
    console.log("[DEBUG] First packet sample:", packets[0]?.substring(0, 50));

    if (protocol === "tcp") {
      config.host = host || "127.0.0.1";
      config.port = parseInt(port) || 19999;
    } else {
      config.url = url;
      config.method = method || "POST";
      config.headers = headers ? JSON.parse(headers) : {};
    }

    await simulationEngine.startSimulation(config);

    res.json({
      success: true,
      message: "Simulation started",
      packetCount: packets.length,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Stop simulation
router.post("/stop", (req, res) => {
  simulationEngine.stopSimulation();
  res.json({ success: true, message: "Simulation stopped" });
});

// Get simulation status
router.get("/status", (req, res) => {
  res.json(simulationEngine.getStatus());
});

// Preview packets
router.post("/preview", upload.single("packetFile"), (req, res) => {
  try {
    const { inputType, textInput, convertToBinary } = req.body;
    const shouldConvertToBinary =
      convertToBinary === "true" || convertToBinary === true;
    console.log(
      "[DEBUG PREVIEW] convertToBinary received:",
      convertToBinary,
      "| shouldConvertToBinary:",
      shouldConvertToBinary
    );
    let packets = [];

    if (inputType === "text") {
      packets = parsePackets(textInput, "text", null, shouldConvertToBinary);
    } else if (inputType === "file" && req.file) {
      const fileContent = fs.readFileSync(req.file.path, "utf-8");
      packets = parsePackets(
        req.file.originalname,
        "file",
        fileContent,
        shouldConvertToBinary
      );

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
    }

    // Return first 10 packets for preview
    res.json({
      packets: packets.slice(0, 10),
      total: packets.length,
      preview: packets.length > 10,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
