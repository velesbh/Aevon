"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { useTranslation } from "@/lib/i18n";
import {
  Download,
  FileIcon,
  FileText,
  Image as ImageIcon,
  Loader2,
  Trash2,
  UploadCloud,
  FileTextIcon,
  LayoutGrid,
  List as ListIcon,
  CheckSquare,
  Square
} from "lucide-react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import LinearProgress from "@mui/material/LinearProgress";
import Grid from "@mui/material/Grid";
import { AnimatePresence, motion } from "framer-motion";
import { useDashboardWorkspace } from "@/components/dashboard/workspace-provider";
import { downloadWorkspaceFile, type FileRecord } from "@/lib/workspace";

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getFileCategory(file: FileRecord) {
  const mime = file.mime_type || "";

  if (mime.startsWith("image/")) {
    return "image";
  }

  if (
    mime === "application/pdf" ||
    mime.includes("document") ||
    mime.includes("msword") ||
    mime.includes("officedocument")
  ) {
    return "document";
  }

  return "other";
}

function FileTypeIcon({ file, size = 48 }: { file: FileRecord; size?: number }) {
  const category = getFileCategory(file);
  const iconProps = { size, strokeWidth: 1.7 };

  if (category === "image") {
    return <ImageIcon {...iconProps} color="var(--emerald-500, #10B981)" />;
  }

  if (category === "document") {
    return <FileTextIcon {...iconProps} color="var(--emerald-400, #34D399)" />;
  }

  return <FileIcon {...iconProps} color="var(--text-tertiary)" />;
}

export default function FileManagerPage() {
  const { deleteFileRecord, error: workspaceError, files, loading, uploadFileRecord } = useDashboardWorkspace();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Bulk actions state
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) {
      return files;
    }

    const query = searchQuery.toLowerCase();
    return files.filter((file) => file.file_name.toLowerCase().includes(query));
  }, [files, searchQuery]);

  // Clean up any status messages
  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => setStatus(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleUploadBatch = async (selectedFilesToUpload: FileList | File[]) => {
    if (!selectedFilesToUpload || selectedFilesToUpload.length === 0) {
      return;
    }

    // Validation: Only allow image and text files
    const items = Array.from(selectedFilesToUpload);
    const invalidFiles = items.filter(
      (file) => !file.type.startsWith("image/") && !file.type.startsWith("text/") && !file.name.endsWith(".txt")
    );

    if (invalidFiles.length > 0) {
      setError(`Invalid file type(s) detected. Only images and text files are allowed.`);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setUploading(true);
    setError(null);
    setStatus(null);
    setUploadProgress(0);

    const totalFiles = items.length;
    let completed = 0;

    try {
      for (const item of items) {
        await uploadFileRecord(item);
        completed++;
        setUploadProgress(Math.round((completed / totalFiles) * 100));
      }

      setStatus(`Successfully uploaded ${totalFiles} file${totalFiles > 1 ? "s" : ""}.`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to complete upload.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    await handleUploadBatch(event.dataTransfer.files);
  };

  const handleDownload = async (file: FileRecord) => {
    try {
      let isTauri = false;
      try {
        isTauri = typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
      } catch (e) {}

      if (isTauri) {
        const { save } = await import('@tauri-apps/plugin-dialog');
        const { writeFile } = await import('@tauri-apps/plugin-fs');

        const savePath = await save({ defaultPath: file.file_name });
        if (savePath) {
          const blob = await downloadWorkspaceFile(file);
          const arrayBuffer = await blob.arrayBuffer();
          await writeFile(savePath, new Uint8Array(arrayBuffer));
        }
      } else {
        const blob = await downloadWorkspaceFile(file);
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = file.file_name;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
      }
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Unable to download file.");
    }
  };

  const handleDelete = async (file: FileRecord) => {
    setDeletingId(file.id);
    setError(null);
    setStatus(null);

    try {
      await deleteFileRecord(file.id);
      setStatus("File deleted.");
      setSelectedFiles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete file.");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleSelection = (fileId: string) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map((f) => f.id)));
    }
  };

  const handleBulkDownload = async () => {
    const filesToDownload = files.filter((f) => selectedFiles.has(f.id));
    for (const file of filesToDownload) {
      await handleDownload(file);
    }
    setSelectedFiles(new Set());
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    setError(null);
    setStatus(null);

    try {
      const filesToDelete = files.filter((f) => selectedFiles.has(f.id));
      for (const file of filesToDelete) {
        await deleteFileRecord(file.id);
      }
      setStatus(`Deleted ${selectedFiles.size} files.`);
      setSelectedFiles(new Set());
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete some files.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", bgcolor: "var(--background-surface)", overflow: "hidden" }}>
      <Box
        component="header"
        sx={{
          height: 80,
          px: { xs: 3, md: 4 },
          borderBottom: "1px solid",
          borderColor: "var(--border-ui)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 3,
          bgcolor: "color-mix(in srgb, var(--background-surface) 90%, transparent)",
          backdropFilter: "blur(8px)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Stack spacing={0.5}>
          <Typography variant="h5" sx={{ color: "var(--text-primary)", fontWeight: 700 }}>
            Files
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "var(--text-secondary)", fontWeight: 500, display: { xs: "none", md: "block" } }}
          >
            Manage your workspace assets.
          </Typography>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={2}>
          <AnimatePresence>
            {uploading && (
              <Box
                component={motion.div}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                sx={{
                  display: { xs: "none", sm: "flex" },
                  flexDirection: "column",
                  gap: 1,
                  minWidth: 220,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 1, color: "var(--emerald-500, #10B981)" }}>
                    Uploading {uploadProgress}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={uploadProgress}
                  sx={{
                    height: 6,
                    borderRadius: 999,
                    bgcolor: "var(--background-app)",
                    "& .MuiLinearProgress-bar": {
                      bgcolor: "var(--emerald-500, #10B981)",
                    },
                  }}
                />
              </Box>
            )}

            {status && (
              <Box
                component={motion.span}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                sx={{ display: { xs: "none", sm: "block" } }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 1, color: "var(--emerald-500, #10B981)" }}>
                  {status}
                </Typography>
              </Box>
            )}

            {(error || workspaceError) && (
              <Box
                component={motion.span}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                sx={{ display: { xs: "none", sm: "block" } }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 1, color: "#F87171" }}>
                  {error ?? workspaceError}
                </Typography>
              </Box>
            )}
          </AnimatePresence>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,text/*"
            multiple
            hidden
            onChange={(event) => {
              if (event.target.files) {
                void handleUploadBatch(event.target.files);
              }
            }}
          />

          <Button
            variant="contained"
            color="success"
            startIcon={<UploadCloud className="h-4 w-4" />}
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            sx={{
              borderRadius: 999,
              fontWeight: 700,
              textTransform: "none",
              px: { xs: 2.5, sm: 3.5 },
              py: 1,
              boxShadow: "0 8px 24px rgba(16,185,129,0.25)",
            }}
          >
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
              Upload Files
            </Box>
            <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
              Upload
            </Box>
          </Button>
        </Stack>
      </Box>

      <AnimatePresence>
        {selectedFiles.size > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 64, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: { xs: 3, md: 4 },
                borderBottom: "1px solid",
                borderColor: "rgba(16,185,129,0.4)",
                bgcolor: "rgba(16,185,129,0.08)",
                minHeight: 64,
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--emerald-500, #10B981)" }}>
                  {selectedFiles.size} selected
                </Typography>
                <Button variant="text" color="success" size="small" onClick={() => setSelectedFiles(new Set())} sx={{ fontWeight: 700, letterSpacing: 1 }}>
                  Clear
                </Button>
              </Stack>
              <Stack direction="row" spacing={1.5}>
                <Button
                  variant="outlined"
                  color="success"
                  size="small"
                  onClick={handleBulkDownload}
                  startIcon={<Download className="w-4 h-4" />}
                  sx={{ borderRadius: 999, textTransform: "uppercase", fontSize: 12, letterSpacing: 1 }}
                >
                  Download
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                  startIcon={
                    isBulkDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />
                  }
                  sx={{ borderRadius: 999, textTransform: "uppercase", fontSize: 12, letterSpacing: 1 }}
                >
                  Delete
                </Button>
              </Stack>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          position: "relative",
          transition: "background-color 150ms ease",
          bgcolor: isDragging ? "rgba(16,185,129,0.05)" : "transparent",
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {isDragging && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px dashed rgba(16,185,129,0.8)",
              borderRadius: 6,
              m: { xs: 2, md: 4 },
              bgcolor: "rgba(16,185,129,0.08)",
              backdropFilter: "blur(4px)",
            }}
          >
            <Stack spacing={1} alignItems="center" textAlign="center" sx={{ p: { xs: 4, md: 6 }, bgcolor: "var(--background-surface)", borderRadius: 4, boxShadow: "0 25px 50px rgba(0,0,0,0.3)" }}>
              <UploadCloud className="w-12 h-12" color="#10B981" />
              <Typography variant="h5" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                Drop files here
              </Typography>
              <Typography variant="body2" sx={{ color: "var(--text-secondary)" }}>
                Files will be uploaded to your workspace
              </Typography>
            </Stack>
          </Box>
        )}

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", md: "center" }}
          sx={{
            px: { xs: 3, md: 4 },
            py: 3,
            borderBottom: "1px solid",
            borderColor: "var(--border-ui)",
            gap: 2,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1, width: "100%" }}>
            <Tooltip title="Select all">
              <IconButton
                onClick={selectAll}
                sx={{
                  border: "1px solid",
                  borderColor: "var(--border-ui)",
                  bgcolor: "var(--background-app)",
                  color:
                    selectedFiles.size === filteredFiles.length && filteredFiles.length > 0
                      ? "var(--emerald-500, #10B981)"
                      : "var(--text-secondary)",
                }}
              >
                {selectedFiles.size === filteredFiles.length && filteredFiles.length > 0 ? (
                  <CheckSquare className="w-5 h-5" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
              </IconButton>
            </Tooltip>

            <TextField
              fullWidth
              size="small"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              inputProps={{ style: { fontWeight: 500 } }}
              sx={{
                borderRadius: "999px",
                "& .MuiOutlinedInput-root": {
                  borderRadius: "999px",
                  backgroundColor: "var(--background-app)",
                  color: "var(--text-primary)",
                  "& fieldset": {
                    borderColor: "var(--border-ui)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(16,185,129,0.5)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "rgba(16,185,129,0.9)",
                  },
                },
              }}
            />
          </Stack>

          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            sx={{
              bgcolor: "var(--background-app)",
              borderRadius: "999px",
              border: "1px solid var(--border-ui)",
              p: 0.5,
            }}
          >
            <Tooltip title="Grid view">
              <IconButton
                onClick={() => setViewMode("grid")}
                color={viewMode === "grid" ? "success" : "default"}
                sx={{
                  bgcolor: viewMode === "grid" ? "var(--background-surface)" : "transparent",
                  borderRadius: "999px",
                }}
              >
                <LayoutGrid className="w-4 h-4" />
              </IconButton>
            </Tooltip>
            <Tooltip title="List view">
              <IconButton
                onClick={() => setViewMode("list")}
                color={viewMode === "list" ? "success" : "default"}
                sx={{
                  bgcolor: viewMode === "list" ? "var(--background-surface)" : "transparent",
                  borderRadius: "999px",
                }}
              >
                <ListIcon className="w-4 h-4" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {loading ? (
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Loader2 className="h-8 w-8 animate-spin" color="#10B981" />
          </Box>
        ) : filteredFiles.length === 0 ? (
          <Stack spacing={2} alignItems="center" justifyContent="center" textAlign="center" sx={{ flex: 1, p: { xs: 4, md: 8 } }}>
            <Paper elevation={0} sx={{ width: 96, height: 96, borderRadius: 3, border: "1px solid var(--border-ui)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <UploadCloud className="w-10 h-10" color="var(--text-tertiary)" />
            </Paper>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "var(--text-primary)" }}>
              No files found
            </Typography>
            <Typography variant="body2" sx={{ color: "var(--text-secondary)", maxWidth: 360 }}>
              {searchQuery ? "Try adjusting your search" : "Upload documents and images for your project."}
            </Typography>
            {!searchQuery && (
              <Button variant="outlined" color="inherit" onClick={() => fileInputRef.current?.click()} sx={{ borderRadius: 999, px: 4, fontWeight: 700 }}>
                Browse Files
              </Button>
            )}
          </Stack>
        ) : (
          <Box sx={{ flex: 1, overflowY: "auto", p: { xs: 3, md: 4 } }}>
            {viewMode === "grid" ? (
              <Grid container spacing={{ xs: 2, md: 3 }}>
                {filteredFiles.map((file) => {
                  const isSelected = selectedFiles.has(file.id);
                  return (
                    <Grid key={file.id} size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
                      <Paper
                        onClick={() => toggleSelection(file.id)}
                        elevation={isSelected ? 8 : 1}
                        sx={{
                          position: "relative",
                          borderRadius: 4,
                          p: { xs: 2.5, md: 3 },
                          height: "100%",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                          border: "1px solid",
                          borderColor: isSelected ? "rgba(16,185,129,0.6)" : "var(--border-ui)",
                          bgcolor: isSelected ? "rgba(16,185,129,0.06)" : "var(--background-app)",
                          transition: "all 150ms ease",
                          "&:hover": {
                            borderColor: "rgba(16,185,129,0.4)",
                            boxShadow: "0 15px 35px rgba(0,0,0,0.25)",
                          },
                          "&:hover .file-card-actions": {
                            opacity: 1,
                          },
                        }}
                      >
                        <Box sx={{ position: "absolute", top: 12, left: 12, color: isSelected ? "var(--emerald-500, #10B981)" : "var(--text-tertiary)" }}>
                          {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </Box>

                        <Stack alignItems="center" justifyContent="center" sx={{ flex: 1, py: { xs: 2, md: 3 } }}>
                          <FileTypeIcon file={file} size={56} />
                        </Stack>

                        <Divider sx={{ borderColor: "var(--border-ui)" }} />

                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700, color: "var(--text-primary)" }}>
                            {file.file_name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "var(--text-tertiary)" }}>
                            {formatBytes(file.file_size)}
                          </Typography>
                        </Box>

                        <Box
                          className="file-card-actions"
                          sx={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            display: "flex",
                            gap: 0.5,
                            opacity: isSelected ? 1 : 0,
                            transition: "opacity 150ms ease",
                          }}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Tooltip title="Download">
                            <IconButton size="small" onClick={() => void handleDownload(file)} sx={{ bgcolor: "var(--background-surface)" }}>
                              <Download className="w-4 h-4" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => void handleDelete(file)} disabled={deletingId === file.id} color="error">
                              {deletingId === file.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            ) : (
              <Paper
                sx={{
                  borderRadius: 4,
                  border: "1px solid var(--border-ui)",
                  bgcolor: "var(--background-app)",
                  overflow: "hidden",
                }}
              >
                {filteredFiles.map((file, index) => {
                  const isSelected = selectedFiles.has(file.id);
                  return (
                    <Box
                      key={file.id}
                      onClick={() => toggleSelection(file.id)}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        px: { xs: 2, md: 3 },
                        py: { xs: 1.5, md: 2 },
                        gap: 2,
                        cursor: "pointer",
                        bgcolor: isSelected ? "rgba(16,185,129,0.05)" : "transparent",
                        borderTop: index === 0 ? "none" : "1px solid var(--border-ui)",
                        transition: "background-color 120ms ease",
                        "&:hover": {
                          bgcolor: "color-mix(in srgb, var(--background-surface), rgba(16,185,129,0.05))",
                        },
                      }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
                        <IconButton
                          size="small"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleSelection(file.id);
                          }}
                          sx={{ color: isSelected ? "var(--emerald-500, #10B981)" : "var(--text-tertiary)" }}
                        >
                          {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </IconButton>
                        <Paper sx={{ p: 1.5, borderRadius: 2, border: "1px solid var(--border-ui)", bgcolor: "var(--background-surface)" }}>
                          <FileTypeIcon file={file} size={28} />
                        </Paper>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle1" noWrap sx={{ fontWeight: 700, color: "var(--text-primary)" }}>
                            {file.file_name}
                          </Typography>
                          <Stack direction="row" spacing={2} sx={{ mt: 0.5, alignItems: "center" }}>
                            <Chip
                              label={formatBytes(file.file_size)}
                              size="small"
                              sx={{ borderColor: "var(--border-ui)", color: "var(--text-secondary)", bgcolor: "var(--background-app)" }}
                              variant="outlined"
                            />
                            <Typography variant="caption" sx={{ color: "var(--text-tertiary)", display: { xs: "none", sm: "block" } }}>
                              {formatDate(file.created_at)}
                            </Typography>
                          </Stack>
                        </Box>
                      </Stack>

                      <Stack
                        direction="row"
                        spacing={1}
                        onClick={(event) => event.stopPropagation()}
                        sx={{ opacity: { xs: 1, md: 0.8 }, "&:hover": { opacity: 1 } }}
                      >
                        <Tooltip title="Download">
                          <IconButton size="small" onClick={() => void handleDownload(file)}>
                            <Download className="w-4 h-4" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => void handleDelete(file)} disabled={deletingId === file.id}>
                            {deletingId === file.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                  );
                })}
              </Paper>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}


