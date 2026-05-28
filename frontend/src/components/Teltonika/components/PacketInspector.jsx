import React, { useState, useMemo } from "react";
import { parseHexStringToSections } from "../utils/hexUtils.js";
import { Box, Divider, Stack, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

function PacketInspector({ hexString }) {
  const [selectedSection, setSelectedSection] = useState(null);

  const sections = useMemo(() => {
    if (!hexString) return [];
    return parseHexStringToSections(hexString);
  }, [hexString]);

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
        sx={{
          fontSize: "15px",
          fontWeight: "bold",
          color: "#4FC3F7",
          mb: 1.5,
          pb: 1.25,
          borderBottom: "1px solid #3C3C3C",
          fontFamily: "inherit",
        }}
      >
        Packet Inspector
      </Typography>

      {sections.length === 0 ? (
        <Typography
          sx={{
            color: "#757575",
            fontStyle: "italic",
            py: 3.75,
            px: 2.5,
            textAlign: "center",
            fontFamily: "inherit",
            fontSize: "13px",
          }}
        >
          No packet to inspect. Send data first.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {sections.map((section, idx) => {
            const isOpen = selectedSection === idx;
            return (
              <Box
                key={idx}
                onClick={() => setSelectedSection(isOpen ? null : idx)}
                sx={{
                  borderRadius: "6px",
                  px: 1.5,
                  py: 1.25,
                  border: "1px solid #3C3C3C",
                  borderLeft: `3px solid ${isOpen ? "#4FC3F7" : "#9C27B0"}`,
                  backgroundColor: isOpen ? "#1A237E" : "#1E1E1E",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  "&:hover": {
                    backgroundColor: isOpen ? "#1A237E" : "#252560",
                  },
                }}
              >
                {/* Section header */}
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      color: "#CE93D8",
                      fontSize: "13px",
                      fontFamily: "inherit",
                    }}
                  >
                    {section.name}
                  </Typography>
                  {isOpen ? (
                    <ExpandMoreIcon
                      sx={{ color: "#9E9E9E", fontSize: "16px" }}
                    />
                  ) : (
                    <ChevronRightIcon
                      sx={{ color: "#9E9E9E", fontSize: "16px" }}
                    />
                  )}
                </Stack>

                {/* Expanded details */}
                {isOpen && (
                  <Box
                    sx={{ mt: 1.25, pt: 1.25, borderTop: "1px solid #3C3C3C" }}
                  >
                    <Stack spacing={0.625}>
                      <DetailRow label="Offset" value={section.offset} mono />
                      <DetailRow
                        label="Length"
                        value={`${section.length} bytes`}
                      />
                      <DetailRow label="Raw Hex" value={section.hex} mono />
                      <DetailRow
                        label="Value"
                        value={
                          typeof section.value === "number"
                            ? section.value.toString()
                            : section.value
                        }
                      />
                      <DetailRow
                        label="Description"
                        value={section.description}
                      />
                    </Stack>
                  </Box>
                )}
              </Box>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}

function DetailRow({ label, value, mono }) {
  return (
    <Stack direction="row" spacing={1} sx={{ fontSize: "11px" }}>
      <Typography
        component="span"
        sx={{
          color: "#9E9E9E",
          minWidth: "80px",
          fontSize: "11px",
          fontFamily: "inherit",
          flexShrink: 0,
        }}
      >
        {label}
      </Typography>
      <Typography
        component="span"
        sx={{
          color: "#E0E0E0",
          fontSize: "11px",
          wordBreak: "break-all",
          fontFamily: mono ? "'Roboto Mono', monospace" : "inherit",
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

export default PacketInspector;
