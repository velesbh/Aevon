"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { Loader2, Plus, Save, Search, Trash2, LayoutGrid, List as ListIcon, ChevronLeft, Image as ImageIcon, Box, Upload } from "lucide-react";
import { useDashboardWorkspace } from "@/components/dashboard/workspace-provider";
import { cn } from "@/lib/utils";
import { getAttributeText, type WorldElementRecord, createCharacterImageSignedUrl } from "@/lib/workspace";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/lib/i18n";
import { FileSelectorModal } from "@/components/dashboard/file-selector-modal";
import { useRouter, useSearchParams } from "next/navigation";
import { RichTextEditor } from "@/components/rich-text/rich-text-editor";
import type { MentionEntity } from "@/components/rich-text/mention-data";
import { LoreAttachmentPicker } from "@/components/dashboard/lore-attachment-picker";

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.floor((Date.now() - timestamp) / 60000));
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

function ItemGridCard({
  element,
  onClick,
}: {
  element: WorldElementRecord;
  onClick: () => void;
}) {
  const itemImgUrl = getAttributeText(element.attributes, "item_image_url");
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (itemImgUrl) {
      if (itemImgUrl.startsWith("http") || itemImgUrl.startsWith("data:")) {
        setSignedUrl(itemImgUrl);
      } else {
        createCharacterImageSignedUrl(itemImgUrl)
          .then(setSignedUrl)
          .catch(() => setSignedUrl(null));
      }
    } else {
      setSignedUrl(null);
    }
  }, [itemImgUrl]);

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer flex flex-col rounded-2xl border border-[var(--border-ui)] bg-[var(--background-app)] overflow-hidden shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all duration-200 relative h-[280px]"
    >
      <div className="h-32 bg-[var(--background-surface)] border-b border-[var(--border-ui)]/50 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {signedUrl ? (
          <img
            src={signedUrl}
            alt={element.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <ImageIcon className="w-8 h-8 text-[var(--text-tertiary)] opacity-30 group-hover:scale-110 transition-transform duration-300" />
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-2">
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
            {element.type.toUpperCase()}
          </span>
          <span className="text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
            {getAttributeText(element.attributes, "rarity") || "Common"}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2 line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {element.name || "Untitled"}
        </h3>
        <p className="text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed flex-1">
          {element.description ? element.description.replace(/<[^>]+>/g, '') : "No description provided."}
        </p>
      </div>
    </div>
  );
}

export default function ItemsPage() {
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

  const searchParams = useSearchParams();
  const urlId = searchParams.get("id");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"split" | "grid">("split");
  const router = useRouter();
  
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  // Sync with URL
  useEffect(() => {
    if (urlId && urlId !== selectedElementId) {
      setSelectedElementId(urlId);
    }
  }, [urlId, selectedElementId]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredElements = useMemo(() => {
    return worldElements.filter((element) => {
      if (element.type !== "item") {
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
    () => worldElements.find((el) => el.id === (urlId || selectedElementId)) ?? null,
    [worldElements, urlId, selectedElementId],
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
        folderName: element.project_id === selectedElement?.project_id ? t("items.currentProject") : t("items.sharedProjects"),
        folderCategory: element.project_id === selectedElement?.project_id ? "active" : "shared",
      }));
  }, [worldElements, selectedElement?.project_id, t]);

  const [selectorOpen, setSelectorOpen] = useState(false);
  const [itemImageUrl, setItemImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    const url = entryDraft?.attributes?.item_image_url;
    if (!url) {
      if (active) setItemImageUrl(null);
      return;
    }
    
    if (url.startsWith("http") || url.startsWith("data:")) {
      if (active) setItemImageUrl(url);
    } else {
      createCharacterImageSignedUrl(url).then(signed => {
        if (active) setItemImageUrl(signed);
      }).catch(() => {
        if (active) setItemImageUrl(null);
      });
    }
    return () => { active = false; };
  }, [entryDraft?.attributes?.item_image_url]);

  useEffect(() => {
    if (selectedElement) {
      setEntryDraft({
        name: selectedElement.name,
        description: selectedElement.description ?? "",
        attributes: { 
          category: getAttributeText(selectedElement.attributes, "category"),
          rarity: getAttributeText(selectedElement.attributes, "rarity"),
          value: getAttributeText(selectedElement.attributes, "value"),
          weight: getAttributeText(selectedElement.attributes, "weight"),
          materials: getAttributeText(selectedElement.attributes, "materials"),
          effects: getAttributeText(selectedElement.attributes, "effects"),
          item_image_url: getAttributeText(selectedElement.attributes, "item_image_url"),
          attached_lore: getAttributeText(selectedElement.attributes, "attached_lore"),
          owner_id: getAttributeText(selectedElement.attributes, "owner_id"),
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
      const created = await createWorldElementRecord("item");
      setSelectedElementId(created.id);
      setViewMode("split"); 
      setStatus(t("items.created"));
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
    setEntryDraft((current) => (current ? { ...current, attributes: { ...current.attributes, [key]: value } } : current));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    try {
      const file = e.target.files[0];
      const uploadedFile = await uploadFileRecord(file);
      if (uploadedFile) {
        handleAttributeChange("item_image_url", uploadedFile.file_path);
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
      getAttributeText(selectedElement.attributes, "rarity") !== entryDraft.attributes?.rarity ||
      getAttributeText(selectedElement.attributes, "value") !== entryDraft.attributes?.value ||
      getAttributeText(selectedElement.attributes, "weight") !== entryDraft.attributes?.weight ||
      getAttributeText(selectedElement.attributes, "materials") !== entryDraft.attributes?.materials ||
      getAttributeText(selectedElement.attributes, "effects") !== entryDraft.attributes?.effects ||
      getAttributeText(selectedElement.attributes, "item_image_url") !== entryDraft.attributes?.item_image_url ||
      getAttributeText(selectedElement.attributes, "attached_lore") !== entryDraft.attributes?.attached_lore ||
      getAttributeText(selectedElement.attributes, "owner_id") !== entryDraft.attributes?.owner_id
    );
  }, [selectedElement, entryDraft]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--background-surface)]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--background-app)] overflow-hidden">
      {/* Header / Breadcrumbs */}
      <header className="h-16 border-b border-[var(--border-ui)]/50 flex items-center px-4 md:px-8 bg-[var(--background-surface)] shrink-0 gap-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors cursor-default">
            {t("sidebar.worldBuilding") || "World Building"}
          </span>
          <span className="text-[var(--text-tertiary)]/50">/</span>
          <span
            className={cn(
              "transition-colors",
              selectedElement ? "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] cursor-pointer" : "text-[var(--text-primary)] font-bold"
            )}
            onClick={() => {
              if (selectedElement) {
                router.push("/dashboard/items");
                setSelectedElementId(null);
              }
            }}
          >
            {t("sidebar.items") || "Items"}
          </span>
          {selectedElement && (
            <>
              <span className="text-[var(--text-tertiary)]/50">/</span>
              <span className="text-[var(--text-primary)] font-bold truncate max-w-[200px]">
                {selectedElement.name || "Untitled Item"}
              </span>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {selectedElement && (
            <>
              {status && (
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest animate-pulse px-2 hidden sm:block">
                  {status}
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={saving || !isDirty}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all shadow-sm",
                  isDirty
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/10"
                    : "bg-[var(--background-app)] text-[var(--text-tertiary)] border border-[var(--border-ui)] opacity-50 cursor-not-allowed"
                )}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span className="hidden sm:inline">{t("common.save") || "Save"}</span>
              </button>

              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-2 rounded-full hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-500 transition-all border border-transparent hover:border-red-500/20"
                title="Delete Item"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            </>
          )}

          {!selectedElement && (
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all shadow-sm shadow-emerald-900/10"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              <span>{t("common.create") || "Create Item"}</span>
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col relative">
        <AnimatePresence mode="wait">
          {!selectedElement ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar"
            >
              <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div className="space-y-2">
                    <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
                      {t("items.title") || "Items & Artifacts"}
                    </h1>
                    <p className="text-[var(--text-secondary)] font-medium max-w-lg">
                      {t("items.description") || "Manage the artifacts, weapons, and key items of your world."}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 bg-[var(--background-surface)] p-1 rounded-2xl border border-[var(--border-ui)]/50 shadow-sm">
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search items..."
                        className="w-full bg-transparent border-none outline-none pl-9 pr-4 py-1.5 text-sm font-medium"
                      />
                    </div>
                  </div>
                </div>

                {filteredElements.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-[var(--border-ui)]/50 rounded-3xl bg-[var(--background-surface)]/30">
                    <div className="w-16 h-16 rounded-3xl bg-[var(--background-app)] flex items-center justify-center mb-4 border border-[var(--border-ui)]/50 shadow-sm">
                      <Box className="w-8 h-8 text-[var(--text-tertiary)]" />
                    </div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">
                      {searchQuery ? "No matching items found" : "No items yet"}
                    </h3>
                    <p className="text-[var(--text-secondary)] text-sm mb-6 max-w-xs mx-auto">
                      {searchQuery ? "Try a different search term or clear the filter." : "Start by creating your first item to build your world's inventory."}
                    </p>
                    <button
                      onClick={handleCreate}
                      disabled={creating}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--text-primary)] text-[var(--background-app)] text-sm font-bold hover:scale-105 active:scale-95 transition-all shadow-lg"
                    >
                      {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      <span>Add New Item</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                    {filteredElements.map((element) => (
                      <ItemGridCard
                        key={element.id}
                        element={element}
                        onClick={() => {
                          const params = new URLSearchParams(window.location.search);
                          params.set("id", element.id);
                          router.push(`${window.location.pathname}?${params.toString()}`);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="editor"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex-1 overflow-y-auto custom-scrollbar"
            >
              <div className="max-w-5xl mx-auto p-6 md:p-10 pb-32">
                <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
                  <div className="flex-1 space-y-10">
                    {error || workspaceError ? (
                      <div className="p-4 rounded-2xl bg-red-50 text-red-600 border border-red-200 text-sm font-medium">
                        {error ?? workspaceError}
                      </div>
                    ) : null}

                    {/* Basic Info */}
                    <div className="space-y-6">
                      <div className="space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-widest text-[var(--text-tertiary)] px-1">
                          Item Name
                        </label>
                        <input
                          type="text"
                          value={entryDraft?.name ?? ""}
                          onChange={(e) => handleFieldChange("name", e.target.value)}
                          placeholder="Ex: The Master Sword"
                          className="w-full bg-transparent border-none outline-none text-4xl font-black text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]/30 p-0"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)] ml-1">
                            Rarity
                          </label>
                          <select
                            value={entryDraft?.attributes?.rarity || "Common"}
                            onChange={(e) => handleAttributeChange("rarity", e.target.value)}
                            className="w-full bg-[var(--background-surface)] border border-[var(--border-ui)]/50 rounded-2xl px-4 py-3 text-sm font-bold text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer hover:border-emerald-500/30"
                          >
                            <option value="Common">Common</option>
                            <option value="Uncommon">Uncommon</option>
                            <option value="Rare">Rare</option>
                            <option value="Epic">Epic</option>
                            <option value="Legendary">Legendary</option>
                            <option value="Artifact">Artifact</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)] ml-1">
                            Current Value
                          </label>
                          <input
                            type="text"
                            value={entryDraft?.attributes?.value || ""}
                            onChange={(e) => handleAttributeChange("value", e.target.value)}
                            placeholder="Ex: 500 Gold"
                            className="w-full bg-[var(--background-surface)] border border-[var(--border-ui)]/50 rounded-2xl px-4 py-3 text-sm font-bold text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all hover:border-emerald-500/30"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)] ml-1">
                            Owner
                          </label>
                          <select
                            value={entryDraft?.attributes?.owner_id || ""}
                            onChange={(e) => handleAttributeChange("owner_id", e.target.value)}
                            className="w-full bg-[var(--background-surface)] border border-[var(--border-ui)]/50 rounded-2xl px-4 py-3 text-sm font-bold text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer hover:border-emerald-500/30"
                          >
                            <option value="">Unassigned</option>
                            {worldElements
                              .filter((el) => el.type === "character")
                              .map((char) => (
                                <option key={char.id} value={char.id}>
                                  {char.name || "Untitled Character"}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Image Upload Area */}
                    <div className="group relative">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-[32px] blur opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative bg-[var(--background-surface)] border border-[var(--border-ui)]/50 rounded-[30px] overflow-hidden aspect-[21/9] flex items-center justify-center group-hover:border-emerald-500/30 transition-all shadow-sm">
                        {entryDraft?.attributes?.item_image_url ? (
                          <>
                            {itemImageUrl ? (
                              <img
                                src={itemImageUrl}
                                alt={entryDraft?.name || "Item"}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-[var(--background-app)] animate-pulse" />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                              <button
                                onClick={() => setSelectorOpen(true)}
                                className="px-6 py-2.5 rounded-full bg-white text-black font-bold text-sm shadow-xl hover:scale-105 active:scale-95 transition-all"
                              >
                                Change Image
                              </button>
                              <button
                                onClick={() => handleAttributeChange("item_image_url", "")}
                                className="px-6 py-2.5 rounded-full bg-red-600/90 text-white font-bold text-sm shadow-xl hover:scale-105 active:scale-95 transition-all"
                              >
                                Remove
                              </button>
                            </div>
                          </>
                        ) : (
                          <button
                            onClick={() => setSelectorOpen(true)}
                            className="flex flex-col items-center gap-4 text-[var(--text-tertiary)] hover:text-emerald-500 transition-colors"
                          >
                            <div className="w-16 h-16 rounded-full bg-[var(--background-app)] border border-[var(--border-ui)]/50 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                              <Upload className="w-6 h-6" />
                            </div>
                            <div className="text-center">
                              <p className="font-bold text-sm">Upload Cover Image</p>
                              <p className="text-[10px] font-medium opacity-60">PNG, JPG up to 10MB</p>
                            </div>
                          </button>
                        )}
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          className="hidden"
                          accept="image/*"
                        />
                      </div>
                    </div>

                    {/* Description Editor */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">
                          Item Lore & Description
                        </label>
                      </div>
                      <div className="min-h-[400px] bg-[var(--background-surface)] border border-[var(--border-ui)]/50 rounded-[32px] p-6 focus-within:border-emerald-500/30 transition-all">
                        <RichTextEditor
                          value={entryDraft?.description ?? ""}
                          onChange={(content) => handleFieldChange("description", content)}
                          placeholder="Tell the story of this item..."
                          mentionItems={mentionEntities}
                        />
                      </div>
                    </div>

                    {/* Attachments Area */}
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)] px-1">
                        Connected Elements
                      </label>
                      <LoreAttachmentPicker
                        attachedLoreIds={(() => {
                          try {
                            return typeof entryDraft?.attributes?.attached_lore === 'string' 
                              ? JSON.parse(entryDraft.attributes.attached_lore) 
                              : [];
                          } catch {
                            return [];
                          }
                        })()}
                        onChange={(ids) => handleAttributeChange("attached_lore", JSON.stringify(ids))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <FileSelectorModal
        isOpen={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={(path) => {
          handleAttributeChange("item_image_url", path);
          setSelectorOpen(false);
        }}
        title="Select Item Image"
      />
    </div>
  );
}
