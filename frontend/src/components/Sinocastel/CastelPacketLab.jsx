import React, { useState } from "react";

/* ---------------- CRC16 X25 ---------------- */

function crc16X25(buffer) {
  let crc = 0xffff;

  for (let i = 0; i < buffer.length; i++) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = (crc >> 1) ^ 0x8408;
      } else {
        crc >>= 1;
      }
    }
  }

  crc = ~crc & 0xffff;
  return crc & 0xffff;
}

/* ---------------- Helpers ---------------- */

const padDeviceId = (id) => {
  const encoder = new TextEncoder();
  const arr = new Uint8Array(20);
  arr.set(encoder.encode(id));
  return arr;
};

const hexToBytes = (hex) =>
  new Uint8Array(hex.match(/.{1,2}/g)?.map((b) => parseInt(b, 16)) || []);

const bytesToHex = (bytes) =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();

const byteToBinary = (b) => b.toString(2).padStart(8, "0");

/* ================= COMPONENT ================= */

export default function CastelPacketLab() {
  /* ---------------- Encoder State ---------------- */

  const [version, setVersion] = useState(4);
  const [deviceId, setDeviceId] = useState("218L1EB2023000511");
  const [type, setType] = useState("0x1001");
  const [dtcCodes, setDtcCodes] = useState("P0133,P0420");
  const [generatedHex, setGeneratedHex] = useState("");

  /* ---------------- Decoder State ---------------- */

  const [inputHex, setInputHex] = useState("");
  const [decoded, setDecoded] = useState(null);
  const [binaryView, setBinaryView] = useState([]);

  /* ================= ENCODER ================= */

  const generatePacket = () => {
    const msgType = parseInt(type);

    /* Example: Build simple DTC packet (0x4006) */

    const dtcArray = dtcCodes.split(",").map((c) => c.trim());

    const content = [];

    // Fake stat block (minimal)
    for (let i = 0; i < 24; i++) content.push(0);

    // flag
    content.push(0x01);

    // count
    content.push(dtcArray.length);

    dtcArray.forEach(() => {
      content.push(0x33, 0x01); // dummy DTC raw bytes
    });

    const contentBytes = new Uint8Array(content);

    const length = 2 + 2 + 1 + 20 + 2 + contentBytes.length + 2 + 2;

    const buffer = new Uint8Array(length);
    let offset = 0;

    // @@
    buffer[offset++] = 0x40;
    buffer[offset++] = 0x40;

    // length LE
    buffer[offset++] = length & 0xff;
    buffer[offset++] = (length >> 8) & 0xff;

    // version
    buffer[offset++] = version;

    // device id
    const idBytes = padDeviceId(deviceId);
    buffer.set(idBytes, offset);
    offset += 20;

    // type (BE)
    buffer[offset++] = (msgType >> 8) & 0xff;
    buffer[offset++] = msgType & 0xff;

    // content
    buffer.set(contentBytes, offset);
    offset += contentBytes.length;

    // CRC
    const crc = crc16X25(buffer.slice(0, offset));
    buffer[offset++] = crc & 0xff;
    buffer[offset++] = (crc >> 8) & 0xff;

    // CRLF
    buffer[offset++] = 0x0d;
    buffer[offset++] = 0x0a;

    setGeneratedHex(bytesToHex(buffer));
  };

  /* ================= DECODER ================= */

  const decodePacket = () => {
    const cleanHex = inputHex.replace(/\s/g, "");
    const bytes = hexToBytes(cleanHex);

    if (bytes.length < 10) return;

    const header = (bytes[0] << 8) | bytes[1];
    const length = bytes[2] | (bytes[3] << 8);
    const version = bytes[4];

    const idBytes = bytes.slice(5, 25);
    const decoder = new TextDecoder();
    const deviceId = decoder.decode(idBytes).replace(/\0/g, "");

    const type = (bytes[25] << 8) | bytes[26];

    const crcReceived = bytes[length - 4] | (bytes[length - 3] << 8);

    const crcCalculated = crc16X25(bytes.slice(0, length - 4));

    setDecoded({
      header: "0x" + header.toString(16),
      length,
      version,
      deviceId,
      type: "0x" + type.toString(16),
      crcReceived: "0x" + crcReceived.toString(16),
      crcCalculated: "0x" + crcCalculated.toString(16),
      crcValid: crcReceived === crcCalculated,
    });

    setBinaryView(
      Array.from(bytes).map((b, i) => ({
        index: i,
        hex: b.toString(16).padStart(2, "0"),
        binary: byteToBinary(b),
      })),
    );
  };

  /* ================= UI ================= */

  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <h2>Castel Packet Lab</h2>

      <hr />
      <h3>Encoder</h3>

      <div>
        Version:
        <input
          value={version}
          onChange={(e) => setVersion(Number(e.target.value))}
        />
      </div>

      <div>
        Device ID:
        <input value={deviceId} onChange={(e) => setDeviceId(e.target.value)} />
      </div>

      <div>
        Type:
        <input value={type} onChange={(e) => setType(e.target.value)} />
      </div>

      <div>
        DTC Codes (comma separated):
        <input value={dtcCodes} onChange={(e) => setDtcCodes(e.target.value)} />
      </div>

      <button onClick={generatePacket}>Generate Packet</button>

      <textarea
        rows={4}
        style={{ width: "100%", marginTop: 10 }}
        value={generatedHex}
        readOnly
      />

      <hr />
      <h3>Decoder</h3>

      <textarea
        rows={4}
        style={{ width: "100%" }}
        placeholder="Paste HEX packet here"
        value={inputHex}
        onChange={(e) => setInputHex(e.target.value)}
      />

      <button onClick={decodePacket}>Decode</button>

      {decoded && (
        <pre style={{ background: "#111", color: "#0f0", padding: 10 }}>
          {JSON.stringify(decoded, null, 2)}
        </pre>
      )}

      <h3>Binary View</h3>
      <div style={{ maxHeight: 300, overflow: "auto" }}>
        {binaryView.map((b) => (
          <div key={b.index}>
            {b.index.toString().padStart(4, "0")} | {b.hex} | {b.binary}
          </div>
        ))}
      </div>
    </div>
  );
}
