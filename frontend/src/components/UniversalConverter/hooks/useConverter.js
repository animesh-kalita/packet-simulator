import { useState, useMemo, useCallback } from "react";
import { parseInput, autoDetectFormat } from "../utils/parsers";
import {
  bytesToHex,
  bytesToBinary,
  bytesToDecimal,
  bytesToOctal,
  bytesToASCII,
  bytesToUTF8,
  bytesToUTF16,
  bytesToBase64,
  bytesToByteArray,
  bytesToSignedInt,
  bytesToUnsignedInt,
  bytesToFloat32,
  bytesToFloat64,
  getFloat32Bits,
  getFloat64Bits,
  computeByteStatistics,
} from "../utils/converters";
import { INPUT_FORMATS } from "../utils/constants";

export function useConverter(initialSettings) {
  const [input, setInput] = useState("");
  const [formatOverride, setFormatOverride] = useState(null);
  const [settings, setSettings] = useState(initialSettings);

  const effectiveFormat = useMemo(() => {
    if (formatOverride) return formatOverride;
    return autoDetectFormat(input).type;
  }, [input, formatOverride]);

  const detection = useMemo(() => {
    if (formatOverride) return null;
    return autoDetectFormat(input);
  }, [input, formatOverride]);

  const validation = useMemo(() => {
    return { valid: true, error: null };
  }, []);

  const parseResult = useMemo(() => {
    if (!input || input.trim() === "") {
      return { bytes: null, error: null, detection };
    }
    return parseInput(input, effectiveFormat, settings.endianness);
  }, [input, effectiveFormat, settings.endianness, detection]);

  const results = useMemo(() => {
    const { bytes, error } = parseResult;
    if (!bytes || error) return {};

    const res = {};

    res.hex = bytesToHex(bytes, {
      separator: settings.byteSeparator,
      upperCase: true,
    });
    res.binary = bytesToBinary(bytes, { separator: settings.byteSeparator });
    res.decimal = bytesToDecimal(bytes, { separator: settings.byteSeparator });
    res.octal = bytesToOctal(bytes, { separator: settings.byteSeparator });
    res.ascii = bytesToASCII(bytes);
    res.utf8 = bytesToUTF8(bytes);
    res.utf16 = bytesToUTF16(bytes, settings.endianness);
    res.base64 = bytesToBase64(bytes);
    res.byteArray = bytesToByteArray(bytes);

    if (bytes.length > 0) {
      res.signedInt = bytesToSignedInt(bytes, settings.endianness);
      res.unsignedInt = bytesToUnsignedInt(bytes, settings.endianness);
    }

    if (bytes.length >= 4) {
      res.float32 = bytesToFloat32(bytes, settings.endianness);
    }
    if (bytes.length >= 8) {
      res.float64 = bytesToFloat64(bytes, settings.endianness);
    }

    if (bytes.length === 4) {
      res.float32Bits = getFloat32Bits(
        bytesToFloat32(bytes, settings.endianness),
      );
    }

    res.byteStats = computeByteStatistics(bytes);

    res.byteLength = bytes.length;

    return res;
  }, [parseResult, settings.endianness, settings.byteSeparator]);

  const handleInputChange = useCallback((value) => {
    setInput(value);
  }, []);

  const handleFormatOverride = useCallback((format) => {
    setFormatOverride((prev) => (prev === format ? null : format));
  }, []);

  const clearFormatOverride = useCallback(() => {
    setFormatOverride(null);
  }, []);

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearInput = useCallback(() => {
    setInput("");
  }, []);

  const bytes = parseResult.bytes;
  const error = parseResult.error;

  return {
    input,
    setInput: handleInputChange,
    clearInput,
    format: effectiveFormat,
    formatOverride,
    setFormatOverride: handleFormatOverride,
    clearFormatOverride,
    detection,
    bytes,
    error,
    results,
    settings,
    updateSetting,
  };
}
