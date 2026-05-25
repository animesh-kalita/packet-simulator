import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "universal-converter-settings";

const DEFAULT_SETTINGS = {
  endianness: "big",
  signed: false,
  bitLength: 8,
  byteSeparator: " ",
  activeConversionTab: 0,
  activeToolTab: null,
};

export function useSettings() {
  const [settings, setSettings] = useState(() => loadSettings());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return { settings, updateSetting, resetSettings };
}

function loadSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {}
  return { ...DEFAULT_SETTINGS };
}
