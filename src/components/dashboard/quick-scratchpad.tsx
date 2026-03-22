"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { TextField, Box, Typography, alpha, useTheme, Tooltip } from "@mui/material";
import { ProjectRecord } from "@/lib/workspace";
import { Check } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface QuickScratchpadProps {
  project: ProjectRecord;
}

const SCRATCHPAD_STORAGE_KEY_PREFIX = "aevon.scratchpad.";

export function QuickScratchpad({ project }: QuickScratchpadProps) {
  const { t } = useTranslation();
  
  // Load initial value from localStorage ONLY
  const [value, setValue] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(`${SCRATCHPAD_STORAGE_KEY_PREFIX}${project.id}`);
      if (stored !== null) return stored;
    }
    return "";
  });
  
  const [status, setStatus] = useState<"idle" | "saved">("idle");
  const theme = useTheme();

  // Handle project switching
  useEffect(() => {
    const stored = window.localStorage.getItem(`${SCRATCHPAD_STORAGE_KEY_PREFIX}${project.id}`);
    setValue(stored !== null ? stored : "");
    setStatus("idle");
  }, [project.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    
    // Save to localStorage immediately
    if (typeof window !== "undefined") {
      window.localStorage.setItem(`${SCRATCHPAD_STORAGE_KEY_PREFIX}${project.id}`, newValue);
    }
    
    setStatus("saved");
    
    // Reset to idle after a brief moment
    setTimeout(() => {
      setStatus("idle");
    }, 2000);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid", borderColor: "divider", px: 3, py: 2.5 }}>
        <Typography variant="overline" fontWeight={700} color="text.secondary" sx={{ letterSpacing: 2 }}>
          {t("dash.scratchpad.title")}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {status === "saved" && (
            <Tooltip title={t("dash.scratchpad.saved")}>
              <Check size={16} className="text-green-500" />
            </Tooltip>
          )}
          
          {/* Status Dot */}
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: status === "saved" ? "success.main" : "success.main",
              boxShadow: `0 0 0 4px ${alpha(
                theme.palette.success.main,
                0.2
              )}`,
              transition: "all 0.3s ease",
              opacity: status === "saved" ? 1 : 0.5
            }}
          />
        </Box>
      </Box>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <TextField
          value={value}
          onChange={handleChange}
          placeholder={t("dash.scratchpad.placeholder")}
          multiline
          minRows={6}
          variant="standard"
          fullWidth
          InputProps={{
            disableUnderline: true,
            sx: {
              color: "text.secondary",
              height: "100%",
              alignItems: "start",
              overflow: "auto"
            }
          }}
        />
      </Box>
    </Box>
  );
}
