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
  Square,
  Maximize2,
  Grid3X3,
  Search,
  Plus
} from "lucide-react";
import { FilePreviewModal } from "@/components/dashboard/file-preview-modal";
import { createCharacterImageSignedUrl } from "@/lib/workspace";
import { cn } from "@/lib/utils";
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
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
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
    return <ImageIcon {...iconProps} color="var(--primary, #34a853)" />;
  }

  if (category === "document") {
    return <FileTextIcon {...iconProps} color="var(--text-secondary)" />;
  }

  return <FileIcon {...iconProps} color="var(--text-tertiary)" />;
}

function FileThumbnail({ file, size = "full" }: { file: FileRecord; size?: "sm" | "full" }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (getFileCategory(file) !== "image") {
      setLoading(false);
      return;
    }

    createCharacterImageSignedUrl(file.file_path)
      .then((signedUrl) => {
        if (active) {
          setUrl(signedUrl);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [file]);

  if (loading) {
    return (
      <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "var(--background-app)" }}>
        <Loader2 className="w-5 h-5 animate-spin text-[var(--text-tertiary)]" />
      </Box>
    );
  }

  if (url) {
    return (
      <img
        src={url}
        alt={file.file_name}
        className={cn(
          "w-full h-full object-cover transition-transform duration-700",
          size === "full" && "group-hover:scale-110"
        )}
      />
    );
  }

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "var(--background-app)" }}>
      <FileTypeIcon file={file} size={size === "sm" ? 24 : 48} />
    </Box>
  );
}

export default function FileManagerPage() {
  const { deleteFileRecord, error: workspaceError, files, loading, uploadFileRecord } = useDashboardWorkspace();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "gallery">("gallery");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);

  // Bulk actions state
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: FileRecord } | null>(null);

  const handleContextMenu = (event: React.MouseEvent, file: FileRecord) => {
    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? { x: event.clientX, y: event.clientY, file }
        : null,
    );
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

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
      {/* Topbar removed for cleaner UI */}

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
                borderColor: "divider",
                bgcolor: "var(--state-layer-primary, rgba(52, 168, 83, 0.08))",
                minHeight: 64,
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--primary, #34a853)" }}>
                  {selectedFiles.size} selected
                </Typography>
                <Button variant="text" size="small" onClick={() => setSelectedFiles(new Set())} sx={{ fontWeight: 600, letterSpacing: 1, color: "text.secondary" }}>
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
                  sx={{ borderRadius: 999, textTransform: "none", fontSize: 12, fontWeight: 600, borderColor: "divider", color: "text.secondary" }}
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
                  sx={{ borderRadius: 999, textTransform: "none", fontSize: 12, fontWeight: 600 }}
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
          bgcolor: isDragging ? "var(--state-layer-primary, rgba(52,168,83,0.04))" : "transparent",
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
              border: "2px dashed var(--primary, #34a853)",
              borderRadius: 6,
              m: { xs: 2, md: 4 },
              bgcolor: "var(--state-layer-primary, rgba(52,168,83,0.06))",
              backdropFilter: "blur(4px)",
            }}
          >
            <Stack spacing={1} alignItems="center" textAlign="center" sx={{ p: { xs: 4, md: 6 }, bgcolor: "var(--background-surface)", borderRadius: 4, boxShadow: "0 25px 50px rgba(0,0,0,0.3)" }}>
              <UploadCloud className="w-12 h-12" style={{ color: 'var(--primary, #34a853)' }} />
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
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 w-full px-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border-ui)]/50 bg-[var(--background-surface)]">
                <ImageIcon className="w-4 h-4 text-[var(--text-secondary)]" />
                <span className="text-sm font-bold text-[var(--text-primary)]">Files</span>
              </div>
              
              <AnimatePresence>
                {uploading && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 text-xs font-bold text-[var(--primary)]"
                  >
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>UPLOADING {uploadProgress}%</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search files..."
                  className="w-full bg-[var(--background-surface)] border border-[var(--border-ui)] rounded-full py-2 pl-12 pr-4 text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 transition-all"
                />
              </div>
              
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
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--primary)] hover:opacity-90 text-white transition-all active:scale-95 shrink-0"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

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
            <Tooltip title="Gallery view">
              <IconButton
                onClick={() => setViewMode("gallery")}
                color={viewMode === "gallery" ? "primary" : "default"}
                sx={{
                  bgcolor: viewMode === "gallery" ? "var(--background-surface)" : "transparent",
                  borderRadius: "999px",
                }}
              >
                <Grid3X3 className="w-4 h-4" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Grid view">
              <IconButton
                onClick={() => setViewMode("grid")}
                color={viewMode === "grid" ? "primary" : "default"}
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
                color={viewMode === "list" ? "primary" : "default"}
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
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--primary, #34a853)' }} />
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
            {viewMode === "gallery" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredFiles.map((file) => {
                  const isSelected = selectedFiles.has(file.id);
                  const isImage = getFileCategory(file) === "image";
                  return (
                    <div key={file.id}>
                      <Paper
                        className="group"
                        elevation={0}
                        sx={{
                          position: "relative",
                          borderRadius: 8,
                          overflow: "hidden",
                          aspectRatio: "1/1",
                          cursor: "pointer",
                          border: "1px solid",
                          borderColor: isSelected ? "var(--primary, #34a853)" : "transparent",
                          bgcolor: "var(--background-surface)",
                          transition: "all 500ms cubic-bezier(0.2, 0.8, 0.2, 1)",
                          "&:hover": {
                            borderColor: "var(--border-ui-hover)",
                            transform: "translateY(-4px)",
                            boxShadow: "var(--elevation-2)",
                          },
                          "&::after": {
                            content: '""',
                            position: "absolute",
                            inset: 0,
                            borderRadius: 'inherit',
                            boxShadow: isSelected ? "inset 0 0 0 2px var(--primary, #34a853)" : "none",
                            pointerEvents: "none",
                            zIndex: 3
                          }
                        }}
                        onClick={() => setPreviewFile(file)}
                        onContextMenu={(e) => handleContextMenu(e, file)}
                      >

                        <FileThumbnail file={file} />
                        
                        <Box
                          sx={{
                            position: "absolute",
                            inset: 0,
                            background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 50%)",
                            opacity: 0,
                            transition: "opacity 300ms ease",
                            ".group:hover &": { opacity: 1 },
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "flex-end",
                            p: 2.5,
                          }}
                        >
                           <Typography variant="body2" sx={{ color: "white", fontWeight: 700, mb: 0.5 }} noWrap>
                             {file.file_name}
                           </Typography>
                           <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                             {formatBytes(file.file_size)}
                           </Typography>
                        </Box>

                        <Box
                          sx={{
                            position: "absolute",
                            top: 12,
                            left: 12,
                            zIndex: 2,
                            opacity: isSelected ? 1 : 0,
                            transition: "opacity 200ms ease",
                            ".group:hover &": { opacity: 1 },
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelection(file.id);
                          }}
                        >
                          <IconButton 
                            size="small" 
                            sx={{ 
                              bgcolor: isSelected ? "var(--primary, #34a853)" : "rgba(0,0,0,0.4)",
                              color: "white",
                              backdropFilter: "blur(4px)",
                              "&:hover": { bgcolor: isSelected ? "var(--primary-strong, #188038)" : "rgba(0,0,0,0.6)" }
                            }}
                          >
                            {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                          </IconButton>
                        </Box>

                        <Box
                          sx={{
                            position: "absolute",
                            top: 12,
                            right: 12,
                            zIndex: 2,
                            opacity: 0,
                            transition: "opacity 200ms ease",
                            ".group:hover &": { opacity: 1 },
                          }}
                        >
                          <IconButton 
                            size="small" 
                            sx={{ 
                              bgcolor: "rgba(0,0,0,0.4)",
                              color: "white",
                              backdropFilter: "blur(4px)",
                              "&:hover": { bgcolor: "rgba(0,0,0,0.6)" }
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewFile(file);
                            }}
                          >
                            <Maximize2 className="w-4 h-4" />
                          </IconButton>
                        </Box>
                      </Paper>
                    </div>
                  );
                })}
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredFiles.map((file) => {
                  const isSelected = selectedFiles.has(file.id);
                  return (
                    <div key={file.id}>
                      <Paper
                        onClick={() => toggleSelection(file.id)}
                        onContextMenu={(e) => handleContextMenu(e, file)}
                        className="group"
                        elevation={0}
                        sx={{
                          position: "relative",
                          borderRadius: 4,
                          p: 0,
                          height: "100%",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          border: "1px solid",
                          borderColor: isSelected ? "var(--primary, #34a853)" : "var(--border-ui)",
                          bgcolor: isSelected ? "var(--state-layer-primary, rgba(52,168,83,0.06))" : "var(--background-app)",
                          transition: "all 150ms ease",
                          overflow: "hidden",
                          "&:hover": {
                            borderColor: "var(--border-ui-hover)",
                            boxShadow: "var(--elevation-1)",
                          },
                        }}
                      >
                        <Box sx={{ position: "absolute", top: 12, left: 12, zIndex: 10, color: isSelected ? "var(--primary, #34a853)" : "var(--text-tertiary)" }}>
                          {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </Box>

                        <Box sx={{ aspectRatio: "1/1", width: "100%", overflow: "hidden", position: "relative" }}>
                          <FileThumbnail file={file} />
                          <Box
                             className="file-card-preview-btn"
                             sx={{
                               position: "absolute",
                               inset: 0,
                               display: "flex",
                               alignItems: "center",
                               justifyContent: "center",
                               bgcolor: "var(--state-layer-neutral, rgba(0,0,0,0.04))",
                               opacity: 0,
                               transition: "opacity 150ms ease",
                               ".group:hover &": { opacity: 1 },
                             }}
                             onClick={(e) => {
                               e.stopPropagation();
                               setPreviewFile(file);
                             }}
                          >
                             <IconButton size="small" sx={{ bgcolor: "var(--background-surface)", color: "var(--text-primary)" }}>
                               <Maximize2 className="w-4 h-4" />
                             </IconButton>
                          </Box>
                        </Box>

                        <Box sx={{ p: 2, borderTop: "1px solid var(--border-ui)" }}>
                          <Typography variant="caption" noWrap sx={{ fontWeight: 700, color: "var(--text-primary)", display: "block" }}>
                            {file.file_name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "var(--text-tertiary)", fontSize: 10 }}>
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
                            zIndex: 10,
                          }}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Tooltip title="Download">
                            <IconButton size="small" onClick={() => void handleDownload(file)} sx={{ bgcolor: "var(--background-surface)", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                              <Download className="w-3.5 h-3.5" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => void handleDelete(file)} disabled={deletingId === file.id} color="error" sx={{ bgcolor: "var(--background-surface)", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                              {deletingId === file.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Paper>
                    </div>
                  );
                })}
              </div>
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
                      onContextMenu={(e) => handleContextMenu(e, file)}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        px: { xs: 2, md: 3 },
                        py: { xs: 1.5, md: 2 },
                        gap: 2,
                        cursor: "pointer",
                        bgcolor: isSelected ? "var(--state-layer-primary, rgba(52,168,83,0.05))" : "transparent",
                        borderTop: index === 0 ? "none" : "1px solid var(--border-ui)",
                        transition: "background-color 120ms ease",
                        "&:hover": {
                          bgcolor: "action.hover",
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
                          sx={{ color: isSelected ? "var(--primary, #34a853)" : "var(--text-tertiary)" }}
                        >
                          {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </IconButton>
                        <Paper sx={{ width: 48, height: 48, borderRadius: 2, border: "1px solid var(--border-ui)", bgcolor: "var(--background-surface)", overflow: "hidden", flexShrink: 0 }}>
                          <FileThumbnail file={file} size="sm" />
                        </Paper>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle1" noWrap sx={{ fontWeight: 700, color: "var(--text-primary)" }}>
                            {file.file_name}
                          </Typography>
                          <Stack direction="row" spacing={2} sx={{ mt: 0.5, alignItems: "center" }}>
                            <Chip
                              label={formatBytes(file.file_size)}
                              size="small"
                              sx={{ borderColor: "var(--border-ui)", color: "var(--text-secondary)", bgcolor: "var(--background-app)", height: 20, fontSize: 10, fontWeight: 700 }}
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
                        <Tooltip title="Preview">
                           <IconButton size="small" onClick={() => setPreviewFile(file)}>
                             <Maximize2 className="w-4 h-4" />
                           </IconButton>
                        </Tooltip>
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

      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onDelete={handleDelete}
        onDownload={handleDownload}
      />

      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.y, left: contextMenu.x }
            : undefined
        }
      >
        <MenuItem
          onClick={() => {
            if (contextMenu?.file) {
              setPreviewFile(contextMenu.file);
            }
            handleCloseContextMenu();
          }}
        >
          <ListItemIcon>
            <Maximize2 className="w-4 h-4" />
          </ListItemIcon>
          <ListItemText>Preview</ListItemText>
        </MenuItem>
        
        <MenuItem
          onClick={() => {
            if (contextMenu?.file) {
              void handleDownload(contextMenu.file);
            }
            handleCloseContextMenu();
          }}
        >
          <ListItemIcon>
            <Download className="w-4 h-4" />
          </ListItemIcon>
          <ListItemText>Download</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (contextMenu?.file) {
              toggleSelection(contextMenu.file.id);
            }
            handleCloseContextMenu();
          }}
        >
          <ListItemIcon>
            <CheckSquare className="w-4 h-4" />
          </ListItemIcon>
          <ListItemText>
            {contextMenu?.file && selectedFiles.has(contextMenu.file.id) ? "Deselect" : "Select"}
          </ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem
          onClick={() => {
            if (contextMenu?.file) {
              void handleDelete(contextMenu.file);
            }
            handleCloseContextMenu();
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon sx={{ color: "inherit" }}>
            <Trash2 className="w-4 h-4" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}


