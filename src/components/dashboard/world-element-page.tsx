"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { Loader2, Plus, Save, Search, Trash2, LayoutGrid, List as ListIcon, ChevronLeft, Image as ImageIcon, MapPin, X, Book } from "lucide-react";
import { useDashboardWorkspace } from "@/components/dashboard/workspace-provider";
import { cn } from "@/lib/utils";
import { getAttributeText, type WorldElementRecord, type WorldElementType, createCharacterImageSignedUrl } from "@/lib/workspace";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/lib/i18n";
import { FileSelectorModal } from "@/components/dashboard/file-selector-modal";
import { useRouter } from "next/navigation";
import { RichTextEditor, type MentionEntity } from "@/components/rich-text/rich-text-editor";
import { LoreAttachmentPicker } from "@/components/dashboard/lore-attachment-picker";

function formatRelativeTime(value: string, t: (key: string) => string) {
  const timestamp = new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.floor((Date.now() - timestamp) / 60000));
  if (diffMinutes < 60) return `${diffMinutes}${t("dashboard.time.minute")}`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}${t("dashboard.time.hour")}`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}${t("dashboard.time.day")}`;
}

interface Waypoint {
  id: string;
  x: number;
  y: number;
  note: string;
}

export function WorldElementPage({ type, title, icon: Icon, metaKey, metaLabel, mapsOnly }: { type: WorldElementType, title: string, icon: any, metaKey: string, metaLabel: string, mapsOnly?: boolean }) {
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredElements = useMemo(() => {
    return worldElements.filter((element) => {
      if (element.type !== type) {
        return false;
      }

      const hasMapImage = Boolean(getAttributeText(element.attributes, "map_image_url"));
      if (mapsOnly && !hasMapImage) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const nameMatch = element.name.toLowerCase().includes(normalizedQuery);
      const descriptionMatch = (element.description?.toLowerCase() ?? "").includes(normalizedQuery);
      return nameMatch || descriptionMatch;
    });
  }, [mapsOnly, normalizedQuery, type, worldElements]);

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
        label: element.name || t("world.entry.untitled"),
        type: element.type as MentionEntity["type"],
        description: element.description ?? undefined,
      }));
  }, [worldElements, t]);

  const [selectedWaypointId, setSelectedWaypointId] = useState<string | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [mapImageUrl, setMapImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const url = entryDraft?.attributes?.map_image_url;
    if (!url) {
      if (active) setMapImageUrl(null);
      return;
    }
    
    if (url.startsWith("http")) {
      if (active) setMapImageUrl(url);
    } else {
      createCharacterImageSignedUrl(url).then(signed => {
        if (active) setMapImageUrl(signed);
      }).catch(() => {
        if (active) setMapImageUrl(null);
      });
    }
    return () => { active = false; };
  }, [entryDraft?.attributes?.map_image_url]);

  useEffect(() => {
    if (selectedElement) {
      setEntryDraft({
        name: selectedElement.name,
        description: selectedElement.description ?? "",
        attributes: { 
          [metaKey]: getAttributeText(selectedElement.attributes, metaKey),
          map_image_url: getAttributeText(selectedElement.attributes, "map_image_url"),
          waypoints: getAttributeText(selectedElement.attributes, "waypoints"),
          attached_lore: getAttributeText(selectedElement.attributes, "attached_lore"),
        },
      });
      setSelectedWaypointId(null);
    } else {
      setEntryDraft(null);
      setSelectedWaypointId(null);
    }
  }, [selectedElement, metaKey]);

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
      const created = await createWorldElementRecord(type);
      // If we are in "Maps" view, ensure map_image_url is set so it doesn't disappear from the view. We can set it to a placeholder or wait for user input.
      if (mapsOnly) {
         await saveWorldElementRecord(created.id, {
           attributes: { ...(typeof created.attributes === 'object' && created.attributes !== null ? created.attributes : {}), map_image_url: "placeholder" }
         });
      }
      setSelectedElementId(created.id);
      setViewMode("split"); 
      setStatus(t("world.status.created"));
      setTimeout(() => setStatus(null), 3000);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : t("world.error.create"));
    } finally {
      setCreating(false);
    }
  };

  const isDirty = useMemo(() => {
    if (!selectedElement || !entryDraft) {
      return false;
    }
    return (
      selectedElement.name !== entryDraft.name ||
      (selectedElement.description ?? "") !== entryDraft.description ||
      getAttributeText(selectedElement.attributes, metaKey) !== entryDraft.attributes?.[metaKey] ||
      getAttributeText(selectedElement.attributes, "map_image_url") !== entryDraft.attributes?.map_image_url ||
      getAttributeText(selectedElement.attributes, "waypoints") !== entryDraft.attributes?.waypoints ||
      getAttributeText(selectedElement.attributes, "attached_lore") !== entryDraft.attributes?.attached_lore
    );
  }, [selectedElement, entryDraft, metaKey]);

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
      setStatus(t("world.status.saved"));
      setTimeout(() => setStatus(null), 3000);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t("world.error.save"));
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!isDirty || saving) return;
    const timer = setTimeout(() => {
      void handleSave();
    }, 2000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryDraft, isDirty, saving]);

  const handleDelete = async () => {
    if (!selectedElementId) {
      return;
    }

    setDeleting(true);
    setError(null);
    setStatus(null);

    try {
      await deleteWorldElementRecord(selectedElementId);
      setStatus(t("world.status.deleted"));
      setSelectedElementId(null);
      setTimeout(() => setStatus(null), 3000);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : t("world.error.delete"));
    } finally {
      setDeleting(false);
    }
  };

  const handleFieldChange = (field: "name" | "description", value: string) => {
    setEntryDraft((current) => (current ? { ...current, [field]: value } : current));
  };

  const handleAttributeChange = (key: string, value: string) => {
    setEntryDraft((current) => (current ? { ...current, attributes: { ...current.attributes, [key]: value } } : current));
  };

  if (loading) {
    return (
      <div className="flex flex-1 min-h-0 items-center justify-center bg-[var(--background-surface)]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const handleUploadImage = async (file: File) => {
    try {
      setSaving(true);
      const record = await uploadFileRecord(file);
      handleAttributeChange("map_image_url", record.file_path);
      setSelectorOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-1 min-h-0 flex-col bg-[var(--background-surface)] overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUploadImage(file);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}
      />
      <header className="flex flex-col border-b border-[var(--border-ui)]/50 shrink-0 bg-[var(--background-surface)]/80 backdrop-blur-md z-10">
        <div className="flex items-center justify-between px-4 md:px-8 py-4">
          <div className="flex items-center gap-3">
             <Icon className="w-5 h-5 text-emerald-500" />
             <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
               {title}
             </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center bg-[var(--background-app)] p-1 rounded-full border border-[var(--border-ui)] shadow-sm">
              <button
                onClick={() => setViewMode("split")}
                className={cn("p-2 rounded-full transition-colors", viewMode === "split" ? "bg-[var(--background-surface)] text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]")}
                title={t("world.view.split")}
              >
                <ListIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setViewMode("grid"); setSelectedElementId(null); }}
                className={cn("p-2 rounded-full transition-colors", viewMode === "grid" ? "bg-[var(--background-surface)] text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]")}
                title={t("world.view.grid")}
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
                  placeholder={t("world.search_placeholder")}
                  className="w-full bg-[var(--background-app)] border border-[var(--border-ui)] rounded-full py-3 pl-12 pr-4 text-sm font-medium text-[var(--text-primary)] outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 text-sm font-bold tracking-wide transition-all shadow-md hover:shadow-md ml-4 shrink-0"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                <span className="hidden sm:inline">{t("world.actions.add_new")}</span>
              </button>
            </div>

            {filteredElements.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 max-w-[1400px] mx-auto">
                {filteredElements.map((element) => (
                  <div
                    key={element.id}
                    onClick={() => {
                      setSelectedElementId(element.id);
                      setViewMode("split");
                    }}
                    className="group cursor-pointer flex flex-col rounded-2xl border border-[var(--border-ui)] bg-[var(--background-app)] overflow-hidden shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all duration-200 relative h-[280px]"
                  >
                    <div className="h-32 bg-[var(--background-surface)] border-b border-[var(--border-ui)]/50 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {getAttributeText(element.attributes, "map_image_url") ? (
                        <ImageIcon className="w-8 h-8 text-emerald-500/50 transition-transform duration-300" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-[var(--text-tertiary)] opacity-30 group-hover:scale-110 transition-transform duration-300" />
                      )}
                    </div>
                    
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          {getAttributeText(element.attributes, metaKey) || t("world.uncategorized")}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2 line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {element.name || t("world.entry.untitled")}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed flex-1">
                        {element.description || t("world.entry.no_description")}
                      </p>
                      <span className="text-xs font-medium text-[var(--text-tertiary)] mt-3 block border-t border-[var(--border-ui)]/50 pt-3">
                        {t("world.entry.last_edited").replace("{time}", formatRelativeTime(element.updated_at, t))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-24 text-center flex flex-col items-center gap-4 text-[var(--text-tertiary)]">
                <Book className="w-16 h-16 opacity-20" />
                <span className="text-base font-bold text-[var(--text-secondary)]">{searchQuery ? t("world.empty.no_matching") : t("world.empty.none")}</span>
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
                    placeholder={t("world.search_placeholder")}
                    className="w-full bg-[var(--background-app)] border border-[var(--border-ui)] rounded-full py-2.5 pl-10 pr-4 text-sm font-medium text-[var(--text-primary)] outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-[var(--text-tertiary)]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md hover:shadow-md disabled:opacity-50 shrink-0"
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
                            ? "bg-[var(--background-surface)] border-emerald-500/30 shadow-sm text-emerald-700 dark:text-emerald-300"
                            : "border-transparent text-[var(--text-secondary)] hover:bg-[var(--background-surface)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-[var(--border-ui)] hover:text-[var(--text-primary)]"
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className={cn("text-sm font-bold truncate pr-2 group-hover:text-[var(--text-primary)]", isActive && "text-[var(--text-primary)]")}>
                              {element.name || t("world.entry.untitled")}
                            </span>
                            <span className="text-[10px] font-medium text-[var(--text-tertiary)] shrink-0 tabular-nums">
                              {formatRelativeTime(element.updated_at, t)}
                            </span>
                          </div>
                          <span className="text-[11px] font-medium text-[var(--text-tertiary)] truncate block">
                            {getAttributeText(element.attributes, metaKey) || t("world.uncategorized")}
                          </span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="px-6 py-12 text-center flex flex-col items-center gap-3 text-[var(--text-tertiary)]">
                    <Book className="w-10 h-10 opacity-20" />
                    <span className="text-sm font-medium">{searchQuery ? t("world.empty.no_matching") : t("world.empty.none")}</span>
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
                        {entryDraft.name || t("world.entry.untitled")}
                      </h2>
                      {isDirty && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 uppercase tracking-widest shrink-0 hidden sm:block">
                          {t("world.entry.unsaved")}
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
                            className="text-[12px] font-medium text-emerald-600 dark:text-emerald-400 px-2 hidden sm:block"
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
                        title={t("world.action.delete_title")}
                      >
                        {deleting ? <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" /> : <Trash2 className="h-4 w-4 md:h-5 md:w-5" />}
                      </button>
                      {saving && <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin text-emerald-600 dark:text-emerald-400" />}
                    </div>
                  </header>

                  <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 md:py-10 custom-scrollbar">
                    <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">
                      {error || workspaceError ? (
                        <div className="p-4 mb-6 rounded-2xl bg-red-50 text-red-600 border border-red-200 text-sm font-medium">
                          {error ?? workspaceError}
                        </div>
                      ) : null}

                      <div className="space-y-6">
                        <label className="block group">
                          <span className="mb-2 block text-sm font-medium text-[var(--text-secondary)] transition-colors group-focus-within:text-emerald-500">
                            {t("world.entry.name_label")}
                          </span>
                          <input
                            type="text"
                            value={entryDraft.name}
                            onChange={(e) => handleFieldChange("name", e.target.value)}
                            placeholder={t("world.entry.name_placeholder")}
                            className="w-full rounded-xl border border-[var(--border-ui)] bg-[var(--background-app)] px-4 py-3 text-base text-[var(--text-primary)] outline-none transition-all focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
                          />
                        </label>

                        <label className="block group">
                          <span className="mb-2 block text-sm font-medium text-[var(--text-secondary)] transition-colors group-focus-within:text-emerald-500">
                            {metaLabel}
                          </span>
                          <input
                            type="text"
                            value={entryDraft.attributes?.[metaKey] || ""}
                            onChange={(e) => handleAttributeChange(metaKey, e.target.value)}
                            placeholder={t("world.entry.type_placeholder")}
                            className="w-full rounded-xl border border-[var(--border-ui)] bg-[var(--background-app)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition-all focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
                          />
                        </label>

                        <label className="block group">
                          <span className="mb-2 block text-sm font-medium text-[var(--text-secondary)] transition-colors group-focus-within:text-emerald-500">
                            {t("world.entry.attached_lore")}
                          </span>
                          <LoreAttachmentPicker
                            attachedLoreIds={(() => {
                              try {
                                return JSON.parse(entryDraft.attributes?.attached_lore || "[]");
                              } catch {
                                return [];
                              }
                            })()}
                            onChange={(ids) => handleAttributeChange("attached_lore", JSON.stringify(ids))}
                          />
                        </label>

                        <label className="block group">
                          <span className="mb-2 block text-sm font-medium text-[var(--text-secondary)] transition-colors group-focus-within:text-emerald-500">
                            {t("world.entry.description_notes")}
                          </span>
                          <RichTextEditor
                            key={`editor-desc-${selectedElementId}`}
                            value={entryDraft.description ?? ""}
                            mentionItems={mentionEntities}
                            onChange={(value) => handleFieldChange("description", value)}
                            placeholder={t("world.entry.description_placeholder")}
                            minHeight="300px"
                          />
                        </label>

                        {(type === "location" || mapsOnly) && (
                          <div className="space-y-4 pt-6 border-t border-[var(--border-ui)]/50">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-medium text-[var(--text-secondary)]">{t("world.map.config")}</h3>
                              <button
                                type="button"
                                onClick={() => setSelectorOpen(true)}
                                className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-500"
                              >
                                {t("world.map.select_workspace")}
                              </button>
                            </div>
                            <label className="block group">
                              <span className="mb-2 block text-sm font-medium text-[var(--text-secondary)] transition-colors group-focus-within:text-emerald-500">
                                {t("world.map.url_label")}
                              </span>
                              <input
                                type="text"
                                value={entryDraft.attributes?.map_image_url || ""}
                                onChange={(e) => handleAttributeChange("map_image_url", e.target.value)}
                                placeholder={t("world.map.url_placeholder")}
                                className="w-full rounded-xl border border-[var(--border-ui)] bg-[var(--background-app)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition-all focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
                              />
                            </label>

                            {entryDraft.attributes?.map_image_url && entryDraft.attributes.map_image_url !== "placeholder" && (
                              <div className="mt-4 border border-[var(--border-ui)] rounded-xl bg-[var(--background-app)] overflow-hidden">
                                <div className="p-4 border-b border-[var(--border-ui)]/50 bg-[var(--background-surface)]">
                                  <p className="text-xs text-[var(--text-secondary)]">{t("world.map.instruction")}</p>
                                </div>
                                <div className="relative w-full aspect-video md:aspect-[2/1] overflow-hidden bg-[var(--background-surface)]">
                                  <img 
                                    src={mapImageUrl || ""} 
                                    alt="Map"
                                    className="w-full h-full object-contain cursor-crosshair"
                                    onClick={(e) => {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      const x = ((e.clientX - rect.left) / rect.width) * 100;
                                      const y = ((e.clientY - rect.top) / rect.height) * 100;
                                      
                                      const newWaypoint: Waypoint = {
                                        id: crypto.randomUUID(),
                                        x,
                                        y,
                                        note: t("world.waypoint.new")
                                      };
                                      
                                      const waypoints = entryDraft.attributes?.waypoints ? JSON.parse(entryDraft.attributes.waypoints) : [];
                                      handleAttributeChange("waypoints", JSON.stringify([...waypoints, newWaypoint]));
                                      setSelectedWaypointId(newWaypoint.id);
                                    }}
                                  />
                                  {(() => {
                                    try {
                                      const waypoints: Waypoint[] = entryDraft.attributes?.waypoints ? JSON.parse(entryDraft.attributes.waypoints) : [];
                                      return waypoints.map(wp => (
                                        <button
                                          key={wp.id}
                                          className="absolute w-6 h-6 -ml-3 -mt-3 text-emerald-500 hover:text-emerald-400 drop-shadow-md transition-transform hover:scale-125 focus:outline-none z-10"
                                          style={{ left: `${wp.x}%`, top: `${wp.y}%` }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedWaypointId(wp.id);
                                          }}
                                          title={wp.note}
                                        >
                                          <MapPin className="w-full h-full fill-emerald-500/20" />
                                        </button>
                                      ));
                                    } catch {
                                      return null;
                                    }
                                  })()}

                                  {selectedWaypointId && (() => {
                                    try {
                                      const waypoints: Waypoint[] = entryDraft.attributes?.waypoints ? JSON.parse(entryDraft.attributes.waypoints) : [];
                                      const wp = waypoints.find(w => w.id === selectedWaypointId);
                                      if (!wp) return null;
                                      
                                      const leftStyles = wp.x > 50 ? { right: `max(1rem, ${100 - wp.x}%)` } : { left: `max(1rem, ${wp.x}%)` };
                                      const topStyles = wp.y > 50 ? { bottom: `max(1rem, ${100 - wp.y}%)` } : { top: `max(1rem, ${wp.y}%)` };
                                      
                                      return (
                                        <div 
                                          className="absolute z-20 bg-[var(--background-surface)]/95 backdrop-blur-sm p-4 rounded-xl border border-[var(--border-ui)] shadow-xl w-64 max-w-[calc(100%-2rem)] flex flex-col gap-2"
                                          style={{ ...leftStyles, ...topStyles }}
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <div className="flex justify-between items-start mb-1">
                                            <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">{t("world.waypoint.note_label")}</span>
                                            <button onClick={() => setSelectedWaypointId(null)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                                              <X className="w-4 h-4" />
                                            </button>
                                          </div>
                                          <textarea
                                            value={wp.note}
                                            onChange={(e) => {
                                              const newWaypoints = waypoints.map(w => w.id === wp.id ? { ...w, note: e.target.value } : w);
                                              handleAttributeChange("waypoints", JSON.stringify(newWaypoints));
                                            }}
                                            className="w-full text-sm bg-[var(--background-app)] border border-[var(--border-ui)] rounded-lg p-2 text-[var(--text-primary)] focus:border-emerald-500/50 outline-none resize-none"
                                            rows={3}
                                            autoFocus
                                          />
                                          <div className="mt-1 flex justify-end">
                                            <button
                                              onClick={() => {
                                                const newWaypoints = waypoints.filter(w => w.id !== wp.id);
                                                handleAttributeChange("waypoints", JSON.stringify(newWaypoints));
                                                setSelectedWaypointId(null);
                                              }}
                                              className="text-xs text-red-500 hover:text-red-400 font-medium flex items-center gap-1 transition-colors"
                                            >
                                              <Trash2 className="w-3 h-3" /> {t("world.waypoint.remove")}
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    } catch {
                                      return null;
                                    }
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="hidden md:flex h-full items-center justify-center p-8 text-center bg-[var(--background-surface)]">
                  <div className="flex flex-col items-center max-w-sm">
                    <div className="w-20 h-20 flex items-center justify-center rounded-[24px] bg-[var(--background-app)] border border-[var(--border-ui)] mb-6 shadow-sm">
                      <Icon className="w-10 h-10 text-[var(--text-tertiary)]" />
                    </div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">{t("world.empty.no_selection_title")}</h3>
                    <p className="text-base text-[var(--text-secondary)]">
                      {t("world.empty.no_selection_desc")}
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
        onSelect={(path) => handleAttributeChange("map_image_url", path)}
        onUploadClick={() => {
          fileInputRef.current?.click();
        }}
        title={t("world.map.select_title")}
      />
    </div>
  );
}
