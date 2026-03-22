"use client";

import { useState } from "react";
import {
  Download,
  FileDown,
  FileText,
  Settings2,
  Sparkles,
  Loader2,
  BookOpen,
  CheckCircle2
} from "lucide-react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Tooltip from "@mui/material/Tooltip";
import { AnimatePresence, motion } from "framer-motion";
import { useDashboardWorkspace } from "@/components/dashboard/workspace-provider";
import { requestProjectExport, type ExportFormat, type ManuscriptExportOptions } from "@/lib/workspace";
import { useTranslation } from "@/lib/i18n";

const formats: Array<{ id: ExportFormat; name: string; description: string; icon: any; translationKey?: string }> = [
  { id: "pdf", name: "PDF Document", translationKey: 'exp.format.pdf.name', description: "Best for sharing and printing with preserved formatting.", icon: FileDown },
  { id: "docx", name: "Microsoft Word", translationKey: 'exp.format.docx.name', description: "Standard format for agents, editors, and further editing.", icon: FileText },
  { id: "epub", name: "ePUB eBook", description: "Reflowable format for e-readers and tablets.", icon: BookOpen },
  { id: "md", name: "Markdown", description: "Plain text with minimal formatting tags.", icon: Sparkles },
];

const optionList: Array<{ id: keyof ManuscriptExportOptions; label: string; translationKey?: string; description: string }> = [
  { id: "standardManuscriptFormat", label: "Standard Manuscript Format", translationKey: 'exp.option.smf.label', description: "Courier 12pt, double-spaced, standard margins." },
  { id: "includeTitlePage", label: "Include Title Page", translationKey: 'exp.option.titlePage.label', description: "Auto-generate a title page with your profile info." },
  { id: "includeTableOfContents", label: "Table of Contents", description: "Generate a TOC linked to chapter headings." },
];

export default function ExportToolPage() {
  const { activeProjectId, activeProjectTitle, error: workspaceError } = useDashboardWorkspace();
  const { t } = useTranslation();

  const [format, setFormat] = useState<ExportFormat>("docx");
  const [options, setOptions] = useState<ManuscriptExportOptions>({
    standardManuscriptFormat: true,
    includeTableOfContents: true,
    includeTitlePage: true,
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const handleExport = async () => {
    if (!activeProjectId) {
      setError("No active project to export.");
      return;
    }

    setIsExporting(true);
    setError(null);
    setStatus(t('exp.status.generating'));
    setExportComplete(false);

    try {
      const { blob, fileName } = await requestProjectExport(activeProjectId, format, options);
      
      let isTauri = false;
      try {
        isTauri = typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
      } catch (e) {}

      if (isTauri) {
        const { save } = await import('@tauri-apps/plugin-dialog');
        const { writeFile } = await import('@tauri-apps/plugin-fs');

        const savePath = await save({ defaultPath: fileName });
        if (savePath) {
          const arrayBuffer = await blob.arrayBuffer();
          await writeFile(savePath, new Uint8Array(arrayBuffer));
        }
      } else {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
      }

      setStatus("Export successful!");
      setExportComplete(true);
      setTimeout(() => {
        setStatus(null);
        setExportComplete(false);
      }, 5000);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Unable to export project.");
      setStatus(null);
    } finally {
      setIsExporting(false);
    }
  };

  const isConfigurable = format === "pdf" || format === "docx";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "var(--background-surface)" }}>
      <Box
        component="header"
        sx={{
          height: 80,
          px: { xs: 3, md: 4 },
          borderBottom: "1px solid var(--border-ui)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          position: "sticky",
          top: 0,
          bgcolor: "color-mix(in srgb, var(--background-surface) 90%, transparent)",
          backdropFilter: "blur(8px)",
          zIndex: 1,
        }}
      >
        <Stack spacing={0.5}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "var(--text-primary)" }}>
            {t("dashboard.nav.export")}
          </Typography>
          <Typography variant="body2" sx={{ color: "var(--text-secondary)", display: { xs: "none", sm: "block" } }}>
            {activeProjectTitle ?? "No project selected"}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={3} alignItems="center">
          <AnimatePresence>
            {status && (
              <Box
                component={motion.span}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--emerald-500, #10B981)", letterSpacing: 1 }}>
                  {status}
                </Typography>
              </Box>
            )}
            {(error || workspaceError) && (
              <Box
                component={motion.span}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#F87171", letterSpacing: 1 }}>
                  {error ?? workspaceError}
                </Typography>
              </Box>
            )}
          </AnimatePresence>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", py: { xs: 4, md: 8 }, px: { xs: 3, md: 6 }, maxWidth: 1280, width: "100%", mx: "auto" }}>
        <Grid container spacing={{ xs: 3, md: 5 }}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Stack spacing={3}>
              <Stack direction="row" spacing={1} alignItems="center">
                <FileDown className="w-5 h-5" color="#10B981" />
                <Typography variant="overline" sx={{ letterSpacing: 4, color: "var(--text-tertiary)", fontWeight: 700 }}>
                  Select Format
                </Typography>
              </Stack>

              <Stack spacing={2.5}>
                {formats.map((f) => {
                  const isActive = f.id === format;
                  return (
                    <Card key={f.id} elevation={isActive ? 8 : 1} sx={{ borderRadius: 4, border: "2px solid", borderColor: isActive ? "rgba(16,185,129,0.7)" : "var(--border-ui)", bgcolor: isActive ? "rgba(16,185,129,0.08)" : "var(--background-app)" }}>
                      <CardActionArea onClick={() => setFormat(f.id)} sx={{ borderRadius: 4 }}>
                        <CardContent sx={{ display: "flex", gap: 2.5, alignItems: "flex-start" }}>
                          <Paper sx={{ p: 1.5, borderRadius: 3, bgcolor: isActive ? "rgba(16,185,129,0.15)" : "var(--background-surface)", border: "1px solid", borderColor: isActive ? "rgba(16,185,129,0.4)" : "var(--border-ui)" }}>
                            <f.icon className="w-5 h-5" color={isActive ? "#10B981" : "var(--text-secondary)"} />
                          </Paper>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "var(--text-primary)" }}>
                              {f.name}
                            </Typography>
                            <Typography variant="body2" sx={{ color: "var(--text-secondary)" }}>
                              {f.description}
                            </Typography>
                          </Box>
                          {isActive && <CheckCircle2 className="w-5 h-5" color="#10B981" />}
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  );
                })}
              </Stack>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, lg: 6 }}>
            <Stack spacing={3}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Settings2 className="w-5 h-5" color="#10B981" />
                <Typography variant="overline" sx={{ letterSpacing: 4, color: "var(--text-tertiary)", fontWeight: 700 }}>
                  Export Options
                </Typography>
              </Stack>

              <Paper
                sx={{
                  p: { xs: 3, md: 4 },
                  borderRadius: 4,
                  border: "1px solid var(--border-ui)",
                  bgcolor: "var(--background-app)",
                  opacity: isConfigurable ? 1 : 0.5,
                  pointerEvents: isConfigurable ? "auto" : "none",
                }}
              >
                <Stack spacing={2.5}>
                  {optionList.map((item) => (
                    <Stack key={item.id} direction="row" spacing={2} alignItems="flex-start">
                      <FormControlLabel
                        control={
                          <Switch
                            checked={options[item.id]}
                            onChange={(event) => setOptions((prev) => ({ ...prev, [item.id]: event.target.checked }))}
                            color="success"
                            disabled={!isConfigurable || isExporting}
                          />
                        }
                        label=""
                      />
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "var(--text-primary)" }}>
                          {item.label}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "var(--text-secondary)" }}>
                          {item.description}
                        </Typography>
                      </Box>
                    </Stack>
                  ))}

                  {!isConfigurable && (
                    <Paper sx={{ mt: 1, p: 2.5, borderRadius: 3, border: "1px solid rgba(251,191,36,0.5)", bgcolor: "rgba(251,191,36,0.12)" }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "#b45309" }}>
                        Formatting options are only available for PDF and DOCX.
                      </Typography>
                    </Paper>
                  )}
                </Stack>
              </Paper>

              <Divider sx={{ borderColor: "var(--border-ui)" }} />

              {typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || (window as any).__TAURI__) && (
                <Stack spacing={2} sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "var(--text-primary)" }}>
                    Aevon Local Sync
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="outlined"
                      color="primary"
                      disabled={!activeProjectId}
                      onClick={async () => {
                        try {
                          const { exportAevonProject } = await import('@/lib/aevon-export');
                          if (activeProjectId) {
                            const success = await exportAevonProject(activeProjectId);
                            if (success) {
                              setStatus("Exported .aevon successfully!");
                            }
                          }
                        } catch (err) {
                          console.error(err);
                          setError("Failed to export .aevon");
                        }
                      }}
                    >
                      Export .aevon
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={async () => {
                        try {
                          const { importAevonProject } = await import('@/lib/aevon-export');
                          const contents = await importAevonProject();
                          if (contents) {
                            setStatus("Imported .aevon successfully!");
                          }
                        } catch (err) {
                          console.error(err);
                          setError("Failed to import .aevon");
                        }
                      }}
                    >
                      Import .aevon
                    </Button>
                  </Stack>
                </Stack>
              )}

              <Button
                onClick={handleExport}
                disabled={isExporting || !activeProjectId}
                variant="contained"
                color="success"
                size="large"
                startIcon={
                  isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : exportComplete ? <CheckCircle2 className="w-5 h-5" /> : <Download className="w-5 h-5" />
                }
                sx={{
                  borderRadius: 4,
                  py: 2,
                  fontWeight: 900,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  boxShadow: "0 20px 45px rgba(16,185,129,0.35)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(120deg, transparent, rgba(255,255,255,0.25), transparent)",
                    transform: "translateX(-100%)",
                    animation: "shimmer 2.5s infinite",
                    opacity: isExporting ? 0.2 : 0.4,
                  }}
                />
                <Typography component="span" variant="button" sx={{ position: "relative" }}>
                  {isExporting ? "Exporting..." : exportComplete ? "Exported" : "Export Project"}
                </Typography>
              </Button>

              {!activeProjectId && (
                <Tooltip title="Select a project first" placement="right">
                  <Chip
                    label="No active project"
                    color="warning"
                    variant="outlined"
                    sx={{ alignSelf: "flex-start", fontWeight: 600 }}
                  />
                </Tooltip>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

// Keyframes for shimmer animation
const shimmer = `@keyframes shimmer { 0% { transform: translateX(-120%); } 50% { transform: translateX(0%); } 100% { transform: translateX(120%); } }`;

if (typeof document !== "undefined" && !document.getElementById("export-shimmer-style")) {
  const style = document.createElement("style");
  style.id = "export-shimmer-style";
  style.innerHTML = shimmer;
  document.head.appendChild(style);
}








