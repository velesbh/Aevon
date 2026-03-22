"use client";

import { DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { type Editor } from "@tiptap/react";
import {
  AlignLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboardWorkspace } from "@/components/dashboard/workspace-provider";
import { useLanguage, useTranslation } from "@/lib/i18n";
import { FileSelectorModal } from "@/components/dashboard/file-selector-modal";
import { RichTextEditor, type MentionEntity, type RichTextEditorHandle } from "@/components/rich-text/rich-text-editor";
import { RichTextToolbar } from "@/components/rich-text/rich-text-toolbar";
import { createCharacterImageSignedUrl, getChapterText, getChapterSynopsis, type ChapterRecord } from "@/lib/workspace";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
    chapters,
    createChapterRecord,
    deleteChapterRecord,
    error: workspaceError,
    loading,
    saveChapterRecord,
    uploadFileRecord,
    worldElements,
  } = useDashboardWorkspace();
  const { t } = useTranslation();

  const [localChapters, setLocalChapters] = useState<ChapterRecord[]>([]);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [synopses, setSynopses] = useState<Record<string, string>>({});
  const [draftTitle, setDraftTitle] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("editor");
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [draggedChapterId, setDraggedChapterId] = useState<string | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; chapterId: string } | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const richTextRef = useRef<RichTextEditorHandle>(null);

  const mentionEntities: MentionEntity[] = useMemo(() => {
    return worldElements
      .filter((el) => ["character", "location", "item", "lore"].includes(el.type))
      .map((element) => ({
        id: element.id,
        label: element.name || "Untitled",
        type: element.type as MentionEntity["type"],
        description: element.description ?? undefined,
      }));
  }, [worldElements]);

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
      {/* Sidebar / Navigator */}
      <AnimatePresence initial={false} mode="wait">
        {sidebarOpen && !focusMode && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="flex flex-col border-r border-[var(--border-ui)] bg-[var(--background-surface)] z-20"
          >
            <div className="h-14 flex items-center justify-between px-4 border-b border-[var(--border-ui)] shrink-0">
              <div className="flex flex-col overflow-hidden mr-2">
                <span className="text-sm font-semibold truncate text-[var(--text-primary)]">
                  {t("dashboard.nav.manuscript")}
                </span>
                <span className="text-xs text-[var(--text-tertiary)] truncate">
                  {activeProjectTitle ?? t("ms.noProject")}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                onClick={handleAddChapter}
                disabled={creating}
              >
                {creating ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
              {localChapters.length > 0 ? (
                <div className="space-y-1 px-2">
                  {localChapters.map((chapter) => {
                    const isActive = chapter.id === activeChapterId;
                    const isDragged = draggedChapterId === chapter.id;

                    return (
                      <div
                        key={chapter.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, chapter.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, chapter.id)}
                        onClick={() => handleSelectChapter(chapter)}
                        onContextMenu={(e) => handleContextMenu(e, chapter.id)}
                        className={cn(
                          "group relative flex items-start gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-colors border border-transparent",
                          isActive
                            ? "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400"
                            : "hover:bg-[var(--background-surface-hover)] text-[var(--text-secondary)]",
                          isDragged && "opacity-50"
                        )}
                      >
                        <div className="mt-1 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                          <GripVertical size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className={cn("text-sm font-medium truncate", isActive ? "text-[var(--text-primary)]" : "")}>
                              {chapter.title || t("ms.untitled")}
                            </span>
                            <span className="text-[10px] text-[var(--text-tertiary)] shrink-0">
                              {formatRelativeTime(chapter.updated_at, t)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-[var(--text-tertiary)]">
                              <BookOpen size={10} />
                              <span className="text-[10px]">{chapter.word_count} {t("ms.words_abbr")}</span>
                            </div>
                            {isActive && isDirty && (
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 ml-auto" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <FileText className="h-8 w-8 text-[var(--text-tertiary)] mb-3" />
                  <p className="text-sm text-[var(--text-secondary)] mb-4">{t("ms.noChapters")}</p>
                  <Button onClick={handleAddChapter} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                    {t("ms.createFirst")}
                  </Button>
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <AlignLeft size={18} />
              </Button>
              <div className="h-4 w-px bg-[var(--border-ui)] mx-1" />
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
              {!isOutlineView && editorInstance && (
                <div className="hidden lg:block mr-2">
                   <RichTextToolbar 
                     editor={editorInstance} 
                     onOpenImagePicker={() => setIsImageModalOpen(true)}
                     className="border-none shadow-none bg-transparent" 
                   />
                </div>
              )}
              
              {!isOutlineView && (
                <>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--background-app)] border border-[var(--border-ui)]">
                    <Target className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-xs font-medium text-[var(--text-primary)]">1,240 / 2k</span>
                    <div className="w-16 h-1.5 bg-[var(--border-ui)] rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 w-[62%]" />
                    </div>
                  </div>
                  
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
            <div className="min-h-full py-12 px-4 flex justify-center">
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
                      className="w-full text-center font-serif text-4xl font-bold bg-transparent border-none focus:outline-none placeholder:text-[var(--text-tertiary)] mb-12 text-[var(--text-primary)]"
                    />
                    
                    <RichTextEditor
                      key={activeChapterId || "empty"}
                      ref={richTextRef}
                      value={draft}
                      onChange={setDraft}
                      mentionItems={mentionEntities}
                      placeholder={t("ms.startWriting")}
                      onOpenImagePicker={() => setIsImageModalOpen(true)}
                      variant="manuscript"
                      showToolbar={false}
                      onEditorReady={setEditorInstance}
                      minHeight="600px"
                      className="w-full"
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
                {formatTime(timeLeft)}
                <button 
                  onClick={() => setTimerActive(!timerActive)}
                  className="ml-1 font-semibold text-[var(--text-primary)] hover:underline"
                >
                  {timerActive ? t("ms.timer.pause") : t("ms.timer.start")}
                </button>
              </span>
            </div>
            
            <div className="flex items-center gap-4">
               {status && (
                <span className="text-green-600 font-medium animate-pulse">
                  {status}
                </span>
              )}
              {error && (
                <span className="text-red-600 font-medium">
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
    </div>
  );
}
