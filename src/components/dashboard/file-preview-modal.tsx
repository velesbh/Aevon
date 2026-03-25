"use client";

import { useEffect, useState } from "react";
import { X, Download, Trash2, Loader2, Image as ImageIcon, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { downloadWorkspaceFile, createCharacterImageSignedUrl, type FileRecord } from "@/lib/workspace";
import { Button } from "@/components/ui/button";

interface FilePreviewModalProps {
  file: FileRecord | null;
  onClose: () => void;
  onDelete: (file: FileRecord) => Promise<void>;
  onDownload: (file: FileRecord) => Promise<void>;
}

export function FilePreviewModal({ file, onClose, onDelete, onDownload }: FilePreviewModalProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!file) {
        if (active) {
          setUrl(null);
          setTextContent(null);
        }
        return;
      }

      setLoading(true);
      const category = getFileCategory(file);

      if (category === "image") {
        try {
          const signedUrl = await createCharacterImageSignedUrl(file.file_path);
          if (active) {
            setUrl(signedUrl);
            setLoading(false);
          }
        } catch {
          if (active) {
            setLoading(false);
          }
        }
      } else if (file.mime_type?.startsWith("text/") || file.file_name.endsWith(".txt")) {
        try {
          const blob = await downloadWorkspaceFile(file);
          const text = await blob.text();
          if (active) {
            setTextContent(text);
            setLoading(false);
          }
        } catch {
          if (active) {
            setLoading(false);
          }
        }
      } else {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [file]);

  if (!file) return null;

  const category = getFileCategory(file);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 md:p-12"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-5xl h-full flex flex-col bg-[var(--background-app)] border border-[var(--border-ui)] rounded-[32px] overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[var(--border-ui)]/50 shrink-0 bg-[var(--background-surface)]/80 backdrop-blur-md">
            <div className="flex items-center gap-4">
               <div className="p-3 rounded-2xl bg-[var(--background-surface)] border border-[var(--border-ui)] shadow-sm">
                 {category === "image" ? <ImageIcon className="w-6 h-6 text-emerald-500" /> : <FileText className="w-6 h-6 text-emerald-500" />}
               </div>
               <div>
                 <h2 className="text-xl font-bold text-[var(--text-primary)] leading-tight">{file.file_name}</h2>
                 <p className="text-sm text-[var(--text-secondary)] font-medium">{formatBytes(file.file_size)} • {new Date(file.created_at).toLocaleDateString()}</p>
               </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-ui)] transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden relative flex items-center justify-center bg-[var(--background-surface)]/30">
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                <p className="text-sm font-bold text-[var(--text-secondary)] tracking-widest uppercase">Loading Preview</p>
              </div>
            ) : category === "image" && url ? (
              <div className="w-full h-full flex items-center justify-center p-8">
                <img src={url} alt={file.file_name} className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" />
              </div>
            ) : textContent !== null ? (
              <div className="w-full h-full p-8 md:p-12 overflow-y-auto custom-scrollbar bg-white dark:bg-zinc-950 font-mono text-[var(--text-primary)] whitespace-pre-wrap selection:bg-emerald-500/20 text-sm">
                {textContent}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 text-[var(--text-tertiary)]">
                <FileText className="w-24 h-24 opacity-10" />
                <p className="text-lg font-bold">No preview available for this file type</p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-[var(--border-ui)]/50 shrink-0 flex items-center justify-between gap-4 bg-[var(--background-surface)]">
            <Button
              variant="outline"
              className="rounded-full border-[var(--border-ui)] hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50 transition-all font-bold px-6"
              onClick={async () => {
                setIsDeleting(true);
                await onDelete(file);
                setIsDeleting(false);
                onClose();
              }}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete File
            </Button>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="rounded-full border-[var(--border-ui)] hover:bg-[var(--border-ui)] transition-all font-bold px-6"
                onClick={onClose}
              >
                Close
              </Button>
              <Button
                className="rounded-full bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg hover:shadow-emerald-500/25 font-bold px-8"
                onClick={() => onDownload(file)}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function getFileCategory(file: FileRecord) {
  const mime = file.mime_type || "";
  if (mime.startsWith("image/")) return "image";
  if (mime === "application/pdf" || mime.includes("document") || mime.includes("msword") || mime.includes("officedocument")) return "document";
  return "other";
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
