import { useState, useCallback, useRef, useEffect } from 'react';
import { parsePacketStep } from '../utils/packetParser';

const useBytesParser = (packetHexData) => {
  const [bytes, setBytes] = useState([]);
  const [position, setPosition] = useState(0);
  const [stepHistory, setStepHistory] = useState([]);
  const [breakpoints, setBreakpoints] = useState([]);
  const parserRef = useRef(null);

  // Initialize parser when packet data changes
  const initializeParser = useCallback((hexData) => {
    if (!hexData) {
      setBytes([]);
      setPosition(0);
      setStepHistory([]);
      return;
    }

    // Convert hex string to byte array
    const cleanedHex = hexData.replace(/\s/g, '');
    const byteArray = [];
    
    for (let i = 0; i < cleanedHex.length; i += 2) {
      const byte = parseInt(cleanedHex.substr(i, 2), 16);
      if (!isNaN(byte)) {
        byteArray.push(byte);
      }
    }

    setBytes(byteArray);
    setPosition(0);
    setStepHistory([]);
    
    // Initialize parser reference
    parserRef.current = {
      bytes: byteArray,
      position: 0,
      history: []
    };
  }, []);

  // Auto-initialize when packet data changes
  useEffect(() => {
    initializeParser(packetHexData);
  }, [packetHexData, initializeParser]);

  const parseStep = useCallback(() => {
    if (!parserRef.current || parserRef.current.position >= parserRef.current.bytes.length) {
      return false;
    }

    const result = parsePacketStep(parserRef.current);
    if (result) {
      parserRef.current = result.parserState;
      setPosition(result.parserState.position);
      setStepHistory(prev => [...prev, result.stepInfo]);
      return true;
    }
    return false;
  }, []);

  const resetParser = useCallback(() => {
    if (parserRef.current && bytes.length > 0) {
      parserRef.current = {
        bytes: [...bytes],
        position: 0,
        history: []
      };
      setPosition(0);
      setStepHistory([]);
    }
  }, [bytes]);

  const setBreakpoint = useCallback((index) => {
    if (index >= 0 && index < bytes.length) {
      setBreakpoints(prev => {
        if (prev.includes(index)) {
          return prev.filter(i => i !== index);
        }
        return [...prev, index];
      });
    }
  }, [bytes]);

  return {
    bytes,
    position,
    stepHistory,
    breakpoints,
    parseStep,
    resetParser,
    setBreakpoint
  };
};

export default useBytesParser;