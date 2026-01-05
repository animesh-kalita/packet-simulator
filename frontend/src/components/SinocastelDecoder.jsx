import React, { useState } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
} from "@mui/material";

function hexToBytes(hex) {
  const clean = hex.replace(/\s+/g, "");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    out[i / 2] = parseInt(clean.substr(i, 2), 16);
  }
  return out;
}

const u16 = (b, i) => b[i] | (b[i + 1] << 8);
const u32 = (b, i) =>
  (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)) >>> 0;

export default function SinocastelDecoder() {
  const [hex, setHex] = useState(
    "40405500043231384C31454232303233303030353132000000100246C6476921834B69388F2A000000000061080000000000020000052C29441700001D01180C19060710C844C902C8AAA01000000000FFB2B50D0A"
  );
  const [data, setData] = useState(null);

  const decode = () => {
    const b = hexToBytes(hex);
    if (b[0] !== 0x40 || b[1] !== 0x40) {
      alert("Invalid Sinocastel frame");
      return;
    }

    const deviceId = String.fromCharCode(...b.slice(5, 25)).replace(/\0/g, "");
    const proto = u16(b, 25);
    const time = new Date(u32(b, 27) * 1000).toISOString();

    const lat = u32(b, 31) / 1e6;
    const lon = u32(b, 35) / 1e6;
    const speed = u16(b, 39);
    const altitude = u16(b, 43);
    const sats = b[51];

    setData({
      deviceId,
      protocol: "0x" + proto.toString(16),
      time,
      lat,
      lon,
      speed,
      altitude,
      satellites: sats,
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Container maxWidth="md">
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6">Sinocastel Decoder (CB212)</Typography>

          <TextField
            fullWidth
            multiline
            rows={4}
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            sx={{ mt: 2 }}
            inputProps={{ style: { fontFamily: "monospace" } }}
          />

          <Button sx={{ mt: 2 }} variant="contained" onClick={decode}>
            Decode
          </Button>

          {data && (
            <Grid container spacing={1} sx={{ mt: 2 }}>
              {Object.entries(data).map(([k, v]) => (
                <Grid item xs={12} sm={6} key={k}>
                  <Typography>
                    <b>{k}</b>: {v}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
