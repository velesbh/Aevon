"use client";

import { DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { type Editor } from "@tiptap/react";
import {
  AlignLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  GripVertical,
  LayoutGrid,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Plus,
  Save,
  Settings2,
  Target,
  Timer,
  Type,
  Image as ImageIcon,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboardWorkspace } from "@/components/dashboard/workspace-provider";
import { useLanguage, useTranslation } from "@/lib/i18n";
import { useSearchParams } from "next/navigation";
import { FileSelectorModal } from "@/components/dashboard/file-selector-modal";
import { RichTextEditor, type RichTextEditorHandle } from "@/components/rich-text/rich-text-editor";
import type { MentionEntity } from "@/components/rich-text/mention-data";
import { RichTextToolbar } from "@/components/rich-text/rich-text-toolbar";
import { createCharacterImageSignedUrl, getChapterText, getChapterSynopsis, type ChapterRecord, requestProjectExport } from "@/lib/workspace";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button as MuiButton,
} from "@mui/material";


function formatRelativeTime(value: string, t: (key: string) => string) {
  const timestamp = new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.floor((Date.now() - timestamp) / 60000));
  if (diffMinutes < 60) return `${diffMinutes}${t("dashboard.time.minute")}`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}${t("dashboard.time.hour")}`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}${t("dashboard.time.day")}`;
}

type ViewMode = "editor" | "outline";

export default function ManuscriptPage() {
  const {
    activeProjectTitle,
    activeProjectId,
    chapters,
    createChapterRecord,
    deleteChapterRecord,
    error: workspaceError,
    loading,
    saveActiveProjectRecord,
    saveChapterRecord,
    uploadFileRecord,
    workspace,
    worldElements,
  } = useDashboardWorkspace();
  const { t } = useTranslation();

  const searchParams = useSearchParams();
  const urlChapterId = searchParams.get("id");

  const [localChapters, setLocalChapters] = useState<ChapterRecord[]>([]);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [synopses, setSynopses] = useState<Record<string, string>>({});
  const [draftTitle, setDraftTitle] = useState("");
  const [focusMode, setFocusMode] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("editor");
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [draggedChapterId, setDraggedChapterId] = useState<string | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [timerDialogOpen, setTimerDialogOpen] = useState(false);
  const [timerInput, setTimerInput] = useState("25");

  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [goalInput, setGoalInput] = useState("2000");
  const [dailyGoal, setDailyGoal] = useState(2000);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; chapterId: string } | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const richTextRef = useRef<RichTextEditorHandle>(null);
  const [isEditing, setIsEditing] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsEditing(false);
      else setIsEditing(true);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  const mentionEntities: MentionEntity[] = useMemo(() => {
    return worldElements
      .filter((el) => ["character", "location", "item", "lore"].includes(el.type))
      .map((element) => ({
        id: element.id,
        label: element.name || "Untitled",
        type: element.type as MentionEntity["type"],
        description: element.description ?? undefined,
        imageUrl: undefined,
        folderId: element.project_id,
        folderName: element.project_id === activeProjectId ? t("manuscript.currentProject") : t("manuscript.otherProjects"),
        folderCategory: element.project_id === activeProjectId ? "active" : "shared",
      }));
  }, [worldElements, activeProjectId, t]);

  useEffect(() => {
    setLocalChapters(chapters);
  }, [chapters]);

  useEffect(() => {
    if (!activeChapterId) {
      const firstChapter = localChapters[0];
      setActiveChapterId(firstChapter?.id ?? null);
      setDraft(firstChapter ? getChapterText(firstChapter.content) : "");
      setDraftTitle(firstChapter?.title ?? "");
      return;
    }

    if (!localChapters.some((chapter) => chapter.id === activeChapterId)) {
      const fallback = localChapters[0];
      setActiveChapterId(fallback?.id ?? null);
      setDraft(fallback ? getChapterText(fallback.content) : "");
      setDraftTitle(fallback?.title ?? "");
    }
  }, [activeChapterId, localChapters]);

  // Load settings from active project
  useEffect(() => {
    if (workspace?.activeProject?.settings) {
      const settings = workspace.activeProject.settings as any;
      if (settings.dailyGoal) {
        setDailyGoal(settings.dailyGoal);
        setGoalInput(settings.dailyGoal.toString());
      }
      if (settings.timerMinutes) {
        setTimerInput(settings.timerMinutes.toString());
        if (!timerActive) {
          setTimeLeft(settings.timerMinutes * 60);
        }
      }
    }
  }, [workspace?.activeProject?.id, workspace?.activeProject?.settings, timerActive]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const activeChapter = useMemo(
    () => localChapters.find((chapter) => chapter.id === activeChapterId) ?? null,
    [activeChapterId, localChapters],
  );

  // Sync with URL ID
  useEffect(() => {
    if (urlChapterId && urlChapterId !== activeChapterId) {
      const chapter = localChapters.find(c => c.id === urlChapterId);
      if (chapter) {
        handleSelectChapter(chapter);
      }
    } else if (!urlChapterId && localChapters.length > 0 && !activeChapterId) {
      // Default to first chapter if no ID in URL and we haven't selected one
      handleSelectChapter(localChapters[0]);
    }
  }, [urlChapterId, localChapters, activeChapterId]);

  const plainTextDraft = draft.replace(/<[^>]+>/g, " ");
  const wordCount = plainTextDraft.trim().split(/\s+/).filter(Boolean).length;
  const charCount = plainTextDraft.length;

  const isDirty = activeChapter
    ? getChapterText(activeChapter.content) !== draft || activeChapter.title !== draftTitle
    : false;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${secs}`;
  };

  const handleSave = async () => {
    if (!activeChapterId || !activeChapter || !isDirty) return;

    setSaving(true);
    setError(null);
    setStatus(null);

    try {
      await saveChapterRecord(activeChapterId, draft, draftTitle);
      setStatus(t("ms.saved"));
      setTimeout(() => setStatus(null), 3000);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t("ms.error.save"));
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!activeChapterId || !isDirty || saving) return;
    const timer = setTimeout(() => {
      handleSave();
    }, 2000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, draftTitle, activeChapterId, isDirty, saving]);

  const handleSelectChapter = (chapter: ChapterRecord) => {
    setActiveChapterId(chapter.id);
    setDraft(getChapterText(chapter.content));
    setDraftTitle(chapter.title);
    setStatus(null);
    setError(null);
  };

  const handleDeleteChapter = async (id: string) => {
    try {
      if (activeChapterId === id) {
        const remaining = localChapters.filter(c => c.id !== id);
        setActiveChapterId(remaining.length > 0 ? remaining[0].id : null);
      }
      if (deleteChapterRecord) {
        await deleteChapterRecord(id);
      }
      setLocalChapters(prev => prev.filter(c => c.id !== id));
      setStatus(t("ms.status.deleted"));
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("ms.error.delete"));
    }
  };

  const handleContextMenu = (e: React.MouseEvent, chapterId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, chapterId });
  };

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  const handleAddChapter = async () => {
    setCreating(true);
    setError(null);
    setStatus(null);
    try {
      const chapter = await createChapterRecord();
      setActiveChapterId(chapter.id);
      setDraft("");
      setDraftTitle(chapter.title);
      setStatus(t("ms.status.created"));
      setTimeout(() => setStatus(null), 3000);
      if (focusMode) setFocusMode(false);
      if (viewMode === "outline") setViewMode("editor");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : t("ms.error.create"));
    } finally {
      setCreating(false);
    }
  };

  const handleDragStart = (event: DragEvent<HTMLDivElement>, id: string) => {
    setDraggedChapterId(id);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>, targetId: string) => {
    event.preventDefault();
    if (!draggedChapterId || draggedChapterId === targetId) return;

    const reordered = [...localChapters];
    const draggedIndex = reordered.findIndex((chapter) => chapter.id === draggedChapterId);
    const targetIndex = reordered.findIndex((chapter) => chapter.id === targetId);
    const [draggedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, draggedItem);
    setLocalChapters(reordered);
    setDraggedChapterId(null);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setStatus(t("ms.status.uploading"));
    try {
      const uploadedFile = await uploadFileRecord(file);
      const url = await createCharacterImageSignedUrl(uploadedFile.file_path);
      if (url) {
        richTextRef.current?.insertImage(url);
        setStatus(t("ms.status.inserted"));
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : t("ms.error.upload"));
    } finally {
      setTimeout(() => setStatus(null), 3000);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleExportChapter = async () => {
    if (!activeProjectId || !activeChapterId) return;
    setStatus("Exporting chapter...");
    try {
      const { blob, fileName } = await requestProjectExport(activeProjectId, "docx", {
        includeManuscript: [activeChapterId],
        includeTitlePage: false,
        includeTableOfContents: false,
        includeCharacters: false,
        includeLocations: false,
        includeLore: false,
        includeItems: false,
        includeIdeas: false,
        standardManuscriptFormat: true
      });

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
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export chapter");
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--background-app)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
      </div>
    );
  }

  const isOutlineView = viewMode === "outline";

  return (

    <div className="flex h-full w-full bg-[var(--background-app)] overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative h-full">
        {/* Top Toolbar */}
        {!focusMode && (
          <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="h-14 border-b border-[var(--border-ui)] bg-[var(--background-surface)] flex items-center justify-between px-4 z-10 shrink-0"
          >
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border-ui)] bg-[var(--background-app)]">
                <BookOpen size={14} className="text-green-600" />
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {t("dashboard.nav.manuscript")}
                </span>
                <span className="text-[var(--text-tertiary)] mx-1">/</span>
                <span className="text-sm text-[var(--text-secondary)] truncate max-w-[150px]">
                  {activeChapter?.title || t("manuscript.chapter.untitled")}
                </span>
              </div>
              <div className="flex items-center bg-[var(--background-app)] rounded-full p-0.5 border border-[var(--border-ui)]">
                <button
                  onClick={() => setViewMode("editor")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all",
                    !isOutlineView
                      ? "bg-white dark:bg-zinc-800 text-[var(--text-primary)] shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <Type size={12} />
                  {t("manuscript.view.editor")}
                </button>
                <button
                  onClick={() => setViewMode("outline")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all",
                    isOutlineView
                      ? "bg-white dark:bg-zinc-800 text-[var(--text-primary)] shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <LayoutGrid size={12} />
                  {t("manuscript.view.outline")}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!isOutlineView && (
                <>
                  {editorInstance && (
                    <div className="hidden md:flex items-center border-r border-[var(--border-ui)] pr-3 mr-1">
                      <RichTextToolbar 
                        editor={editorInstance} 
                        onOpenImagePicker={() => setIsImageModalOpen(true)}
                        className="flex items-center gap-1"
                        variant="ghost"
                      />
                    </div>
                  )}
                  {isMobile && (
                    <Button
                      variant={isEditing ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                      className={cn(
                        "rounded-full px-4 font-semibold transition-all",
                        isEditing 
                          ? "bg-[var(--primary)] hover:opacity-90 text-white shadow-md active:scale-95" 
                          : "border-[var(--border-ui)] text-[var(--primary)] hover:bg-[var(--background-app)]"
                      )}
                    >
                      {isEditing ? t("ms.done") : t("ms.edit")}
                    </Button>
                  )}
                  <button 
                    onClick={() => setGoalDialogOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--background-app)] border border-[var(--border-ui)] hover:bg-[var(--background-surface-hover)] transition-colors"
                  >
                    <Target className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-xs font-medium text-[var(--text-primary)]">
                      {wordCount} / {dailyGoal >= 1000 ? `${(dailyGoal / 1000).toFixed(1).replace('.0', '')}k` : dailyGoal}
                    </span>
                    <div className="hidden sm:block w-16 h-1.5 bg-[var(--border-ui)] rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${Math.min(100, (wordCount / dailyGoal) * 100)}%` }} />
                    </div>
                  </button>
                  
                  {!isMobile && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleExportChapter}
                        className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        title={t("manuscript.export_chapter") || "Export Chapter"}
                      >
                        <Download size={18} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setFocusMode(true)}
                        className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        title={t("manuscript.focus.enter")}
                      >
                        <Maximize2 size={18} />
                      </Button>
                    </>
                  )}
                </>
              )}
              
            </div>
          </motion.header>
        )}

        {/* Scrollable Workspace */}
        <div className="flex-1 overflow-y-auto bg-[#f2f4f6] dark:bg-[#0c0c0c] relative scroll-smooth">
          {/* Focus Mode Exit Button */}
          <AnimatePresence>
            {focusMode && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed top-6 right-6 z-50"
              >
                <Button
                  onClick={() => setFocusMode(false)}
                  className="bg-black/75 hover:bg-black/90 text-white backdrop-blur-md shadow-lg rounded-full px-4"
                >
                  <Minimize2 size={16} className="mr-2" />
                  {t("manuscript.focus.exit")}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {isOutlineView ? (
            <div className="max-w-6xl mx-auto p-8">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">{t("manuscript.outline.title")}</h1>
                <p className="text-[var(--text-secondary)]">{t("manuscript.outline.description")}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {localChapters.map((chapter, idx) => (
                  <div key={chapter.id} className="bg-[var(--background-surface)] rounded-xl border border-[var(--border-ui)] shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="bg-[var(--background-app)] px-2 py-1 rounded text-xs font-semibold text-[var(--text-secondary)] border border-[var(--border-ui)]">
                        {t("manuscript.chapter.label")} {idx + 1}
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2">
                        <MoreHorizontal size={14} />
                      </Button>
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2 line-clamp-1">
                      {chapter.title || t("manuscript.chapter.untitled")}
                    </h3>
                    <div className="flex-1">
                      <textarea
                        placeholder={t("manuscript.chapter.synopsis_placeholder")}
                        className="w-full text-sm bg-transparent resize-none focus:outline-none text-[var(--text-secondary)] min-h-[80px]"
                      />
                    </div>
                    <div className="mt-4 pt-4 border-t border-[var(--border-ui)] flex items-center justify-between">
                      <span className="text-xs text-[var(--text-tertiary)]">{chapter.word_count} {t("manuscript.words_suffix")}</span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                        onClick={() => {
                          handleSelectChapter(chapter);
                          setViewMode("editor");
                        }}
                      >
                        {t("ms.open_editor")}
                      </Button>
                    </div>
                  </div>
                ))}
                
                <button
                  onClick={handleAddChapter}
                  className="flex flex-col items-center justify-center min-h-[200px] rounded-xl border-2 border-dashed border-[var(--border-ui)] hover:border-green-500 hover:bg-green-50/50 dark:hover:bg-green-900/10 transition-colors group"
                >
                  <div className="h-10 w-10 rounded-full bg-[var(--background-app)] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Plus size={20} className="text-[var(--text-secondary)] group-hover:text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-green-600">
                    {t("ms.add_chapter")}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="min-h-full py-12 px-4 flex flex-col items-center">
              {activeChapter ? (
                <div 
                  className={cn(
                    "w-full max-w-[816px] bg-[var(--background-surface)] shadow-lg transition-all duration-300 relative",
                    "min-h-[1056px]", // approx 11 inches
                    focusMode ? "shadow-2xl scale-[1.02]" : ""
                  )}
                >
                  {/* Page Margins / Content Container */}
                  <div className="px-12 py-16 md:px-24 md:py-24">
                    <input
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      placeholder={t("ms.chapter_title_placeholder")}
                      readOnly={!isEditing}
                      className={cn(
                        "w-full text-center font-serif text-4xl font-bold bg-transparent border-none focus:outline-none placeholder:text-[var(--text-tertiary)] mb-12 text-[var(--text-primary)]",
                        !isEditing && "cursor-default"
                      )}
                    />
                    
                    <RichTextEditor
                      key={activeChapterId || "empty"}
                      ref={richTextRef}
                      value={draft}
                      onChange={setDraft}
                      readOnly={!isEditing}
                      mentionItems={mentionEntities}
                      placeholder={t("ms.startWriting")}
                      onOpenImagePicker={() => setIsImageModalOpen(true)}
                      variant="manuscript"
                      showToolbar={false}
                      onEditorReady={setEditorInstance}
                      minHeight="600px"
                      className={cn("w-full transition-all duration-300", !isEditing && "opacity-95")}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[50vh] text-center max-w-md">
                  <div className="h-16 w-16 bg-[var(--border-ui)]/30 rounded-2xl flex items-center justify-center mb-6">
                    <FileText size={32} className="text-[var(--text-secondary)]" />
                  </div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">{t("ms.readyToWrite")}</h2>
                  <p className="text-[var(--text-secondary)] mb-6">{t("ms.selectChapter")}</p>
                  <Button onClick={handleAddChapter} className="bg-green-600 hover:bg-green-700 text-white">
                    <Plus size={16} className="mr-2" />
                    {t("ms.createFirst")}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Status Bar - Editor Only */}
        {!isOutlineView && !focusMode && (
          <div className="h-9 border-t border-[var(--border-ui)] bg-[var(--background-surface)] flex items-center justify-between px-4 text-xs text-[var(--text-secondary)] shrink-0 z-10">
            <div className="flex items-center gap-4">
              <span className="hover:text-[var(--text-primary)] cursor-pointer flex items-center gap-1.5">
                <Settings2 size={12} />
                {t("ms.normal_text")}
              </span>
              <div className="h-3 w-px bg-[var(--border-ui)]" />
              <span className="flex items-center gap-1.5">
                <Timer size={12} />
                <button onClick={() => setTimerDialogOpen(true)} className="hover:text-[var(--text-primary)] transition-colors">
                  {formatTime(timeLeft)}
                </button>
                <div className="h-3 w-px bg-[var(--border-ui)] mx-0.5" />
                <button 
                  onClick={() => setTimerActive(!timerActive)}
                  className="font-semibold text-[var(--text-primary)] hover:underline"
                >
                  {timerActive ? t("ms.timer.pause") : t("ms.timer.start")}
                </button>
              </span>
            </div>
            
            <div className="flex items-center gap-4">
               {status && !saving && (
                <span className="text-[var(--primary)] font-medium animate-pulse flex items-center gap-1.5">
                  {status}
                </span>
              )}
              {saving && (
                <span className="text-[var(--primary)] font-medium flex items-center gap-1.5">
                  <RefreshCw size={14} className="animate-spin" />
                  Saving...
                </span>
              )}
              {error && (
                <span className="text-red-600 font-medium flex items-center gap-1.5">
                  {error}
                </span>
              )}
              <div className="flex items-center gap-3">
                <span>{wordCount} {t("manuscript.words_suffix")}</span>
                <span>{charCount} {t("ms.chars")}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: "none" }}
      />
      <FileSelectorModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        onSelect={async (filePath) => {
          const url = await createCharacterImageSignedUrl(filePath);
          if (url) {
            richTextRef.current?.insertImage(url);
          }
          setIsImageModalOpen(false);
        }}
        onUploadClick={() => fileInputRef.current?.click()}
      />

      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-[100] bg-[var(--background-app)] border border-[var(--border-ui)] shadow-xl rounded-lg py-1 min-w-[160px]"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button
              onClick={() => {
                const chapter = localChapters.find(c => c.id === contextMenu.chapterId);
                if (chapter) {
                  handleSelectChapter(chapter);
                  setViewMode("editor");
                }
                setContextMenu(null);
              }}
              className="w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--background-surface)] transition-colors"
            >
              {t("ms.open_editor") || "Open Editor"}
            </button>
            <button
              onClick={() => {
                handleDeleteChapter(contextMenu.chapterId);
                setContextMenu(null);
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              {t("ms.action.delete_chapter") || "Delete Chapter"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={timerDialogOpen} onClose={() => setTimerDialogOpen(false)}>
        <DialogTitle>{t("ms.timer.set_title") || "Set Timer"}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t("ms.timer.minutes") || "Minutes"}
            type="number"
            fullWidth
            value={timerInput}
            onChange={(e) => setTimerInput(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={() => setTimerDialogOpen(false)}>{t("common.cancel") || "Cancel"}</MuiButton>
          <MuiButton onClick={async () => {
            const val = parseInt(timerInput, 10);
            if (!isNaN(val) && val > 0) {
              setTimeLeft(val * 60);
              setTimerDialogOpen(false);
              // Persist setting
              const currentSettings = (workspace?.activeProject?.settings as any) || {};
              await saveActiveProjectRecord({
                settings: { ...currentSettings, timerMinutes: val }
              });
            }
          }} variant="contained" color="success">
            {t("common.save") || "Save"}
          </MuiButton>
        </DialogActions>
      </Dialog>

      <Dialog open={goalDialogOpen} onClose={() => setGoalDialogOpen(false)}>
        <DialogTitle>{t("ms.goal.set_title") || "Set Writing Goal"}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t("ms.goal.words") || "Word count goal"}
            type="number"
            fullWidth
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={() => setGoalDialogOpen(false)}>{t("common.cancel") || "Cancel"}</MuiButton>
          <MuiButton onClick={async () => {
            const val = parseInt(goalInput, 10);
            if (!isNaN(val) && val > 0) {
              setDailyGoal(val);
              setGoalDialogOpen(false);
              // Persist setting
              const currentSettings = (workspace?.activeProject?.settings as any) || {};
              await saveActiveProjectRecord({
                settings: { ...currentSettings, dailyGoal: val }
              });
            }
          }} variant="contained" color="success">
            {t("common.save") || "Save"}
          </MuiButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}
