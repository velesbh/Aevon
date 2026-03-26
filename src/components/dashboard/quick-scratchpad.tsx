"use client";

import { useState, useEffect, useRef } from "react";
import { TextField, Box, Typography, alpha, useTheme, Tooltip } from "@mui/material";
import { ProjectRecord } from "@/lib/workspace";
import { Check, Cloud } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useDashboardWorkspace } from "./workspace-provider";

interface QuickScratchpadProps {
  project: ProjectRecord;
}

export function QuickScratchpad({ project }: QuickScratchpadProps) {
  const { t } = useTranslation();
  const { saveActiveProjectRecord } = useDashboardWorkspace();
  const theme = useTheme();
  
  const [value, setValue] = useState(project.scratchpad || "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const lastSavedValue = useRef(project.scratchpad || "");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync when project changes
  useEffect(() => {
    setValue(project.scratchpad || "");
    lastSavedValue.current = project.scratchpad || "";
    setStatus("idle");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
  }, [project.id, project.scratchpad]);

  const saveImmediately = async (val: string) => {
    if (val === lastSavedValue.current) return;
    setStatus("saving");
    try {
      await saveActiveProjectRecord({ scratchpad: val });
      lastSavedValue.current = val;
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      console.error("Failed to save scratchpad:", err);
      setStatus("idle");
    }
  };

  // Save on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        // We can't really await here, but we can fire the save
        if (value !== lastSavedValue.current) {
          saveActiveProjectRecord({ scratchpad: value }).catch(console.error);
        }
      }
    };
  }, [value, saveActiveProjectRecord]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    setStatus("idle");

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(() => {
      saveImmediately(newValue);
    }, 1000);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between", 
        borderBottom: "1px solid", 
        borderColor: "divider", 
        px: 3, 
        py: 2.5,
        backgroundColor: alpha(theme.palette.background.paper, 0.4),
        backdropFilter: "blur(10px)"
      }}>
        <Typography variant="overline" fontWeight={700} color="text.secondary" sx={{ letterSpacing: 2 }}>
          {t("dash.scratchpad.title")}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {status === "saving" ? (
            <Cloud size={16} className="text-[var(--primary)] animate-pulse" />
          ) : status === "saved" ? (
            <Tooltip title={t("dash.scratchpad.saved")}>
              <Check size={16} className="text-green-500" />
            </Tooltip>
          ) : null}
          
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: status === "saving" ? "info.main" : status === "saved" ? "success.main" : "text.disabled",
              boxShadow: status !== "idle" ? `0 0 0 4px ${alpha(
                status === "saving" ? theme.palette.info.main : theme.palette.success.main,
                0.2
              )}` : 'none',
              transition: "all 0.3s ease",
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
              color: "text.primary",
              height: "100%",
              alignItems: "start",
              overflow: "auto",
              fontSize: "0.95rem",
              lineHeight: 1.6,
              fontFamily: 'inherit'
            }
          }}
        />
      </Box>
    </Box>
  );
}
