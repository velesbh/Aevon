"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { Loader2, Plus, Save, Search, Trash2, LayoutGrid, List as ListIcon, ChevronLeft, Image as ImageIcon, MapPin, X, Book } from "lucide-react";
import { useDashboardWorkspace } from "@/components/dashboard/workspace-provider";
import { cn } from "@/lib/utils";
import { getAttributeText, type WorldElementRecord, type WorldElementType, createCharacterImageSignedUrl } from "@/lib/workspace";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/lib/i18n";
import { FileSelectorModal } from "@/components/dashboard/file-selector-modal";
import { useRouter, useSearchParams } from "next/navigation";
import { RichTextEditor } from "@/components/rich-text/rich-text-editor";
import type { MentionEntity } from "@/components/rich-text/mention-data";
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
  const searchParams = useSearchParams();
  const urlId = searchParams.get("id");
  const [selectedElementId, setSelectedElementId] = useState<string | null>(urlId);
  const [viewMode, setViewMode] = useState<"split" | "grid">("grid");
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredElements = useMemo(() => {
    return (worldElements ?? []).filter((element) => {
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
    return (worldElements ?? [])
      .filter((el) => ["character", "location", "item", "lore"].includes(el.type))
      .map((element) => ({
        id: element.id,
        label: element.name || t("world.entry.untitled"),
        type: element.type as MentionEntity["type"],
        description: element.description ?? undefined,
        imageUrl: undefined,
        folderId: element.project_id,
        folderName: element.project_id === selectedElement?.project_id ? t("world.folders.current") : t("world.folders.other"),
        folderCategory: element.project_id === selectedElement?.project_id ? "active" : "shared",
      }));
  }, [worldElements, t, selectedElement?.project_id]);

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
    if (urlId && urlId !== selectedElementId) {
      setSelectedElementId(urlId);
    }
  }, [urlId, selectedElementId]);

  const handleSelectElement = (id: string | null) => {
    setSelectedElementId(id);
    const params = new URLSearchParams(searchParams.toString());
    if (id) {
      params.set("id", id);
    } else {
      params.delete("id");
    }
    router.push(`?${params.toString()}`);
  };

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
      handleSelectElement(null);
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
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
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
    <div className="flex flex-1 min-h-0 flex-col bg-[var(--background-app)] overflow-hidden">
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
      {/* Topbar removed for cleaner UI */}

      <main className="flex-1 flex min-h-0 bg-[var(--background-app)] relative overflow-hidden">
        <AnimatePresence mode="wait">
          {!selectedElement ? (
            <motion.div 
              key="list-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute inset-0 z-20 overflow-y-auto custom-scrollbar p-6 md:p-10"
            >
              {/* Topbar removed for cleaner UI */}
              <div className="mb-8" /> {/* Just a bit of spacing */}

              {filteredElements.length > 0 ? (
                <div className={cn(
                  "grid gap-6 max-w-[1400px] mx-auto",
                  viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
                )}>
                  {filteredElements.map((element) => (
                    <div
                      key={element.id}
                      onClick={() => handleSelectElement(element.id)}
                      className={cn(
                        "group cursor-pointer flex flex-col rounded-2xl border border-[var(--border-ui)] bg-[var(--background-surface)] overflow-hidden shadow-sm hover:shadow-md hover:border-[var(--border-ui-hover)] transition-all duration-200 relative",
                        viewMode === "grid" ? "h-[280px]" : "h-auto py-4 px-6 flex-row items-center gap-4"
                      )}
                    >
                      {viewMode === "grid" ? (
                        <>
                          <div className="h-32 bg-[var(--background-app)] border-b border-[var(--border-ui)]/50 flex items-center justify-center relative overflow-hidden">
                            {getAttributeText(element.attributes, "map_image_url") ? (
                              <ImageIcon className="w-8 h-8 text-[var(--text-tertiary)] opacity-50 transition-transform duration-300" />
                            ) : (
                              <ImageIcon className="w-8 h-8 text-[var(--text-tertiary)] opacity-30 group-hover:scale-110 transition-transform duration-300" />
                            )}
                          </div>
                          
                          <div className="p-5 flex flex-col flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <span className="text-xs font-medium text-[var(--text-secondary)] bg-[var(--background-app)] px-2 py-0.5 rounded-md border border-[var(--border-ui)]">
                                {getAttributeText(element.attributes, metaKey) || t("world.uncategorized")}
                              </span>
                            </div>
                            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2 line-clamp-1 transition-colors">
                              {element.name || t("world.entry.untitled")}
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed flex-1">
                              {element.description || t("world.entry.no_description")}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-xl bg-[var(--background-app)] flex items-center justify-center shrink-0 border border-[var(--border-ui)]/50">
                            <Icon className="w-6 h-6 text-[var(--text-tertiary)]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-base font-bold text-[var(--text-primary)] truncate transition-colors">
                                {element.name || t("world.entry.untitled")}
                              </h3>
                              <span className="text-[10px] font-medium text-[var(--text-secondary)] bg-[var(--background-app)] px-2 py-0.5 rounded-full border border-[var(--border-ui)]">
                                {getAttributeText(element.attributes, metaKey) || t("world.uncategorized")}
                              </span>
                            </div>
                            <p className="text-sm text-[var(--text-secondary)] line-clamp-1">
                              {element.description || t("world.entry.no_description")}
                            </p>
                          </div>
                          <div className="text-xs text-[var(--text-tertiary)] font-medium shrink-0">
                            {formatRelativeTime(element.updated_at, t)}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-6 py-24 text-center flex flex-col items-center gap-4 text-[var(--text-tertiary)]">
                  <Book className="w-16 h-16 opacity-20" />
                  <span className="text-base font-bold text-[var(--text-secondary)]">{searchQuery ? t("world.empty.no_matching") : t("world.empty.none")}</span>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="editor-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute inset-0 flex flex-col items-center bg-[var(--background-app)] overflow-y-auto custom-scrollbar pt-6 px-4"
            >
              <div className="w-full max-w-4xl flex items-center justify-between mb-6 px-4">
                <button
                  onClick={() => handleSelectElement(null)}
                  className="flex items-center gap-2 text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{title}</span>
                </button>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="p-2 rounded-full text-[var(--text-tertiary)] hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {entryDraft && (
                <div className="w-full max-w-4xl space-y-8 pb-20">
                  {error || workspaceError ? (
                    <div className="p-4 rounded-2xl bg-red-50 text-red-600 border border-red-200 text-sm font-medium">
                      {error ?? workspaceError}
                    </div>
                  ) : null}

                  <div className="bg-[var(--background-surface)] rounded-[32px] border border-[var(--border-ui)]/50 p-8 md:p-12 shadow-sm space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <label className="block group">
                          <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] group-focus-within:text-[var(--primary)] transition-colors">
                            {t("world.entry.name_label")}
                          </span>
                          <input
                            type="text"
                            value={entryDraft.name}
                            onChange={(e) => handleFieldChange("name", e.target.value)}
                            placeholder={t("world.entry.name_placeholder")}
                            className="w-full bg-transparent border-b-2 border-[var(--border-ui)] py-2 text-2xl font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-all placeholder:text-[var(--text-tertiary)]/30"
                          />
                        </label>

                        <label className="block group">
                          <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] group-focus-within:text-[var(--primary)] transition-colors">
                            {metaLabel}
                          </span>
                          <input
                            type="text"
                            value={entryDraft.attributes?.[metaKey] || ""}
                            onChange={(e) => handleAttributeChange(metaKey, e.target.value)}
                            placeholder={t("world.entry.type_placeholder")}
                            className="w-full bg-[var(--background-app)] border border-[var(--border-ui)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 transition-all"
                          />
                        </label>
                      </div>

                      <div className="space-y-6">
                        <label className="block group">
                          <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] group-focus-within:text-[var(--primary)] transition-colors">
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
                      </div>
                    </div>

                    <div className="space-y-4">
                      <span className="block text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
                        {t("world.entry.description_notes")}
                      </span>
                      <div className="rounded-2xl border border-[var(--border-ui)] overflow-hidden bg-[var(--background-app)] shadow-inner">
                        <RichTextEditor
                          key={`editor-desc-${selectedElementId}`}
                          value={entryDraft.description ?? ""}
                          mentionItems={mentionEntities}
                          onChange={(value) => handleFieldChange("description", value)}
                          placeholder={t("world.entry.description_placeholder")}
                          minHeight="400px"
                        />
                      </div>
                    </div>

                    {(type === "location" || mapsOnly) && (
                      <div className="space-y-6 pt-8 border-t border-[var(--border-ui)]/50">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">{t("world.map.config")}</h3>
                          <button
                            type="button"
                            onClick={() => setSelectorOpen(true)}
                            className="text-xs font-bold text-[var(--primary)] hover:opacity-80 transition-colors"
                          >
                            {t("world.map.select_workspace")}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                          <label className="block group">
                            <span className="mb-2 block text-xs font-bold tracking-wide text-[var(--text-tertiary)] group-focus-within:text-[var(--primary)] transition-colors">
                              {t("world.map.url_label")}
                            </span>
                            <input
                              type="text"
                              value={entryDraft.attributes?.map_image_url || ""}
                              onChange={(e) => handleAttributeChange("map_image_url", e.target.value)}
                              placeholder={t("world.map.url_placeholder")}
                              className="w-full bg-[var(--background-app)] border border-[var(--border-ui)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 transition-all shadow-sm"
                            />
                          </label>

                          {entryDraft.attributes?.map_image_url && entryDraft.attributes.map_image_url !== "placeholder" && (
                            <div className="flex flex-col gap-3">
                               <div className="relative aspect-video rounded-2xl border border-[var(--border-ui)] overflow-hidden bg-[var(--background-app)] shadow-md group/map">
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
                                      
                                      const waypoints = (() => {
                                        const parsed = entryDraft.attributes?.waypoints ? JSON.parse(entryDraft.attributes.waypoints) : [];
                                        return Array.isArray(parsed) ? parsed : [];
                                      })();
                                      handleAttributeChange("waypoints", JSON.stringify([...waypoints, newWaypoint]));
                                      setSelectedWaypointId(newWaypoint.id);
                                    }}
                                  />
                                  {(() => {
                                    try {
                                      const waypoints: Waypoint[] = (() => {
                                        const parsed = entryDraft.attributes?.waypoints ? JSON.parse(entryDraft.attributes.waypoints) : [];
                                        return Array.isArray(parsed) ? parsed : [];
                                      })();
                                      return waypoints.map(wp => (
                                        <button
                                          key={wp.id}
                                          className="absolute w-6 h-6 -ml-3 -mt-3 text-[var(--primary)] hover:opacity-80 drop-shadow-md transition-transform hover:scale-125 focus:outline-none z-10"
                                          style={{ left: `${wp.x}%`, top: `${wp.y}%` }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedWaypointId(wp.id);
                                          }}
                                          title={wp.note}
                                        >
                                          <MapPin className="w-full h-full fill-[var(--primary)]/20" />
                                        </button>
                                      ));
                                    } catch {
                                      return null;
                                    }
                                  })()}
                               </div>
                               <p className="text-[10px] text-center text-[var(--text-tertiary)] italic">{t("world.map.instruction")}</p>
                            </div>
                          )}
                        </div>

                        {selectedWaypointId && (() => {
                          try {
                            const waypoints: Waypoint[] = (() => {
                              const parsed = entryDraft.attributes?.waypoints ? JSON.parse(entryDraft.attributes.waypoints) : [];
                              return Array.isArray(parsed) ? parsed : [];
                            })();
                            const wp = waypoints.find(w => w.id === selectedWaypointId);
                            if (!wp) return null;
                            
                            return (
                              <div className="bg-[var(--background-app)] p-4 rounded-2xl border border-[var(--border-ui)] shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-[var(--primary)] uppercase tracking-tighter">{t("world.waypoint.note_label")}</span>
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
                                  className="w-full text-sm bg-transparent border-b border-[var(--border-ui)] p-0 text-[var(--text-primary)] focus:border-[var(--primary)] outline-none resize-none"
                                  rows={2}
                                  autoFocus
                                />
                                <div className="flex justify-end">
                                  <button
                                    onClick={() => {
                                      const newWaypoints = waypoints.filter(w => w.id !== wp.id);
                                      handleAttributeChange("waypoints", JSON.stringify(newWaypoints));
                                      setSelectedWaypointId(null);
                                    }}
                                    className="text-[10px] text-red-500 hover:text-red-400 font-bold uppercase tracking-widest transition-colors flex items-center gap-1"
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
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <FileSelectorModal
        isOpen={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={(path) => {
          handleAttributeChange("map_image_url", path);
          setSelectorOpen(false);
        }}
        onUploadClick={() => {
          fileInputRef.current?.click();
        }}
        title={t("world.map.select_title")}
      />
    </div>
  );
}
