import React, { useState } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Grid,
} from "@mui/material";

export default function APMDecoder() {
  const [rawInput, setRawInput] = useState(
    "$,10,APMK,1.1,V4.0.1,NR,21,L,862942074967324,XY45DX3423,1,23122025,221130,13.058557,N,77.440029,E,0.0,224.90,20,778.9,1.6,0.7,AIRTEL,0,1,23.4,4.1,0,19,0000,00,0.00,0.00,610770,00000000,02:01150D04|FFFFFFFF,02:FFFFFFFF|FFFFFFFF,7E,*"
  );

  const [decoded, setDecoded] = useState(null);
  const [newImei, setNewImei] = useState("");

  // ------------------ Decoder ------------------

  //   const decodeAPM = (packet) => {
  //     const clean = packet.trim();
  //     const parts = clean.split(",");

  //     if (parts.length < 20) {
  //       throw new Error("Invalid / incomplete APM packet");
  //     }

  //     return {
  //       header: parts[0],
  //       protocolId: parts[2],
  //       protocolVersion: parts[3],
  //       firmware: parts[4],
  //       imei: parts[8],
  //       deviceId: parts[9],
  //       date: parts[11], // DDMMYYYY
  //       time: parts[12], // HHMMSS
  //       latitude: `${parts[13]} ${parts[14]}`,
  //       longitude: `${parts[15]} ${parts[16]}`,
  //       speed: parts[17],
  //       heading: parts[18],
  //       satellites: parts[19],
  //       altitude: parts[20],
  //       hdop: parts[21],
  //       network: parts[22],
  //       batteryVoltage: parts[25],
  //       externalVoltage: parts[26],
  //       rawParts: parts,
  //     };
  //   };
  const decodeAPM = (packet) => {
    const clean = packet.trim();
    const parts = clean.split(",");

    if (parts.length < 35) {
      throw new Error("Invalid / incomplete APM packet");
    }

    return {
      protocolId: parts[2],
      protocolVersion: parts[3],
      firmware: parts[4],

      packetType: parts[5],
      alertType: parts[6],
      eventCode: parts[7],

      imei: parts[8],
      vehicleNumber: parts[9],
      gpsFix: parts[10] === "1" ? "A" : "V",

      date: parts[11],
      time: parts[12],

      latitude: `${parts[13]} ${parts[14]}`,
      longitude: `${parts[15]} ${parts[16]}`,

      speed: Number(parts[17]),
      heading: Number(parts[18]),
      satellites: Number(parts[19]),
      altitude: Number(parts[20]),

      network: parts[23],
      ignition: parts[24] === "1",

      extBatteryV: Number(parts[26]),
      intBatteryV: Number(parts[27]),

      gpsSignal: parts[29],

      rawParts: parts,
    };
  };

  // ------------------ Actions ------------------

  const handleDecode = () => {
    try {
      const data = decodeAPM(rawInput);
      setDecoded(data);
    } catch (err) {
      alert(err.message);
    }
  };

  const replaceIMEI = () => {
    if (!/^\d{15}$/.test(newImei)) {
      alert("IMEI must be exactly 15 digits");
      return;
    }

    const parts = rawInput.split(",");

    let replaced = false;

    for (let i = 0; i < parts.length; i++) {
      if (/^\d{15}$/.test(parts[i])) {
        parts[i] = newImei;
        replaced = true;
        break;
      }
    }

    if (!replaced) {
      alert("IMEI field not found in packet");
      return;
    }

    const updated = parts.join(",");
    setRawInput(updated);

    setTimeout(() => {
      setDecoded(decodeAPM(updated));
    }, 50);
  };

  // ------------------ UI ------------------

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#fafafa", py: 3 }}>
      <Container maxWidth="md">
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            APM / RMA ASCII Packet Decoder
          </Typography>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Note - Line Delimiter \r\n(CRLF) to be select for Simulation
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={4}
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            label="Raw Packet"
            size="small"
            inputProps={{ style: { fontFamily: "monospace" } }}
          />

          <Stack direction="row" spacing={2} mt={2}>
            <Button variant="contained" onClick={handleDecode}>
              Decode
            </Button>
          </Stack>

          <Stack direction="row" spacing={2} mt={2}>
            <TextField
              label="Replace IMEI"
              size="small"
              value={newImei}
              onChange={(e) => setNewImei(e.target.value)}
              placeholder="15 digit IMEI"
            />
            <Button variant="outlined" onClick={replaceIMEI}>
              Replace IMEI
            </Button>
          </Stack>
        </Paper>

        {decoded && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Decoded Data
            </Typography>

            <Grid container spacing={1}>
              <Field label="Protocol" value={decoded.protocolId} />
              <Field label="Firmware" value={decoded.firmware} />
              <Field label="IMEI" value={decoded.imei} />
              <Field label="Device ID" value={decoded.deviceId} />
              <Field label="Date" value={decoded.date} />
              <Field label="Time" value={decoded.time} />
              <Field label="Latitude" value={decoded.latitude} />
              <Field label="Longitude" value={decoded.longitude} />
              <Field label="Speed" value={decoded.speed} />
              <Field label="Heading" value={decoded.heading} />
              <Field label="Satellites" value={decoded.satellites} />
              <Field label="Network" value={decoded.network} />
              <Field label="Battery (V)" value={decoded.batteryVoltage} />
              <Field label="External (V)" value={decoded.externalVoltage} />
            </Grid>
          </Paper>
        )}
      </Container>
    </Box>
  );
}

// ------------------ Helper ------------------

function Field({ label, value }) {
  return (
    <Grid item xs={12} sm={6}>
      <Typography variant="body2">
        <strong>{label}:</strong> {value}
      </Typography>
    </Grid>
  );
}
