import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
} from "@mui/material";

import { BHARAT_101_FIELDS } from "../utilities/bharat101Schema";
import { encodeBharat101 } from "../utilities/bharat101Encoder";

export default function Bharat101Builder() {
  const [values, setValues] = useState([]);

  // Initialize values
  useEffect(() => {
    setValues(BHARAT_101_FIELDS.map((f) => f.default));
  }, []);

  const updateValue = (index, value) => {
    setValues((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const copyPacket = async () => {
    await navigator.clipboard.writeText(encodeBharat101(values));
    alert("Packet copied to clipboard");
  };

  return (
    <Box sx={{ minHeight: "100vh" }}>
      <Container maxWidth="xl">
        <Paper>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Bharat-101 Full Packet Builder (All Fields)
          </Typography>

          <Grid container spacing={2}>
            {BHARAT_101_FIELDS.map((field) => (
              <Grid item xs={12} sm={6} md={4} key={field.key}>
                <TextField
                  fullWidth
                  size="small"
                  label={`${field.index} · ${field.label}`}
                  value={values[field.index] ?? ""}
                  onChange={(e) => updateValue(field.index, e.target.value)}
                  inputProps={{ style: { fontFamily: "monospace" } }}
                />
              </Grid>
            ))}
          </Grid>

          <TextField
            fullWidth
            multiline
            rows={4}
            sx={{ mt: 3 }}
            label="Generated Raw Packet"
            value={encodeBharat101(values)}
            inputProps={{ style: { fontFamily: "monospace" } }}
          />

          <Button variant="contained" sx={{ mt: 2 }} onClick={copyPacket}>
            Copy Packet
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}
