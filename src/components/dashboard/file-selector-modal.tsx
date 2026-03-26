"use client";

import { useEffect, useState, useRef } from "react";
import { X, Search, Image as ImageIcon, UploadCloud, Loader2 } from "lucide-react";
import { useDashboardWorkspace } from "./workspace-provider";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { createCharacterImageSignedUrl } from "@/lib/workspace";

interface FileSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (filePath: string) => void;
  onUploadClick?: () => void;
  title?: string;
}

function FileThumbnail({ filePath, fileName }: { filePath: string; fileName: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!filePath) {
      if (active) {
        setUrl(null);
        setLoading(false);
      }
      return;
    }

    createCharacterImageSignedUrl(filePath)
      .then((signedUrl) => {
        if (active) {
          setUrl(signedUrl);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setUrl(null);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [filePath]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[var(--background-surface)]">
        <Loader2 className="w-4 h-4 animate-spin text-[var(--text-tertiary)]" />
      </div>
    );
  }

  if (!url) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[var(--background-surface)]">
        <ImageIcon className="w-6 h-6 text-[var(--text-tertiary)] opacity-50" />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={fileName}
      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
    />
  );
}

export function FileSelectorModal({
  isOpen,
  onClose,
  onSelect,
  onUploadClick,
  title = "Select Image",
}: FileSelectorModalProps) {
  const { files, uploadFileRecord } = useDashboardWorkspace();
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const imageFiles = files.filter((file) => file.mime_type?.startsWith("image/"));

  const filteredFiles = imageFiles.filter((file) =>
    file.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-3xl flex flex-col bg-[var(--background-app)] border border-[var(--border-ui)] rounded-[24px] shadow-2xl overflow-hidden max-h-full"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[var(--border-ui)]/50 bg-[var(--background-surface)]/80 backdrop-blur-md shrink-0">
            <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-ui)]/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search & Actions */}
          <div className="p-6 border-b border-[var(--border-ui)]/50 shrink-0 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search uploaded images..."
                className="w-full bg-[var(--background-surface)] border border-[var(--border-ui)] rounded-full py-2.5 pl-10 pr-4 text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 focus:ring-2 focus:ring-[var(--primary)]/20 transition-all placeholder:text-[var(--text-tertiary)]"
              />
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,text/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setIsUploading(true);
                try {
                  const record = await uploadFileRecord(file);
                  onSelect(record.file_path);
                  onClose();
                } catch (err) {
                  console.error("Failed to upload file", err);
                } finally {
                  setIsUploading(false);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }
              }}
            />
            <button
              disabled={isUploading}
              onClick={() => {
                if (onUploadClick) {
                  onClose();
                  onUploadClick();
                } else {
                  fileInputRef.current?.click();
                }
              }}
              className="flex items-center gap-2 rounded-full bg-[var(--primary)] hover:opacity-90 text-white px-5 py-2.5 text-sm font-bold tracking-wide transition-all active:scale-95 shadow-md shrink-0 disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
              <span>{isUploading ? "Uploading..." : "Upload New"}</span>
            </button>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar min-h-[300px]">
            {(filteredFiles?.length ?? 0) > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {(filteredFiles ?? []).map((file) => (
                  <button
                    key={file.id}
                    onClick={() => {
                      onSelect(file.file_path);
                      onClose();
                    }}
                    className="group flex flex-col items-center gap-2 text-left"
                  >
                    <div className="w-full aspect-square rounded-[16px] border border-[var(--border-ui)] bg-[var(--background-surface)] overflow-hidden relative shadow-sm group-hover:shadow-md group-hover:border-[var(--border-ui-hover)] transition-all duration-300">
                      <FileThumbnail filePath={file.file_path} fileName={file.file_name} />
                    </div>
                    <span className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] line-clamp-1 w-full text-center transition-colors">
                      {file.file_name}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-[var(--text-tertiary)] space-y-4 py-12">
                <ImageIcon className="w-16 h-16 opacity-20" />
                <p className="text-sm font-medium">
                  {searchQuery ? "No matching images found" : "No images in workspace"}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
