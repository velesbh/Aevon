"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { Loader2, Plus, Save, Search, Trash2, LayoutGrid, List as ListIcon, ChevronLeft, Image as ImageIcon, ScrollText, Upload } from "lucide-react";
import { useDashboardWorkspace } from "@/components/dashboard/workspace-provider";
import { cn } from "@/lib/utils";
import { getAttributeText, type WorldElementRecord, createCharacterImageSignedUrl } from "@/lib/workspace";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/lib/i18n";
import { FileSelectorModal } from "@/components/dashboard/file-selector-modal";
import { useRouter } from "next/navigation";
import { RichTextEditor } from "@/components/rich-text/rich-text-editor";
import type { MentionEntity } from "@/components/rich-text/mention-data";
import { LoreDiagramEditor } from "@/components/dashboard/lore-diagram-editor";

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.floor((Date.now() - timestamp) / 60000));
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

function LoreGridCard({
  element,
  onClick,
}: {
  element: WorldElementRecord;
  onClick: () => void;
}) {
  const diagramUrl = getAttributeText(element.attributes, "diagram_image_url");
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (diagramUrl) {
      if (diagramUrl.startsWith("http") || diagramUrl.startsWith("data:")) {
        setSignedUrl(diagramUrl);
      } else {
        createCharacterImageSignedUrl(diagramUrl)
          .then(setSignedUrl)
          .catch(() => setSignedUrl(null));
      }
    } else {
      setSignedUrl(null);
    }
  }, [diagramUrl]);

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer flex flex-col rounded-2xl border border-[var(--border-ui)] bg-[var(--background-app)] overflow-hidden shadow-sm hover:shadow-md hover:border-[var(--border-ui-hover)] transition-all duration-200 relative h-[280px]"
    >
      <div className="h-32 bg-[var(--background-surface)] border-b border-[var(--border-ui)]/50 flex items-center justify-center relative overflow-hidden">
        {signedUrl ? (
          <img src={signedUrl} alt={element.name} className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="w-8 h-8 text-[var(--text-tertiary)] opacity-30 group-hover:scale-110 transition-transform duration-300" />
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-2">
          <span className="text-xs font-medium text-[var(--text-secondary)] bg-[var(--background-surface)] px-2 py-0.5 rounded-md border border-[var(--border-ui)]">
            {getAttributeText(element.attributes, "category") || "Uncategorized"}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2 line-clamp-1 transition-colors">
          {element.name || "Untitled"}
        </h3>
        <p className="text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed flex-1">
          {element.description || "No description provided."}
        </p>
      </div>
    </div>
  );
}

export default function LorePage() {
  const {
    activeProjectTitle,
    createWorldElementRecord,
    deleteWorldElementRecord,
    error: workspaceError,
    loading,
    saveWorldElementRecord,
    worldElements,
    uploadFileRecord,
  } = useDashboardWorkspace();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"split" | "grid">("split");
  const router = useRouter();
  
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredElements = useMemo(() => {
    return (worldElements ?? []).filter((element) => {
      if (element.type !== "lore") {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const nameMatch = element.name.toLowerCase().includes(normalizedQuery);
      const descriptionMatch = (element.description?.toLowerCase() ?? "").includes(normalizedQuery);
      return nameMatch || descriptionMatch;
    });
  }, [normalizedQuery, worldElements]);

  const selectedElement = useMemo(
    () => filteredElements.find((el) => el.id === selectedElementId) ?? null,
    [filteredElements, selectedElementId],
  );

  const [entryDraft, setEntryDraft] = useState<Partial<
    Pick<WorldElementRecord, "name" | "description"> & { attributes: { [key: string]: string } }
  > | null>(null);

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
        folderName: element.project_id === selectedElement?.project_id ? t("lore.currentProject") : t("lore.otherProjects"),
        folderCategory: element.project_id === selectedElement?.project_id ? "active" : "shared",
      }));
  }, [worldElements, selectedElement?.project_id, t]);

  const [selectorOpen, setSelectorOpen] = useState(false);
  const [diagramImageUrl, setDiagramImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    const url = entryDraft?.attributes?.diagram_image_url;
    if (!url) {
      if (active) setDiagramImageUrl(null);
      return;
    }
    
    if (url.startsWith("http") || url.startsWith("data:")) {
      if (active) setDiagramImageUrl(url);
    } else {
      createCharacterImageSignedUrl(url).then(signed => {
        if (active) setDiagramImageUrl(signed);
      }).catch(() => {
        if (active) setDiagramImageUrl(null);
      });
    }
    return () => { active = false; };
  }, [entryDraft?.attributes?.diagram_image_url]);

  useEffect(() => {
    if (selectedElement) {
      setEntryDraft({
        name: selectedElement.name,
        description: selectedElement.description ?? "",
        attributes: { 
          category: getAttributeText(selectedElement.attributes, "category"),
          system: getAttributeText(selectedElement.attributes, "system"),
          rules: getAttributeText(selectedElement.attributes, "rules"),
          limitations: getAttributeText(selectedElement.attributes, "limitations"),
          history: getAttributeText(selectedElement.attributes, "history"),
          key_figures: getAttributeText(selectedElement.attributes, "key_figures"),
          diagram_image_url: getAttributeText(selectedElement.attributes, "diagram_image_url"),
          diagram_data: getAttributeText(selectedElement.attributes, "diagram_data"),
        },
      });
    } else {
      setEntryDraft(null);
    }
  }, [selectedElement]);

  useEffect(() => {
    if (!selectedElement && filteredElements.length > 0 && window.innerWidth > 768 && viewMode === "split") {
      setSelectedElementId(filteredElements[0].id);
    }
  }, [filteredElements, selectedElement, viewMode]);

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    setStatus(null);

    try {
      const created = await createWorldElementRecord("lore");
      setSelectedElementId(created.id);
      setViewMode("split"); 
      setStatus(t("lore.created"));
      setTimeout(() => setStatus(null), 3000);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : t("world.entryCreateError"));
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async () => {
    if (!selectedElementId || !entryDraft) {
      return;
    }

    setSaving(true);
    setError(null);
    setStatus(null);

    try {
      await saveWorldElementRecord(selectedElementId, {
        name: entryDraft.name,
        description: entryDraft.description,
        attributes: { ...(typeof selectedElement?.attributes === 'object' && selectedElement?.attributes !== null ? selectedElement.attributes : {}), ...(typeof entryDraft.attributes === 'object' && entryDraft.attributes !== null ? entryDraft.attributes : {}) },
      });
      setStatus(t("world.entrySaved"));
      setTimeout(() => setStatus(null), 3000);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t("world.entrySaveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedElementId) {
      return;
    }

    setDeleting(true);
    setError(null);
    setStatus(null);

    try {
      await deleteWorldElementRecord(selectedElementId);
      setStatus(t("world.entryDeleted"));
      setSelectedElementId(null);
      setTimeout(() => setStatus(null), 3000);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : t("world.entryDeleteError"));
    } finally {
      setDeleting(false);
    }
  };

  const handleFieldChange = (field: "name" | "description", value: string) => {
    setEntryDraft((current) => (current ? { ...current, [field]: value } : current));
  };

  const handleAttributeChange = (key: string, value: string) => {
    setEntryDraft((current) => (current ? { ...current, attributes: { ...(current.attributes || {}), [key]: value } } : current));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    try {
      const file = e.target.files[0];
      const uploadedFile = await uploadFileRecord(file);
      if (uploadedFile) {
        handleAttributeChange("diagram_image_url", uploadedFile.file_path);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image.");
    }
  };

  const isDirty = useMemo(() => {
    if (!selectedElement || !entryDraft) {
      return false;
    }
    return (
      selectedElement.name !== entryDraft.name ||
      (selectedElement.description ?? "") !== entryDraft.description ||
      getAttributeText(selectedElement.attributes, "category") !== entryDraft.attributes?.category ||
      getAttributeText(selectedElement.attributes, "system") !== entryDraft.attributes?.system ||
      getAttributeText(selectedElement.attributes, "rules") !== entryDraft.attributes?.rules ||
      getAttributeText(selectedElement.attributes, "limitations") !== entryDraft.attributes?.limitations ||
      getAttributeText(selectedElement.attributes, "history") !== entryDraft.attributes?.history ||
      getAttributeText(selectedElement.attributes, "key_figures") !== entryDraft.attributes?.key_figures ||
      getAttributeText(selectedElement.attributes, "diagram_image_url") !== entryDraft.attributes?.diagram_image_url ||
      getAttributeText(selectedElement.attributes, "diagram_data") !== entryDraft.attributes?.diagram_data
    );
  }, [selectedElement, entryDraft]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--background-surface)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[var(--background-surface)] overflow-hidden">
      <header className="flex flex-col border-b border-[var(--border-ui)]/50 shrink-0 bg-[var(--background-surface)]/80 backdrop-blur-md z-10">
        <div className="flex items-center justify-between px-4 md:px-8 py-4">
          <div className="flex items-center gap-3">
             <ScrollText className="w-5 h-5 text-[var(--text-secondary)]" />
             <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
               {t("lore.title")}
             </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center bg-[var(--background-app)] p-1 rounded-full border border-[var(--border-ui)] shadow-sm">
              <button
                onClick={() => setViewMode("split")}
                className={cn("p-2 rounded-full transition-colors", viewMode === "split" ? "bg-[var(--background-surface)] text-[var(--primary)] shadow-sm" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]")}
                title="Split View"
              >
                <ListIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setViewMode("grid"); setSelectedElementId(null); }}
                className={cn("p-2 rounded-full transition-colors", viewMode === "grid" ? "bg-[var(--background-surface)] text-[var(--primary)] shadow-sm" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]")}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex min-h-0 bg-[var(--background-surface)] relative overflow-hidden">
        {viewMode === "grid" && (
          <div className="absolute inset-0 z-20 bg-[var(--background-surface)] overflow-y-auto custom-scrollbar p-6 md:p-10">
            <div className="flex items-center justify-between mb-8 max-w-[1400px] mx-auto">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={t("lore.searchPlaceholder")}
                  className="w-full bg-[var(--background-app)] border border-[var(--border-ui)] rounded-full py-3 pl-12 pr-4 text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 focus:ring-2 focus:ring-[var(--primary)]/20 transition-all shadow-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="flex items-center gap-2 rounded-full bg-[var(--primary)] hover:opacity-90 text-white px-6 py-3 text-sm font-bold tracking-wide transition-all active:scale-95 shadow-md ml-4 shrink-0"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                <span className="hidden sm:inline">{t("lore.add")}</span>
              </button>
            </div>

            {filteredElements.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 max-w-[1400px] mx-auto">
                {filteredElements.map((element) => (
                  <LoreGridCard
                    key={element.id}
                    element={element}
                    onClick={() => {
                      setSelectedElementId(element.id);
                      setViewMode("split");
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="px-6 py-24 text-center flex flex-col items-center gap-4 text-[var(--text-tertiary)]">
                <ScrollText className="w-16 h-16 opacity-20" />
                <span className="text-base font-bold text-[var(--text-secondary)]">{searchQuery ? "No matching lore entries" : "No lore entries found"}</span>
              </div>
            )}
          </div>
        )}

        {viewMode === "split" && (
          <>
            <section className={cn(
              "w-full md:w-[320px] lg:w-[380px] flex flex-col border-r border-[var(--border-ui)] bg-[var(--background-app)] shrink-0 shadow-[2px_0_20px_rgba(0,0,0,0.02)] absolute md:relative inset-y-0 z-10 transition-transform duration-300",
              selectedElementId ? "-translate-x-full md:translate-x-0" : "translate-x-0"
            )}>
              <div className="p-4 border-b border-[var(--border-ui)]/50 shrink-0 flex items-center gap-3 bg-[var(--background-surface)]">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search lore..."
                    className="w-full bg-[var(--background-app)] border border-[var(--border-ui)] rounded-full py-2.5 pl-10 pr-4 text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 focus:ring-2 focus:ring-[var(--primary)]/20 transition-all placeholder:text-[var(--text-tertiary)]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--primary)] hover:opacity-90 text-white transition-all active:scale-95 shadow-md disabled:opacity-50 shrink-0"
                >
                  {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 custom-scrollbar space-y-1.5 pb-20 md:pb-3">
                {filteredElements.length > 0 ? (
                  filteredElements.map((element) => {
                    const isActive = selectedElementId === element.id;
                    return (
                      <button
                        key={element.id}
                        onClick={() => {
                          setSelectedElementId(element.id);
                          setError(null);
                          setStatus(null);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-[16px] text-left transition-all border group",
                          isActive
                            ? "bg-[var(--background-surface)] border-[var(--primary)]/30 shadow-sm text-[var(--primary)]"
                            : "border-transparent text-[var(--text-secondary)] hover:bg-[var(--background-surface)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-[var(--border-ui)] hover:text-[var(--text-primary)]"
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className={cn("text-sm font-bold truncate pr-2 group-hover:text-[var(--text-primary)]", isActive && "text-[var(--text-primary)]")}>
                              {element.name || t("common.untitled")}
                            </span>
                            <span className="text-[10px] font-medium text-[var(--text-tertiary)] shrink-0 tabular-nums">
                              {formatRelativeTime(element.updated_at)}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-[11px] font-medium text-[var(--text-tertiary)] truncate block">
                              {getAttributeText(element.attributes, "category") || "Uncategorized"}
                            </span>
                            {getAttributeText(element.attributes, "system") && (
                              <span className="text-[11px] font-medium text-[var(--text-tertiary)] truncate block">
                                • {getAttributeText(element.attributes, "system")}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="px-6 py-12 text-center flex flex-col items-center gap-3 text-[var(--text-tertiary)]">
                    <ScrollText className="w-10 h-10 opacity-20" />
                    <span className="text-sm font-medium">{searchQuery ? "No matching entries" : "No entries found"}</span>
                  </div>
                )}
              </div>
            </section>

            <section className={cn(
              "flex-1 flex flex-col min-w-0 bg-[var(--background-surface)] relative transition-transform duration-300 absolute inset-0 md:relative",
              !selectedElementId && "translate-x-full md:translate-x-0"
            )}>
              {selectedElement && entryDraft ? (
                <div className="flex h-full flex-col absolute inset-0">
                  <header className="h-[80px] flex items-center justify-between px-4 md:px-8 border-b border-[var(--border-ui)]/50 shrink-0 bg-[var(--background-surface)]/80 backdrop-blur-md z-10">
                    <div className="flex items-center gap-2 md:gap-4 min-w-0">
                      <button 
                        onClick={() => setSelectedElementId(null)}
                        className="md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-[var(--background-app)] border border-[var(--border-ui)] text-[var(--text-secondary)] shrink-0"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <h2 className="truncate text-lg md:text-xl font-bold text-[var(--text-primary)]">
                        {entryDraft.name || "Untitled Entry"}
                      </h2>
                      {isDirty && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--state-layer-primary)] text-[var(--primary)] border border-[var(--primary)]/30 uppercase tracking-widest shrink-0 hidden sm:block">
                          Unsaved
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 md:gap-3 shrink-0">
                      <AnimatePresence>
                        {status && (
                          <motion.span 
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="text-[12px] font-medium text-[var(--primary)] px-2 hidden sm:block"
                          >
                            {status}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full text-[var(--text-secondary)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 disabled:opacity-50 transition-colors"
                        title="Delete Lore Entry"
                      >
                        {deleting ? <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" /> : <Trash2 className="h-4 w-4 md:h-5 md:w-5" />}
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || !isDirty}
                        className="flex items-center gap-2 rounded-full bg-[var(--primary)] hover:opacity-90 text-white px-4 py-2 md:px-5 md:py-2.5 text-xs md:text-sm font-bold tracking-wide transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {saving ? <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 animate-spin" /> : <Save className="h-3.5 w-3.5 md:h-4 md:w-4" />}
                        Save
                      </button>
                    </div>
                  </header>

                  <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 md:py-10 custom-scrollbar">
                    <div className="max-w-4xl mx-auto space-y-8">
                      {error || workspaceError ? (
                        <div className="p-4 rounded-2xl bg-red-50 text-red-600 border border-red-200 text-sm font-medium">
                          {error ?? workspaceError}
                        </div>
                      ) : null}

                      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
                        <div className="space-y-6">
                          <label className="block group">
                            <span className="mb-2 block text-sm font-medium text-[var(--text-secondary)] transition-colors group-focus-within:text-[var(--primary)]">
                              {t("lore.field.title")}
                            </span>
                            <input
                              type="text"
                              value={entryDraft.name}
                              onChange={(e) => handleFieldChange("name", e.target.value)}
                              placeholder="E.g., The Rules of Elemental Magic"
                              className="w-full rounded-xl border border-[var(--border-ui)] bg-[var(--background-app)] px-4 py-3 text-lg font-bold text-[var(--text-primary)] outline-none transition-all focus:border-[var(--primary)]/50 focus:ring-2 focus:ring-[var(--primary)]/20 shadow-sm"
                            />
                          </label>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="block group">
                              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] transition-colors group-focus-within:text-[var(--primary)]">
                                {t("lore.field.category")}
                              </span>
                              <input
                                type="text"
                                value={entryDraft.attributes?.category || ""}
                                onChange={(e) => handleAttributeChange("category", e.target.value)}
                                placeholder="Magic, History, Faction, Religion..."
                                className="w-full rounded-xl border border-[var(--border-ui)] bg-[var(--background-app)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-all focus:border-[var(--primary)]/50 focus:ring-2 focus:ring-[var(--primary)]/20 shadow-sm"
                              />
                            </label>

                            <label className="block group">
                              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] transition-colors group-focus-within:text-[var(--text-primary)]">
                                {t("lore.field.system")}
                              </span>
                              <input
                                type="text"
                                value={entryDraft.attributes?.system || ""}
                                onChange={(e) => handleAttributeChange("system", e.target.value)}
                                placeholder="Hard Magic, Ancient Era, The Old Gods..."
                                className="w-full rounded-xl border border-[var(--border-ui)] bg-[var(--background-app)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-all focus:border-[var(--primary)]/50 focus:ring-2 focus:ring-[var(--primary)]/20 shadow-sm"
                              />
                            </label>

                            <label className="block group">
                              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] transition-colors group-focus-within:text-[var(--text-primary)]">
                                {t("lore.field.limitations")}
                              </span>
                              <input
                                type="text"
                                value={entryDraft.attributes?.limitations || ""}
                                onChange={(e) => handleAttributeChange("limitations", e.target.value)}
                                placeholder="E.g., Drains life force, Requires rare crystals..."
                                className="w-full rounded-xl border border-[var(--border-ui)] bg-[var(--background-app)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-all focus:border-[var(--primary)]/50 focus:ring-2 focus:ring-[var(--primary)]/20 shadow-sm"
                              />
                            </label>

                            <label className="block group">
                              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] transition-colors group-focus-within:text-[var(--text-primary)]">
                                {t("lore.field.history")}
                              </span>
                              <input
                                type="text"
                                value={entryDraft.attributes?.history || ""}
                                onChange={(e) => handleAttributeChange("history", e.target.value)}
                                placeholder="E.g., Discovered in the First Age..."
                                className="w-full rounded-xl border border-[var(--border-ui)] bg-[var(--background-app)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-all focus:border-[var(--primary)]/50 focus:ring-2 focus:ring-[var(--primary)]/20 shadow-sm"
                              />
                            </label>

                            <label className="block group md:col-span-2">
                              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] transition-colors group-focus-within:text-[var(--primary)]">
                                {t("lore.field.figures")}
                              </span>
                              <input
                                type="text"
                                value={entryDraft.attributes?.key_figures || ""}
                                onChange={(e) => handleAttributeChange("key_figures", e.target.value)}
                                placeholder="E.g., Archmage Thalor, The First King..."
                                className="w-full rounded-xl border border-[var(--border-ui)] bg-[var(--background-app)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-all focus:border-[var(--primary)]/50 focus:ring-2 focus:ring-[var(--primary)]/20 shadow-sm"
                              />
                            </label>
                          </div>

                          {/* Diagram Editor Area */}
                          <div className="border border-[var(--border-ui)] rounded-2xl bg-[var(--background-app)] overflow-hidden shadow-sm flex flex-col">
                            <div className="p-3 border-b border-[var(--border-ui)]/50 bg-[var(--background-surface)] flex justify-between items-center">
                              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">{t("lore.diagram.title")}</span>
                            </div>
                            <div className="w-full bg-[var(--background-surface)] relative flex items-center justify-center">
                              <LoreDiagramEditor
                                initialData={entryDraft.attributes?.diagram_data}
                                onChange={(data) => handleAttributeChange("diagram_data", data)}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[var(--border-ui)]/50">
                            <label className="block group">
                              <span className="mb-2 block text-sm font-medium text-[var(--text-secondary)] transition-colors group-focus-within:text-[var(--primary)]">
                                {t("lore.field.rules")}
                              </span>
                              <div className="border border-[var(--border-ui)] rounded-xl overflow-hidden bg-[var(--background-app)] focus-within:border-[var(--primary)]/50 focus-within:ring-2 focus-within:ring-[var(--primary)]/20 transition-all shadow-sm">
                                <RichTextEditor
                                  value={entryDraft.attributes?.rules || ""}
                                  onChange={(value) => handleAttributeChange("rules", value)}
                                  mentionItems={mentionEntities}
                                  placeholder="Explain the limitations, costs, or foundational rules of this concept..."
                                  minHeight="200px"
                                />
                              </div>
                            </label>

                            <label className="block group">
                              <span className="mb-2 block text-sm font-medium text-[var(--text-secondary)] transition-colors group-focus-within:text-[var(--primary)]">
                                {t("lore.field.description")}
                              </span>
                              <div className="border border-[var(--border-ui)] rounded-xl overflow-hidden bg-[var(--background-app)] focus-within:border-[var(--primary)]/50 focus-within:ring-2 focus-within:ring-[var(--primary)]/20 transition-all shadow-sm">
                                <RichTextEditor
                                  value={entryDraft.description ?? ""}
                                  mentionItems={mentionEntities}
                                  onChange={(value) => handleFieldChange("description", value)}
                                  placeholder="Write the extensive lore, history, and profound secrets here..."
                                  minHeight="300px"
                                />
                              </div>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="hidden md:flex h-full items-center justify-center p-8 text-center bg-[var(--background-surface)]">
                  <div className="flex flex-col items-center max-w-sm">
                    <div className="w-20 h-20 flex items-center justify-center rounded-[24px] bg-[var(--background-app)] border border-[var(--border-ui)] mb-6 shadow-sm">
                      <ScrollText className="w-10 h-10 text-[var(--text-tertiary)]" />
                    </div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">{t("lore.noSelection.title")}</h3>
                    <p className="text-base text-[var(--text-secondary)]">
                      {t("world.noMapDesc")}
                    </p>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <FileSelectorModal
        isOpen={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={(path) => {
          handleAttributeChange("diagram_image_url", path);
          setSelectorOpen(false);
        }}
        title="Select Diagram or Concept Art"
      />
    </div>
  );
}
