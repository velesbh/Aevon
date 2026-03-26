"use client";

import { useState, useEffect } from "react";
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
  { id: "includeManuscript", label: "Include Manuscript", translationKey: "exp.option.manuscript.label", description: "Export all chapters and scenes." },
  { id: "includeTitlePage", label: "Include Title Page", translationKey: "exp.option.titlePage.label", description: "Auto-generate a title page with your profile info." },
  { id: "includeTableOfContents", label: "Table of Contents", translationKey: "exp.option.toc.label", description: "Generate a TOC linked to chapter headings." },
  { id: "includeCharacters", label: "Include Characters", translationKey: "exp.option.characters.label", description: "Export all character profiles and details." },
  { id: "includeLocations", label: "Include Locations", translationKey: "exp.option.locations.label", description: "Export all setting and world locations." },
  { id: "includeLore", label: "Include Lore", translationKey: "exp.option.lore.label", description: "Export world-building lore and history." },
  { id: "includeItems", label: "Include Items", translationKey: "exp.option.items.label", description: "Export all magical items, relics, and equipment." },
  { id: "includeIdeas", label: "Include Ideas", translationKey: "exp.option.ideas.label", description: "Export scratchpad notes and idea snippets." },
];

export default function ExportToolPage() {
  const { activeProjectId, activeProjectTitle, error: workspaceError, chapters } = useDashboardWorkspace();
  const { t } = useTranslation();

  const [format, setFormat] = useState<ExportFormat>("docx");
  const [options, setOptions] = useState<ManuscriptExportOptions>({
    standardManuscriptFormat: true,
    includeTableOfContents: true,
    includeTitlePage: true,
    includeManuscript: true,
    includeCharacters: true,
    includeLocations: true,
    includeLore: true,
    includeItems: true,
    includeIdeas: true,
  });

  const [selectedChapters, setSelectedChapters] = useState<Set<string>>(new Set());
  
  // Update options to include only selected chapters if some are deselected
  const getFinalOptions = () => {
    const finalOptions = { ...options };
    if (finalOptions.includeManuscript) {
      if (selectedChapters.size > 0 && selectedChapters.size < (chapters?.length || 0)) {
        finalOptions.includeManuscript = Array.from(selectedChapters);
      } else if (selectedChapters.size === 0 && chapters && chapters.length > 0) {
        finalOptions.includeManuscript = false; // None selected
      }
    }
    return finalOptions;
  };

  // Initialize all chapters as selected when chapters load
  useEffect(() => {
    if (chapters && chapters.length > 0 && selectedChapters.size === 0) {
      setSelectedChapters(new Set(chapters.map((c) => c.id)));
    }
  }, [chapters]);

  const [exportComplete, setExportComplete] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
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
      const { blob, fileName } = await requestProjectExport(activeProjectId, format, getFinalOptions());
      
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
      {/* Topbar removed for cleaner UI */}

      <Box sx={{ flex: 1, overflowY: "auto", py: { xs: 4, md: 8 }, px: { xs: 3, md: 6 }, maxWidth: 1280, width: "100%", mx: "auto" }}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-12">
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg border border-[var(--border-ui)]/50 bg-[var(--background-app)]">
            <Download className="w-4 h-4 text-[var(--text-secondary)]" />
            <span className="text-sm font-bold text-[var(--text-primary)]">Universal Export</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOptions({
                standardManuscriptFormat: true,
                includeTableOfContents: true,
                includeTitlePage: true,
                includeManuscript: true,
                includeCharacters: true,
                includeLocations: true,
                includeLore: true,
                includeItems: true,
                includeIdeas: true,
              })}
              className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest bg-[var(--state-layer-primary)] text-[var(--primary)] border border-[var(--primary)]/20 hover:bg-[var(--primary)] hover:text-white transition-all active:scale-[0.97]"
            >
              Export Everything
            </button>
            <button
               onClick={() => setOptions({
                 standardManuscriptFormat: true,
                 includeTableOfContents: true,
                 includeTitlePage: true,
                 includeManuscript: true,
                 includeCharacters: false,
                 includeLocations: false,
                 includeLore: false,
                 includeItems: false,
                 includeIdeas: false,
               })}
              className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest bg-[var(--background-app)] text-[var(--text-secondary)] border border-[var(--border-ui)] hover:border-[var(--border-ui-hover)] transition-all active:scale-[0.97]"
            >
              Manuscript Only
            </button>
          </div>
        </div>

        <Grid container spacing={{ xs: 3, md: 5 }}>

          <Grid size={{ xs: 12, lg: 6 }}>
            <Stack spacing={3}>
              <Stack direction="row" spacing={1} alignItems="center">
                <FileDown className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
                <Typography variant="overline" sx={{ letterSpacing: 4, color: "var(--text-tertiary)", fontWeight: 700 }}>
                  Select Format
                </Typography>
              </Stack>

              <Stack spacing={2.5}>
                {formats.map((f) => {
                  const isActive = f.id === format;
                  return (
                    <Card key={f.id} elevation={0} sx={{ borderRadius: 4, border: "1px solid", borderColor: isActive ? "var(--primary, #34a853)" : "var(--border-ui)", bgcolor: isActive ? "var(--state-layer-primary, rgba(52,168,83,0.06))" : "var(--background-app)", transition: "all 0.15s ease" }}>
                      <CardActionArea onClick={() => setFormat(f.id)} sx={{ borderRadius: 4 }}>
                        <CardContent sx={{ display: "flex", gap: 2.5, alignItems: "flex-start" }}>
                          <Paper elevation={0} sx={{ p: 1.5, borderRadius: 3, bgcolor: isActive ? "var(--state-layer-primary, rgba(52,168,83,0.12))" : "var(--background-surface)", border: "1px solid", borderColor: isActive ? "var(--primary, #34a853)" : "var(--border-ui)" }}>
                            <f.icon className="w-5 h-5" style={{ color: isActive ? "var(--primary, #34a853)" : "var(--text-secondary)" }} />
                          </Paper>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "var(--text-primary)" }}>
                              {f.name}
                            </Typography>
                            <Typography variant="body2" sx={{ color: "var(--text-secondary)" }}>
                              {f.description}
                            </Typography>
                          </Box>
                          {isActive && <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--primary, #34a853)' }} />}
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  );
                })}
              </Stack>

              {options.includeManuscript && chapters && chapters.length > 0 && (
                <>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
                    <BookOpen className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
                    <Typography variant="overline" sx={{ letterSpacing: 4, color: "var(--text-tertiary)", fontWeight: 700 }}>
                      Select Manuscripts
                    </Typography>
                  </Stack>
                  <Paper
                    sx={{
                      p: { xs: 2, md: 3 },
                      borderRadius: 4,
                      border: "1px solid var(--border-ui)",
                      bgcolor: "var(--background-app)",
                      maxHeight: 300,
                      overflowY: "auto",
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {selectedChapters.size} of {chapters.length} chapters selected
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => {
                          if (selectedChapters.size === chapters.length) {
                            setSelectedChapters(new Set());
                          } else {
                            setSelectedChapters(new Set(chapters.map(c => c.id)));
                          }
                        }}
                      >
                        {selectedChapters.size === chapters.length ? "Deselect All" : "Select All"}
                      </Button>
                    </Stack>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {chapters.map((chapter) => {
                        const isSelected = selectedChapters.has(chapter.id);
                        return (
                          <div
                            key={chapter.id}
                            onClick={() => {
                              const newSet = new Set(selectedChapters);
                              if (isSelected) newSet.delete(chapter.id);
                              else newSet.add(chapter.id);
                              setSelectedChapters(newSet);
                            }}
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-[var(--primary)] bg-[var(--state-layer-primary)]' : 'border-[var(--border-ui)] bg-[var(--background-surface)] hover:border-[var(--border-ui-hover)]'}`}
                          >
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${isSelected ? 'border-[var(--primary)] bg-[var(--primary)]' : 'border-[var(--text-tertiary)] bg-transparent'}`}>
                              {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-[var(--text-primary)] truncate">
                                {chapter.title || `Chapter ${chapter.order_index + 1}`}
                              </p>
                              <p className="text-xs text-[var(--text-tertiary)]">
                                {chapter.word_count || 0} words
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Paper>
                </>
              )}
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, lg: 6 }}>
            <Stack spacing={3}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Settings2 className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
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
                            checked={!!options[item.id]}
                            onChange={(event) => setOptions((prev) => ({ ...prev, [item.id]: event.target.checked }))}
                            color="success"
                            disabled={!isConfigurable || isExporting}
                          />
                        }
                        label=""
                      />
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "var(--text-primary)" }}>
                          {item.translationKey ? t(item.translationKey) : item.label}
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
                size="large"
                startIcon={
                  isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : exportComplete ? <CheckCircle2 className="w-5 h-5" /> : <Download className="w-5 h-5" />
                }
                sx={{
                  borderRadius: 999,
                  py: 1.75,
                  px: 4,
                  fontWeight: 700,
                  textTransform: "none",
                  bgcolor: "var(--primary, #188038)",
                  "&:hover": { bgcolor: "var(--primary-strong, #115b27)" },
                  "&:active": { transform: "scale(0.97)" },
                  transition: "all 0.15s ease",
                }}
              >
                {isExporting ? "Exporting..." : exportComplete ? "Exported" : "Export Project"}
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








