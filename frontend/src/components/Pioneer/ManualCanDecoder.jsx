import React, { useState, useMemo } from "react";
import {
  TextField,
  Typography,
  Grid,
  Box,
  Button,
  InputAdornment,
  Paper,
  Divider,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

/* =====================
   Utilities
===================== */

const cleanHex = (h) => (h || "").replace(/\s/g, "").toUpperCase();

const hexToInt = (hex) => parseInt(hex, 16) || 0;

const intToHex = (val, bytes) => {
  let num = Number(val);
  if (isNaN(num)) num = 0;
  return Math.max(0, Math.min(Math.pow(2, bytes * 8) - 1, Math.floor(num)))
    .toString(16)
    .padStart(bytes * 2, "0")
    .toUpperCase();
};

const hexToDateBCD = (hex) => {
  if (hex.length !== 12) return "";
  const yy = hex.substring(0, 2);
  const mm = hex.substring(2, 4);
  const dd = hex.substring(4, 6);
  const h = hex.substring(6, 8);
  const m = hex.substring(8, 10);
  const s = hex.substring(10, 12);
  return `20${yy}-${mm}-${dd}T${h}:${m}:${s}`;
};

const dateToHexBCD = (isoString) => {
  if (!isoString) return "000000000000";
  const d = new Date(isoString);
  const pad = (n) => n.toString().padStart(2, "0");
  return (
    pad(d.getFullYear() % 100) +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
};

/* =====================
   Schema Definition (Bytes 1-22)
===================== */
const HEADER_SCHEMA = [
  { label: "Header", start: 1, end: 2, type: "hex", readOnly: true },
  { label: "Msg Type (0x44)", start: 3, end: 3, type: "hex", readOnly: true },
  { label: "Packet Length", start: 4, end: 5, type: "int", readOnly: true }, // Auto-calc
  { label: "Serial", start: 6, end: 7, type: "int" },
  { label: "IMEI (15 digit)", start: 8, end: 15, type: "imei", readOnly: true },
  { label: "Date/Time", start: 16, end: 21, type: "date" },
  { label: "Num Data Items", start: 22, end: 22, type: "int", readOnly: true }, // Derived from payload array
];

// Payload starts at Byte 23
const PAYLOAD_START = 23;

export default function ManualCanDecoder() {
  // Initial Sample: 2 CAN records
  // Rec 1: ID=1E0108FF (4 bytes), Len=08 (1 byte), Data=FFFFFFFFFFFFFFFF (8 bytes) -> Total 13 bytes
  // Rec 2: ID=0208FFFF (4 bytes), Len=08 (1 byte), Data=FFFFFFFFFFFFBBFF (8 bytes) -> Total 13 bytes
  // Header to Byte 22 is fixed. Byte 22 = 0x02 (2 records).
  const [rawInput, setRawInput] = useState(
    "252544002E00010123456789101112260101100505021E0108FF08FFFFFFFFFFFFFFFF0208FFFF08FFFFFFFFFFFFBBFF"
  );
  const [newImei, setNewImei] = useState("");

  const clean = cleanHex(rawInput);

  // Helper: Slice hex string
  const getHexSegment = (start, end) => {
    if (clean.length < end * 2) return "00".repeat(end - start + 1);
    return clean.substring((start - 1) * 2, end * 2);
  };

  // Helper: Update main hex string
  const updateHexSegment = (start, end, newSegment) => {
    const startIndex = (start - 1) * 2;
    const endIndex = end * 2;
    const before = clean.substring(0, startIndex);
    const after = clean.substring(endIndex);
    setRawInput(before + newSegment + after);
  };

  // --- Dynamic Parsing of CAN Records ---
  const parsedRecords = useMemo(() => {
    const records = [];
    let cursor = PAYLOAD_START; // Start at Byte 23

    // Parse until end of string
    // Each Record: 4 Bytes ID + 1 Byte Len + N Bytes Data
    while (cursor * 2 < clean.length) {
      // Need at least 5 bytes (ID + Len)
      if (clean.length < (cursor + 5) * 2) break;

      const idHex = clean.substring((cursor - 1) * 2, (cursor + 3) * 2);
      const lenByteHex = clean.substring((cursor + 3) * 2, (cursor + 4) * 2);
      const dataLen = parseInt(lenByteHex, 16);

      const dataHex = clean.substring(
        (cursor + 4) * 2,
        (cursor + 4 + dataLen) * 2
      );

      records.push({
        startByte: cursor,
        totalBytes: 5 + dataLen,
        id: idHex,
        len: dataLen,
        data: dataHex,
      });

      cursor += 5 + dataLen;
    }
    return records;
  }, [rawInput]);

  // Sync "Packet Length" and "Num Items" fields automatically
  // This effect runs on render essentially, but we force update if they mismatch
  const syncHeaders = () => {
    const currentLenHex = getHexSegment(4, 5);
    const currentNumHex = getHexSegment(22, 22);

    const actualLen = clean.length / 2 - 2; // Packet Length excludes Header(2) but includes itself(2) ??
    // Usually Packet Length = Total Length - 2 (Header) - 2 (MsgType+Len??)
    // Doc usually says Length = Length of bytes *after* the length field?
    // Or Length of whole packet excluding header?
    // Let's rely on standard practice: Packet Length usually includes MsgType to End, or Serial to End.
    // Based on previous decoders: Total Length in bytes from Msg Type to End.
    // Header (2) + Type (1) + Len (2) + Serial (2) + IMEI (8) + Time (6) + Num (1) + Payload...
    // Let's assume Length field = Total Bytes - 2 (Header bytes).

    // Calculated based on sample:
    // Sample "2525 44 0029 ..." -> 0x29 = 41 bytes.
    // Total string len = 86 chars = 43 bytes.
    // 43 - 2 (Header) = 41. Correct. So Packet Len = Total Bytes - 2.

    const correctLen = clean.length / 2 - 2;
    const correctNum = parsedRecords.length;

    if (
      parseInt(currentLenHex, 16) !== correctLen ||
      parseInt(currentNumHex, 16) !== correctNum
    ) {
      // Reconstruct Header with correct counts
      const beforeLen = clean.substring(0, 6); // 252544
      const afterLenBeforeNum = clean.substring(10, 42); // Serial..Time
      const payload = clean.substring(44); // After Num

      const newLenHex = intToHex(correctLen, 2);
      const newNumHex = intToHex(correctNum, 1);

      setRawInput(
        beforeLen + newLenHex + afterLenBeforeNum + newNumHex + payload
      );
    }
  };

  // Modify Record
  const updateRecord = (index, field, value) => {
    const rec = parsedRecords[index];
    let newSegment = "";
    let start = 0;
    let end = 0;

    if (field === "id") {
      start = rec.startByte;
      end = rec.startByte + 3; // 4 bytes
      newSegment = value
        .replace(/[^0-9A-Fa-f]/g, "")
        .padEnd(8, "0")
        .substring(0, 8)
        .toUpperCase();
    } else if (field === "data") {
      start = rec.startByte + 5; // Skip ID(4)+Len(1)
      end = rec.startByte + 4 + rec.len;
      // We allow changing data content, but keeping length same for simplicity
      // If user wants to change length, they likely need to re-enter record.
      // Here we just pad/truncate to existing length
      newSegment = value
        .replace(/[^0-9A-Fa-f]/g, "")
        .padEnd(rec.len * 2, "0")
        .substring(0, rec.len * 2)
        .toUpperCase();
    }

    updateHexSegment(start, end, newSegment);
  };

  // Add Default Record (J1939-like default)
  const addRecord = () => {
    // Default: ID 00000000, Len 8, Data 00..
    const newRecHex = "00000000" + "08" + "0000000000000000";
    setRawInput(cleanHex(rawInput) + newRecHex);
    // syncHeaders will handle length update on next cycle/check
  };

  // Delete Record
  const deleteRecord = (index) => {
    const rec = parsedRecords[index];
    const startIdx = (rec.startByte - 1) * 2;
    const endIdx = (rec.startByte + rec.totalBytes - 1) * 2 + 2;
    const before = clean.substring(0, startIdx);
    const after = clean.substring(endIdx);
    setRawInput(before + after);
  };

  const handleGenericChange = (item, value) => {
    // Only for Header fields
    const byteLength = item.end - item.start + 1;
    let newHex = "";
    if (item.type === "int") newHex = intToHex(value, byteLength);
    else if (item.type === "date") newHex = dateToHexBCD(value);
    else if (item.type === "imei") {
      const imeiStr = value
        .toString()
        .replace(/\D/g, "")
        .padEnd(15, "0")
        .substring(0, 15);
      newHex =
        "0" +
        imeiStr
          .split("")
          .map((d) => parseInt(d, 10).toString(16))
          .join("")
          .toUpperCase();
    }
    updateHexSegment(item.start, item.end, newHex);
  };

  const handleModifyImei = () => {
    if (newImei.replace(/\D/g, "").length === 15)
      handleGenericChange({ type: "imei", start: 8, end: 15 }, newImei);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, color: "text.primary" }}>
        Manual CAN Decoder (0x44)
      </Typography>

      <TextField
        label="Raw Hex String"
        fullWidth
        multiline
        minRows={3}
        value={rawInput}
        onChange={(e) =>
          setRawInput(e.target.value.replace(/[^0-9a-fA-F]/g, ""))
        }
        onBlur={syncHeaders} // Recalculate lengths on blur
        sx={{ mb: 2 }}
        InputProps={{ style: { fontFamily: "monospace" } }}
      />
      <Box sx={{ mb: 4, display: "flex", gap: 2 }}>
        <Button
          variant="outlined"
          onClick={() => navigator.clipboard.writeText(cleanHex(rawInput))}
        >
          Copy Hex
        </Button>
        <Button variant="contained" color="warning" onClick={syncHeaders}>
          Recalculate Headers
        </Button>
      </Box>

      {/* IMEI Modifier */}
      <Box
        sx={{
          mb: 4,
          p: 2,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
        }}
      >
        <Typography variant="subtitle2">Modify IMEI</Typography>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} sm={8}>
            <TextField
              label="New 15-digit IMEI"
              fullWidth
              size="small"
              value={newImei}
              onChange={(e) => setNewImei(e.target.value.replace(/\D/g, ""))}
              inputProps={{ maxLength: 15 }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant="contained"
              fullWidth
              disabled={newImei.length !== 15}
              onClick={handleModifyImei}
            >
              Apply
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* FIXED HEADER */}
      <Typography
        variant="subtitle1"
        sx={{ fontWeight: "bold", mb: 1, color: "primary.main" }}
      >
        Header Fields (Bytes 1-22)
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {HEADER_SCHEMA.map((f, i) => {
          const hex = getHexSegment(f.start, f.end);
          let val = hex;
          if (f.type === "int") val = hexToInt(hex);
          if (f.type === "date") val = hexToDateBCD(hex);
          if (f.type === "imei") val = hex.substring(1);

          return (
            <Grid item xs={6} sm={4} md={2} key={i}>
              <TextField
                label={f.label}
                fullWidth
                size="small"
                value={val}
                disabled={f.readOnly}
                type={f.type === "date" ? "datetime-local" : "text"}
                onChange={(e) => handleGenericChange(f, e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          );
        })}
      </Grid>

      <Divider sx={{ mb: 3 }} />

      {/* DYNAMIC CAN RECORDS */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: "bold", color: "secondary.main" }}
        >
          CAN Records ({parsedRecords.length})
        </Typography>
        <Button
          startIcon={<AddIcon />}
          variant="contained"
          size="small"
          onClick={addRecord}
        >
          Add Record
        </Button>
      </Box>

      {parsedRecords.map((rec, i) => (
        <Paper
          key={i}
          variant="outlined"
          sx={{ p: 2, mb: 2, position: "relative" }}
        >
          <IconButton
            size="small"
            onClick={() => deleteRecord(i)}
            sx={{ position: "absolute", top: 5, right: 5, color: "error.main" }}
          >
            <DeleteIcon />
          </IconButton>

          <Typography
            variant="caption"
            sx={{ fontWeight: "bold", display: "block", mb: 1 }}
          >
            Record #{i + 1} (Bytes {rec.startByte}-
            {rec.startByte + rec.totalBytes - 1})
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                label="CAN ID (4 Bytes)"
                fullWidth
                size="small"
                value={rec.id}
                onChange={(e) => updateRecord(i, "id", e.target.value)}
                helperText={`Hex: 0x${rec.id}`}
              />
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField
                label="Len"
                fullWidth
                size="small"
                value={rec.len}
                disabled
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label={`Data Payload (${rec.len} Bytes)`}
                fullWidth
                size="small"
                value={rec.data}
                onChange={(e) => updateRecord(i, "data", e.target.value)}
                inputProps={{ style: { fontFamily: "monospace" } }}
              />
            </Grid>
          </Grid>
        </Paper>
      ))}
    </Box>
  );
}
