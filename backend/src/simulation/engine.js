const net = require("net");
const axios = require("axios");
const EventEmitter = require("events");
const logger = require("../utils/logger");

class SimulationEngine extends EventEmitter {
  constructor() {
    super();
    this.isRunning = false;
    this.currentSimulation = null;
    this.tcpClient = null;
    this.intervalId = null;
    this.packetIndex = 0;
    this.totalPackets = 0;
  }

  async startSimulation(config) {
    if (this.isRunning) {
      throw new Error(
        "Another simulation is currently running. Please stop it first."
      );
    }

    this.isRunning = true;
    this.currentSimulation = config;
    this.packetIndex = 0;
    this.totalPackets = config.packets.length;

    const logMessage = (msg) => {
      this.emit("log", msg);
      logger.log(msg);
    };

    logMessage(`Starting ${config.protocol.toUpperCase()} simulation`);
    logMessage(
      `Target: ${
        config.protocol === "tcp" ? `${config.host}:${config.port}` : config.url
      }`
    );
    logMessage(`Packets: ${this.totalPackets}, Interval: ${config.interval}s`);

    try {
      if (config.protocol === "tcp") {
        await this.startTcpSimulation(config);
      } else {
        await this.startHttpSimulation(config);
      }
    } catch (error) {
      this.emit("log", `[ERROR] ${error.message}`);
      this.stopSimulation();
      throw error;
    }
  }

  async startTcpSimulation(config) {
    return new Promise((resolve, reject) => {
      this.tcpClient = new net.Socket();

      this.tcpClient.connect(config.port, config.host, () => {
        const msg = `[TCP] Connected to ${config.host}:${config.port}`;
        this.emit("log", msg);
        logger.log(msg);
        this.sendNextTcpPacket(config, resolve);
      });

      this.tcpClient.on("error", (err) => {
        const msg = `[TCP ERROR] ${err.message}`;
        this.emit("log", msg);
        logger.log(msg);
        reject(err);
      });

      this.tcpClient.on("close", () => {
        const msg = "[TCP] Connection closed";
        this.emit("log", msg);
        logger.log(msg);
      });
    });
  }

  sendNextTcpPacket(config, resolve) {
    if (!this.isRunning || this.packetIndex >= this.totalPackets) {
      this.tcpClient.end();
      const msg = `[TCP] Simulation completed. Sent ${this.packetIndex} packets.`;
      this.emit("log", msg);
      logger.log(msg);
      this.stopSimulation();
      resolve();
      return;
    }

    const packet = config.packets[this.packetIndex];
    const delimiter = config.delimiter || "\r\n";

    this.tcpClient.write(packet + delimiter);
    const msg = `[TCP] Sent packet ${this.packetIndex + 1}/${
      this.totalPackets
    }: ${packet.substring(0, 100)}${packet.length > 100 ? "..." : ""}`;
    this.emit("log", msg);
    logger.log(msg);

    this.packetIndex++;

    if (this.packetIndex < this.totalPackets) {
      this.intervalId = setTimeout(() => {
        this.sendNextTcpPacket(config, resolve);
      }, config.interval * 1000);
    } else {
      this.sendNextTcpPacket(config, resolve);
    }
  }

  async startHttpSimulation(config) {
    for (let i = 0; i < this.totalPackets && this.isRunning; i++) {
      const packet = config.packets[i];

      try {
        await this.sendHttpPacket(config, packet, i + 1);

        if (i < this.totalPackets - 1 && this.isRunning) {
          await new Promise((resolve) => {
            this.intervalId = setTimeout(resolve, config.interval * 1000);
          });
        }
      } catch (error) {
        const msg = `[HTTP ERROR] Packet ${i + 1}: ${error.message}`;
        this.emit("log", msg);
        logger.log(msg);
      }
    }

    if (this.isRunning) {
      const msg = `[HTTP] Simulation completed. Sent ${this.totalPackets} packets.`;
      this.emit("log", msg);
      logger.log(msg);
      this.stopSimulation();
    }
  }

  async sendHttpPacket(config, packet, packetNum) {
    const axiosConfig = {
      method: config.method.toLowerCase(),
      url: config.url,
      timeout: 10000,
      headers: config.headers || {},
    };

    if (config.method.toUpperCase() === "POST") {
      axiosConfig.data = packet;
      if (!axiosConfig.headers["Content-Type"]) {
        axiosConfig.headers["Content-Type"] = "text/plain";
      }
    } else if (config.method.toUpperCase() === "GET") {
      // Append packet as query parameter
      const separator = config.url.includes("?") ? "&" : "?";
      axiosConfig.url = `${config.url}${separator}data=${encodeURIComponent(
        packet
      )}`;
    }

    const response = await axios(axiosConfig);
    const msg = `[HTTP] ${config.method.toUpperCase()} packet ${packetNum}/${
      this.totalPackets
    } - Status: ${response.status}`;
    this.emit("log", msg);
    logger.log(msg);
  }

  stopSimulation() {
    if (!this.isRunning) return;

    this.isRunning = false;

    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }

    if (this.tcpClient) {
      this.tcpClient.destroy();
      this.tcpClient = null;
    }

    const msg = "[STOP] Simulation stopped";
    this.emit("log", msg);
    logger.log(msg);
    this.currentSimulation = null;
    this.packetIndex = 0;
    this.totalPackets = 0;
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      currentSimulation: this.currentSimulation,
      progress:
        this.totalPackets > 0
          ? {
              current: this.packetIndex,
              total: this.totalPackets,
              percentage: Math.round(
                (this.packetIndex / this.totalPackets) * 100
              ),
            }
          : null,
    };
  }
}

module.exports = new SimulationEngine();
