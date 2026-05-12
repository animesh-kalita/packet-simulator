import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  Stack,
  Tooltip,
  IconButton,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import WifiIcon from "@mui/icons-material/Wifi";
import BuildIcon from "@mui/icons-material/Build";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import SpeedIcon from "@mui/icons-material/Speed";
import ThermostatIcon from "@mui/icons-material/Thermostat";
import BatteryChargingFullIcon from "@mui/icons-material/BatteryChargingFull";

// ─── Helpers ────────────────────────────────────────────────────────────────

const PACKET_TYPE_MAP = {
  4001: { label: "GPS", color: "success" },
  4002: { label: "OBD", color: "primary" },
  4006: { label: "DTC", color: "error" },
  "400B": { label: "DTC", color: "error" },
  4007: { label: "Alarm", color: "warning" },
  1001: { label: "Login", color: "default" },
};

function detectPacketType(data) {
  if (!data) return null;
  const type = data.messageType || data.packet_type;
  if (type) {
    const key = Object.keys(PACKET_TYPE_MAP).find(
      (k) => PACKET_TYPE_MAP[k].label.toLowerCase() === type.toLowerCase(),
    );
    if (key) return { code: key, ...PACKET_TYPE_MAP[key] };
  }
  // infer from presence of fields
  if (data.dtc_codes || data.com_all_dtcs_str)
    return { code: "4006", ...PACKET_TYPE_MAP["4006"] };
  if (data.rpm !== undefined || data.engineLoad !== undefined)
    return { code: "4002", ...PACKET_TYPE_MAP["4002"] };
  return { code: "4001", ...PACKET_TYPE_MAP["4001"] };
}

function val(v, unit = "", decimals = 2) {
  if (v === null || v === undefined || v === 0) return "—";
  const num = typeof v === "number" ? v.toFixed(decimals) : v;
  return unit ? `${num} ${unit}` : `${num}`;
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <Tooltip title={copied ? "Copied!" : "Copy"}>
      <IconButton size="small" onClick={handleCopy} sx={{ ml: 0.5 }}>
        <ContentCopyIcon fontSize="inherit" />
      </IconButton>
    </Tooltip>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ icon, title }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
      {icon}
      <Typography variant="subtitle1" fontWeight={700}>
        {title}
      </Typography>
    </Stack>
  );
}

function KVRow({ label, value }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.4 }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 180 }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500} textAlign="right">
        {value ?? "—"}
      </Typography>
    </Box>
  );
}

function IdentityCard({ data, packetType }) {
  const imei = data.uniqueId || data.serialNo || "—";
  const serial = data.serialNo || "—";
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <Box>
            <SectionHeader
              icon={<WifiIcon color="primary" />}
              title="Device Identity"
            />
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography variant="h6" fontWeight={700} fontFamily="monospace">
                {imei}
              </Typography>
              <CopyButton text={imei} />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Serial: {serial}
            </Typography>
          </Box>
          <Stack spacing={0.5} alignItems="flex-end">
            <Chip
              label={packetType.label}
              color={packetType.color}
              size="small"
              sx={{ fontWeight: 700, fontSize: 13 }}
            />
            <Typography variant="caption" color="text.secondary">
              {data.date} {data.time}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ts: {data.timestamp}
            </Typography>
          </Stack>
        </Stack>

        <Divider sx={{ my: 1.5 }} />

        <Grid container spacing={1}>
          <Grid item xs={6} sm={3}>
            <KVRow
              label="GPS Status"
              value={data.gpsStatus === "A" ? "✅ Active" : "❌ Void"}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <KVRow label="Satellites" value={data.satellites} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <KVRow label="GPS Signal" value={data.gpsSignal} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <KVRow
              label="Ignition"
              value={data.ignition_status ? "ON" : "OFF"}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <KVRow label="Latitude" value={data.latitude} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <KVRow label="Longitude" value={data.longitude} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <KVRow label="Speed" value={val(data.speed, "km/h", 0)} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <KVRow label="Ext. Battery" value={val(data.extBatVol, "V")} />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

function OBDCard({ data }) {
  const pidRows = [
    {
      label: "RPM",
      value: val(data.rpm, "rpm", 0),
      icon: <SpeedIcon fontSize="small" />,
    },
    {
      label: "Vehicle Speed",
      value: val(data.vehicleSpeed, "km/h", 0),
      icon: <SpeedIcon fontSize="small" />,
    },
    { label: "Engine Load", value: val(data.engineLoad, "%", 1), icon: null },
    {
      label: "Coolant Temp",
      value: val(data.coolant_temperature, "°C", 0),
      icon: <ThermostatIcon fontSize="small" />,
    },
    {
      label: "Intake Air Temp",
      value: val(data.intakeAirTemp, "°C", 0),
      icon: <ThermostatIcon fontSize="small" />,
    },
    {
      label: "Engine Oil Temp",
      value: val(data.engineOilTemp, "°C", 1),
      icon: <ThermostatIcon fontSize="small" />,
    },
    {
      label: "Fuel Level",
      value: val(data.fuel_level, "%", 1),
      icon: <LocalGasStationIcon fontSize="small" />,
    },
    {
      label: "Fuel Rate",
      value: val(data.fuel_rate, "L/h", 2),
      icon: <LocalGasStationIcon fontSize="small" />,
    },
    {
      label: "Fuel Consumption (total)",
      value: val(data.fuel_consumption, "L", 2),
      icon: <LocalGasStationIcon fontSize="small" />,
    },
    {
      label: "Current Fuel Consumption",
      value: val(data.current_fuel_consumption, "L", 2),
      icon: <LocalGasStationIcon fontSize="small" />,
    },
    {
      label: "Fuel System Status",
      value: data.fuel_system_status || "—",
      icon: null,
    },
    { label: "Fuel Type", value: data.fuel_type || "—", icon: null },
    {
      label: "Control Module Voltage",
      value: val(data.control_module_voltage, "V"),
      icon: <BatteryChargingFullIcon fontSize="small" />,
    },
    {
      label: "Throttle Position",
      value: val(data.relative_throttle_position, "%", 1),
      icon: null,
    },
    {
      label: "Accelerator Pedal Pos",
      value: val(data.accelerator_pedal_pos, "%", 1),
      icon: null,
    },
    {
      label: "MAF Air Flow",
      value: val(data.air_flow_rate, "g/s"),
      icon: null,
    },
    {
      label: "Intake Manifold Temp",
      value: val(data.intake_manifold_1_temperature, "°C", 0),
      icon: null,
    },
    {
      label: "Barometric Pressure",
      value: val(data.barometric_pressure, "kPa", 0),
      icon: null,
    },
    { label: "OBD Distance", value: val(data.obdDistance, "km"), icon: null },
    {
      label: "Distance Since MIL",
      value: val(data.distance_since_mil, "km", 0),
      icon: null,
    },
    {
      label: "Short Term Fuel Trim",
      value: val(data.short_term_fuel_trim_bank_1, "%", 1),
      icon: null,
    },
    {
      label: "Long Term Fuel Trim",
      value: val(data.long_term_fuel_trim_bank_1, "%", 1),
      icon: null,
    },
    {
      label: "Engine Torque %",
      value: val(data.engine_torque_percent, "%", 0),
      icon: null,
    },
    {
      label: "Driver Demand Torque",
      value: val(data.drivers_demand_engine_torque_percent, "%", 0),
      icon: null,
    },
    {
      label: "Selected Gear",
      value: val(data.selected_gear, "", 0),
      icon: null,
    },
    { label: "Current Gear", value: val(data.current_gear, "", 0), icon: null },
    { label: "AdBlue Level", value: val(data.adblue_level, "%"), icon: null },
    {
      label: "Total Trip Mileage",
      value: val(data.total_trip_mileage, "m", 0),
      icon: null,
    },
    {
      label: "Current Trip Mileage",
      value: val(data.current_trip_mileage, "m", 0),
      icon: null,
    },
    {
      label: "Last ACC On Time",
      value: data.last_accon_time
        ? new Date(data.last_accon_time * 1000).toLocaleString()
        : "—",
      icon: null,
    },
    { label: "OBD Standards", value: data.obdstandards || "—", icon: null },
    { label: "MIL", value: data.mil === 1 ? "🔴 ON" : "🟢 OFF", icon: null },
  ];

  const activePids = pidRows.filter((r) => r.value !== "—");

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <SectionHeader
          icon={<BuildIcon color="primary" />}
          title={`OBD Data — ${activePids.length} active PIDs`}
        />
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{ maxHeight: 420 }}
        >
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Parameter</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Value
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pidRows.map((row) => (
                <TableRow
                  key={row.label}
                  sx={{
                    opacity: row.value === "—" ? 0.35 : 1,
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      {row.icon}
                      <span>{row.label}</span>
                    </Stack>
                  </TableCell>
                  <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                    {row.value}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}

function DTCCard({ data }) {
  const rawDtcs = data.dtc_codes || data.com_all_dtcs_str || "";
  const dtcList = rawDtcs
    ? rawDtcs
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean)
    : [];

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <SectionHeader
          icon={<WarningAmberIcon color="error" />}
          title={`DTC Codes — ${dtcList.length} fault(s)`}
        />
        {dtcList.length === 0 ? (
          <Alert severity="success" sx={{ mt: 1 }}>
            No active DTC codes
          </Alert>
        ) : (
          <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
            {dtcList.map((code) => (
              <Chip
                key={code}
                label={code}
                color="error"
                variant="outlined"
                icon={<WarningAmberIcon />}
                sx={{ fontFamily: "monospace", fontWeight: 600 }}
              />
            ))}
          </Stack>
        )}

        {data.can_raw_data && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Raw CAN Data
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                p: 1,
                mt: 0.5,
                fontFamily: "monospace",
                fontSize: 11,
                wordBreak: "break-all",
                bgcolor: "grey.50",
                maxHeight: 80,
                overflow: "auto",
              }}
            >
              {data.can_raw_data}
            </Paper>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function RawPacketCard({ data }) {
  const raw = data.rawString || "";
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 1 }}
        >
          <Typography variant="subtitle1" fontWeight={700}>
            Raw Packet
          </Typography>
          <CopyButton text={raw} />
        </Stack>
        <Paper
          variant="outlined"
          sx={{
            p: 1.5,
            fontFamily: "monospace",
            fontSize: 11,
            wordBreak: "break-all",
            bgcolor: "grey.50",
            maxHeight: 100,
            overflow: "auto",
          }}
        >
          {raw || "—"}
        </Paper>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SinocastelPacketViewer() {
  const [rawJson, setRawJson] = useState("");
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState("");

  const handleParse = (text) => {
    setRawJson(text);
    if (!text.trim()) {
      setParsed(null);
      setError("");
      return;
    }
    try {
      const obj = JSON.parse(text);
      setParsed(obj);
      setError("");
    } catch (e) {
      setError("Invalid JSON — " + e.message);
      setParsed(null);
    }
  };

  const packetType = parsed ? detectPacketType(parsed) : null;
  const isObd = packetType?.label === "OBD";
  const isDtc = packetType?.label === "DTC";

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", p: 3 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Sinocastel Packet Viewer
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Paste the parsed JSON from the Kafka topic to visualize the packet.
      </Typography>

      <TextField
        label="Paste packet JSON here"
        multiline
        minRows={4}
        maxRows={10}
        fullWidth
        value={rawJson}
        onChange={(e) => handleParse(e.target.value)}
        error={!!error}
        helperText={error}
        sx={{ mb: 3, fontFamily: "monospace" }}
        inputProps={{ style: { fontFamily: "monospace", fontSize: 12 } }}
      />

      {parsed && (
        <Box>
          {/* Identity + GPS */}
          <IdentityCard data={parsed} packetType={packetType} />

          {/* OBD PIDs */}
          {isObd && <OBDCard data={parsed} />}

          {/* DTC codes — show on DTC packets, or on OBD if dtc_codes present */}
          {(isDtc || parsed.dtc_codes || parsed.com_all_dtcs_str) && (
            <DTCCard data={parsed} />
          )}

          {/* Raw packet */}
          <RawPacketCard data={parsed} />
        </Box>
      )}

      {!parsed && !error && (
        <Alert severity="info">
          Paste a JSON packet above — supports OBD (<code>4002</code>), DTC (
          <code>4006</code> / <code>400B</code>), GPS (<code>4001</code>), and
          Alarm (<code>4007</code>) packets.
        </Alert>
      )}
    </Box>
  );
}
