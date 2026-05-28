import { useState, useCallback, useRef } from "react";
import { TeltonikaParser, DECODER_STATES } from "../utils/teltonikaParser.js";
import {
  hexToBuffer,
  injectError,
  simulateFragmentation,
} from "../utils/hexUtils.js";
import {
  validatePacketStructure,
  validateSequence,
} from "../utils/packetValidators.js";

export function useTeltonikaDecoder() {
  const parserRef = useRef(new TeltonikaParser());
  const [decoderState, setDecoderState] = useState(DECODER_STATES.WAITING_IMEI);
  const [sessionState, setSessionState] = useState("DISCONNECTED");
  const [imei, setImei] = useState(null);
  const [codec, setCodec] = useState(null);
  const [packetCount, setPacketCount] = useState(0);
  const [positions, setPositions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [errors, setErrors] = useState([]);
  const [bufferSize, setBufferSize] = useState(0);
  const [pendingChunks, setPendingChunks] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [currentPacket, setCurrentPacket] = useState(null);
  const [lastAck, setLastAck] = useState(null);

  const addLog = useCallback((event, message) => {
    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
      event,
      message,
    };
    setLogs((prev) => [...prev, logEntry]);
    parserRef.current.addLog(event, message);
  }, []);

  const addTimelineStep = useCallback((step) => {
    setTimeline((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        timestamp: Date.now(),
        ...step,
      },
    ]);
  }, []);

  const updateState = useCallback(() => {
    const state = parserRef.current.getState();
    setDecoderState(state.decoderState);
    setSessionState(state.sessionState);
    setImei(state.imei);
    setCodec(state.codec);
    setPacketCount(state.packetCount);
    setPositions(state.positions);
    setErrors(state.errors);
    setLogs(state.logs);
    setBufferSize(state.bufferSize);
  }, []);

  const connect = useCallback(() => {
    parserRef.current.connect();
    addLog("CONNECTED", "TCP connection established");
    addTimelineStep({
      type: "CONNECT",
      message: "TCP connection established",
      status: "success",
    });
    updateState();
  }, [addLog, addTimelineStep, updateState]);

  const disconnect = useCallback(() => {
    parserRef.current.disconnect();
    addLog("DISCONNECTED", "TCP connection closed");
    addTimelineStep({
      type: "CLOSE",
      message: "TCP connection closed",
      status: "info",
    });
    updateState();
  }, [addLog, addTimelineStep, updateState]);

  const reset = useCallback(() => {
    parserRef.current.reset();
    setTimeline([]);
    setCurrentPacket(null);
    setLastAck(null);
    addLog("RESET", "Decoder reset to initial state");
    addTimelineStep({
      type: "RESET",
      message: "Decoder reset",
      status: "info",
    });
    updateState();
  }, [addLog, addTimelineStep, updateState]);

  const processHexString = useCallback(
    (hexString) => {
      try {
        addLog(
          "INPUT_RECEIVED",
          `Received hex input: ${hexString.substring(0, 50)}${hexString.length > 50 ? "..." : ""}`,
        );
        addTimelineStep({
          type: "INPUT",
          message: `Hex input: ${hexString.substring(0, 50)}${hexString.length > 50 ? "..." : ""}`,
          status: "info",
          data: hexString,
        });

        parserRef.current.appendData(hexString);
        updateState();

        const results = parserRef.current.processBuffer();

        for (const result of results) {
          if (result.type === "HEARTBEAT") {
            addTimelineStep({
              type: "HEARTBEAT",
              message: "Received 0xFF heartbeat",
              status: "info",
            });
          } else if (result.type === "IMEI") {
            addTimelineStep({
              type: "IMEI_RECEIVED",
              message: `IMEI received: ${result.imei}`,
              status: "success",
              data: result.imei,
            });
            setLastAck(result.ack);
            addTimelineStep({
              type: "ACK_SENT",
              message: "IMEI acknowledgment sent: 0x01",
              status: "success",
              data: result.ack,
            });
          } else if (result.type === "AVL") {
            addTimelineStep({
              type: "AVL_RECEIVED",
              message: `AVL data received: ${result.count} records, codec 0x${result.codec.toString(16).toUpperCase()}`,
              status: "success",
              data: { count: result.count, codec: result.codec },
            });

            if (result.crcValid !== undefined) {
              addTimelineStep({
                type: "CRC_VALIDATED",
                message: result.crcValid
                  ? `CRC match (computed: ${result.crcComputed})`
                  : `CRC mismatch! Expected ${result.crcExpected}, computed ${result.crcComputed}`,
                status: result.crcValid ? "success" : "error",
              });
            }

            addTimelineStep({
              type: "AVL_PARSED",
              message: `Parsed ${result.count} AVL records`,
              status: "success",
              data: result.positions,
            });

            if (result.ack) {
              setLastAck(result.ack);
              addTimelineStep({
                type: "ACK_SENT",
                message: `ACK sent: ${result.ack.toString("hex")}`,
                status: "success",
                data: result.ack,
              });
            }
          }
        }

        updateState();
        return results;
      } catch (error) {
        addLog("ERROR", `Processing error: ${error.message}`);
        addTimelineStep({
          type: "ERROR",
          message: error.message,
          status: "error",
        });
        setErrors((prev) => [
          ...prev,
          { timestamp: Date.now(), message: error.message },
        ]);
        updateState();
        return [];
      }
    },
    [addLog, addTimelineStep, updateState],
  );

  const processChunked = useCallback(
    (hexString, chunkSize) => {
      const buffer = hexToBuffer(hexString);
      const chunks = [];

      for (let i = 0; i < buffer.length; i += chunkSize) {
        chunks.push(
          buffer
            .slice(i, Math.min(i + chunkSize, buffer.length))
            .toString("hex")
            .toUpperCase(),
        );
      }

      setPendingChunks(chunks);
      addLog(
        "CHUNK_SIMULATION",
        `Simulating ${chunks.length} chunks of ~${chunkSize} bytes each`,
      );
      addTimelineStep({
        type: "CHUNK_SIMULATION",
        message: `Sending ${chunks.length} chunks (~${chunkSize} bytes each)`,
        status: "info",
        data: chunks,
      });

      let results = [];
      for (let i = 0; i < chunks.length; i++) {
        addTimelineStep({
          type: "CHUNK_SENT",
          message: `Sending chunk ${i + 1}/${chunks.length}: ${chunks[i]}`,
          status: "info",
          data: chunks[i],
        });

        const chunkResults = processHexString(chunks[i]);
        results = [...results, ...chunkResults];
      }

      setPendingChunks([]);
      return results;
    },
    [addLog, addTimelineStep, processHexString],
  );

  const processFragmented = useCallback(
    (hexString, minChunk = 4, maxChunk = 16) => {
      const chunks = simulateFragmentation(hexString, minChunk, maxChunk);
      const chunkHexes = chunks.map((c) => c.toString("hex").toUpperCase());

      setPendingChunks(chunkHexes);
      addLog(
        "FRAGMENTATION",
        `Simulating packet fragmentation into ${chunks.length} random-sized chunks`,
      );
      addTimelineStep({
        type: "FRAGMENTATION",
        message: `Simulating ${chunks.length} random-sized chunks`,
        status: "info",
        data: chunkHexes,
      });

      let results = [];
      for (let i = 0; i < chunkHexes.length; i++) {
        addTimelineStep({
          type: "FRAGMENT_SENT",
          message: `Fragment ${i + 1}/${chunkHexes.length} (${chunkHexes[i].length / 2} bytes): ${chunkHexes[i]}`,
          status: "info",
          data: chunkHexes[i],
        });

        const chunkResults = processHexString(chunkHexes[i]);
        results = [...results, ...chunkResults];
      }

      setPendingChunks([]);
      return results;
    },
    [addLog, addTimelineStep, processHexString],
  );

  const injectErrorAndProcess = useCallback(
    (hexString, errorType) => {
      const corrupted = injectError(hexString, errorType);
      const corruptedHex = corrupted.toString("hex").toUpperCase();

      addLog(
        "ERROR_INJECTION",
        `Injected ${errorType} error. New hex: ${corruptedHex}`,
      );
      addTimelineStep({
        type: "ERROR_INJECTION",
        message: `Injected ${errorType} error`,
        status: "warning",
        data: { original: hexString, corrupted: corruptedHex, errorType },
      });

      return processHexString(corruptedHex);
    },
    [addLog, addTimelineStep, processHexString],
  );

  const validateCurrentBuffer = useCallback(() => {
    const buffer = parserRef.current.buffer;
    if (buffer.length === 0) {
      return { valid: true, errors: [], warnings: [] };
    }

    const validation = validatePacketStructure(buffer);
    addLog(
      "VALIDATION",
      `Buffer validation: ${validation.valid ? "PASSED" : "FAILED"}`,
    );
    return validation;
  }, [addLog]);

  const getPositionsJSON = useCallback(() => {
    return JSON.stringify(
      positions.map((p) => p.toJSON()),
      null,
      2,
    );
  }, [positions]);

  return {
    decoderState,
    sessionState,
    imei,
    codec,
    packetCount,
    positions,
    logs,
    errors,
    bufferSize,
    pendingChunks,
    timeline,
    currentPacket,
    lastAck,
    connect,
    disconnect,
    reset,
    processHexString,
    processChunked,
    processFragmented,
    injectErrorAndProcess,
    validateCurrentBuffer,
    getPositionsJSON,
    parser: parserRef.current,
  };
}

export default useTeltonikaDecoder;
