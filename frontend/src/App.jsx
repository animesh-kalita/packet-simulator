import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Container,
  Alert,
  IconButton,
} from "@mui/material";
import {
  PlayArrow as SimulationIcon,
  Article as LogsIcon,
  Settings as SettingsIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
} from "@mui/icons-material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import SimulationPanel from "./components/SimulationPanel";
import LogsPanel from "./components/LogsPanel";
import SettingsPanel from "./components/SettingsPanel";
import { getSystemInfo } from "./services/api";
import TeltonikaTools from "./components/TeltonikaTools";
import TeltonikaDecoder from "./components/TeltonikaDecoder";

const drawerWidth = 240;

function App() {
  const [activeTab, setActiveTab] = useState("simulation");
  const [systemInfo, setSystemInfo] = useState(null);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(true);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? "dark" : "light",
          primary: {
            main: "#1976d2",
          },
          secondary: {
            main: "#dc004e",
          },
        },
      }),
    [darkMode]
  );

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  useEffect(() => {
    loadSystemInfo();
  }, []);

  const loadSystemInfo = async () => {
    try {
      const info = await getSystemInfo();
      setSystemInfo(info);
    } catch (err) {
      setError("Failed to load system information");
    }
  };

  const menuItems = [
    { id: "simulation", label: "Simulation", icon: <SimulationIcon /> },
    { id: "logs", label: "Logs", icon: <LogsIcon /> },
    { id: "settings", label: "Settings", icon: <SettingsIcon /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "simulation":
        return <SimulationPanel systemInfo={systemInfo} />;
      case "logs":
        return <LogsPanel />;
      case "settings":
        return <SettingsPanel />;
      default:
        return <SimulationPanel systemInfo={systemInfo} />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: "flex" }}>
        <AppBar
          position="fixed"
          sx={{
            width: `calc(100% - ${drawerWidth}px)`,
            ml: `${drawerWidth}px`,
            zIndex: (theme) => theme.zIndex.drawer + 1,
          }}
        >
          <Toolbar>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ flexGrow: 1 }}
            >
              Packet Simulator
            </Typography>
            <IconButton onClick={toggleTheme} color="inherit">
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Toolbar>
        </AppBar>

        <Drawer
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
            },
          }}
          variant="permanent"
          anchor="left"
        >
          <Toolbar />
          <Box sx={{ overflow: "auto" }}>
            <List>
              {menuItems.map((item) => (
                <ListItem key={item.id} disablePadding>
                  <ListItemButton
                    selected={activeTab === item.id}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.label} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>

        <Box
          component="main"
          sx={{ flexGrow: 1, bgcolor: "background.default", p: 3 }}
        >
          <Toolbar />
          <Container maxWidth="xl">
            {error && (
              <Alert
                severity="error"
                sx={{ mb: 2 }}
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            )}
            {renderContent()}
          </Container>
        </Box>
      </Box>
      <TeltonikaTools />
      <TeltonikaDecoder />
    </ThemeProvider>
  );
}

export default App;
