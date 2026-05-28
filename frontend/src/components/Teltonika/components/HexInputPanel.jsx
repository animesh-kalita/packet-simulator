import React, { useState, useCallback } from "react";
import { EXAMPLE_PACKETS } from "./constants/examples.js";

import {
  Box,
  Button,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";

function HexInputPanel({
  onHexSubmit,
  onChunkedSubmit,
  onFragmentedSubmit,
  onFileUpload,
  isProcessing,
}) {
  const [hexInput, setHexInput] = useState("");

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (hexInput.trim()) {
        onHexSubmit(hexInput.replace(/\s/g, ""));
      }
    },
    [hexInput, onHexSubmit],
  );

  const handleLoadExample = useCallback((name) => {
    const entry = EXAMPLE_PACKETS[name];
    if (entry) setHexInput(entry);
  }, []);

  const handleFileChange = useCallback(
    (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const arrayBuf = evt.target.result;
        const bytes = new Uint8Array(arrayBuf);
        let hex = "";
        bytes.forEach((b) => {
          hex += b.toString(16).padStart(2, "0");
        });
        setHexInput(hex.toUpperCase());
        if (onFileUpload) onFileUpload(hex.toUpperCase());
      };
      reader.readAsArrayBuffer(file);
    },
    [onFileUpload],
  );

  return (
    <Box
      sx={{
        backgroundColor: "#252526",
        borderRadius: 2,
        p: 2,
        border: "1px solid #3C3C3C",
        fontFamily: "'Roboto Mono', 'Fira Code', 'Consolas', monospace",
      }}
    >
      {/* Title */}
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: "bold",
          color: "#4FC3F7",
          mb: 1.5,
          pb: 1.25,
          borderBottom: "1px solid #3C3C3C",
          fontFamily: "inherit",
          fontSize: "15px",
        }}
      >
        Hex Input
      </Typography>

      {/* Textarea + action buttons */}
      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          multiline
          minRows={4}
          fullWidth
          value={hexInput}
          onChange={(e) => setHexInput(e.target.value.toUpperCase())}
          placeholder="Paste hex stream (e.g. 000F333536333037303432343431303133)"
          inputProps={{ spellCheck: false }}
          sx={{
            "& .MuiOutlinedInput-root": {
              backgroundColor: "#1E1E1E",
              color: "#E0E0E0",
              fontFamily: "'Roboto Mono', monospace",
              fontSize: "13px",
              "& fieldset": { borderColor: "#3C3C3C" },
              "&:hover fieldset": { borderColor: "#555" },
              "&.Mui-focused fieldset": { borderColor: "#4FC3F7" },
            },
          }}
        />

        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={!hexInput.trim()}
            sx={{
              backgroundColor: "#4FC3F7",
              color: "#1E1E1E",
              fontWeight: "bold",
              fontSize: "13px",
              textTransform: "none",
              "&:hover": { backgroundColor: "#29B6F6" },
              "&.Mui-disabled": { backgroundColor: "#3C3C3C", color: "#666" },
            }}
          >
            Process
          </Button>

          <Button
            type="button"
            variant="contained"
            onClick={() => setHexInput("")}
            sx={{
              backgroundColor: "#3C3C3C",
              color: "#E0E0E0",
              fontWeight: "bold",
              fontSize: "13px",
              textTransform: "none",
              "&:hover": { backgroundColor: "#4A4A4A" },
            }}
          >
            Clear
          </Button>

          <Button
            component="label"
            variant="contained"
            startIcon={<UploadFileIcon sx={{ fontSize: "16px !important" }} />}
            sx={{
              backgroundColor: "#1565C0",
              color: "white",
              fontWeight: "bold",
              fontSize: "13px",
              textTransform: "none",
              "&:hover": { backgroundColor: "#1976D2" },
            }}
          >
            Upload File
            <input
              type="file"
              accept=".bin,.hex,.txt"
              hidden
              onChange={handleFileChange}
            />
          </Button>
        </Stack>
      </Box>

      {/* Example Packets */}
      <Divider sx={{ borderColor: "#3C3C3C", mt: 2, mb: 1.5 }} />
      <Typography
        sx={{
          fontSize: "11px",
          color: "#9E9E9E",
          mb: 1,
          textTransform: "uppercase",
          fontFamily: "inherit",
          letterSpacing: "0.08em",
        }}
      >
        Example Packets
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {[
          { key: "imei", label: "IMEI" },
          { key: "avl", label: "AVL Codec 8" },
          { key: "avlFull", label: "Full AVL" },
        ].map(({ key, label }) => (
          <Button
            key={key}
            size="small"
            variant="contained"
            onClick={() => handleLoadExample(key)}
            sx={{
              backgroundColor: "#0D47A1",
              color: "white",
              fontSize: "11px",
              textTransform: "none",
              fontFamily: "inherit",
              px: 1.5,
              py: 0.75,
              minWidth: 0,
              "&:hover": { backgroundColor: "#1565C0" },
            }}
          >
            {label}
          </Button>
        ))}
      </Stack>

      {/* Transmission Modes */}
      <Divider sx={{ borderColor: "#3C3C3C", mt: 2, mb: 1.5 }} />
      <Typography
        sx={{
          fontSize: "11px",
          color: "#9E9E9E",
          mb: 1,
          textTransform: "uppercase",
          fontFamily: "inherit",
          letterSpacing: "0.08em",
        }}
      >
        Transmission Modes
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Button
          size="small"
          variant="contained"
          disabled={!hexInput.trim()}
          onClick={() => onChunkedSubmit(hexInput.replace(/\s/g, ""), 8)}
          sx={{
            backgroundColor: "#7B1FA2",
            color: "white",
            fontSize: "11px",
            textTransform: "none",
            fontFamily: "inherit",
            px: 1.5,
            py: 0.75,
            minWidth: 0,
            "&:hover": { backgroundColor: "#9C27B0" },
            "&.Mui-disabled": { backgroundColor: "#3C3C3C", color: "#666" },
          }}
        >
          Chunked (8B)
        </Button>
        <Button
          size="small"
          variant="contained"
          disabled={!hexInput.trim()}
          onClick={() => onFragmentedSubmit(hexInput.replace(/\s/g, ""), 4, 16)}
          sx={{
            backgroundColor: "#7B1FA2",
            color: "white",
            fontSize: "11px",
            textTransform: "none",
            fontFamily: "inherit",
            px: 1.5,
            py: 0.75,
            minWidth: 0,
            "&:hover": { backgroundColor: "#9C27B0" },
            "&.Mui-disabled": { backgroundColor: "#3C3C3C", color: "#666" },
          }}
        >
          Fragmented
        </Button>
      </Stack>
    </Box>
  );
}

export default HexInputPanel;
