"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useTranslation } from "@/lib/i18n";
import {
  ArrowLeft,
  Compass,
  ImagePlus,
  Loader2,
  MapPinned,
  MapPin,
  Plus,
  Save,
  Trash2,
  Search,
  X,
  PanelRightClose,
  PanelRightOpen,
  Map as MapIcon,
} from "lucide-react";
import { useDashboardWorkspace } from "@/components/dashboard/workspace-provider";
import { cn } from "@/lib/utils";
import { getAttributeText, createCharacterImageSignedUrl } from "@/lib/workspace";
import { FileSelectorModal } from "@/components/dashboard/file-selector-modal";
import { RichTextEditor, type MentionEntity } from "@/components/rich-text/rich-text-editor";
import { InteractiveMap, type MapWaypoint } from "@/components/dashboard/maps/interactive-map";
import { useRouter } from "next/navigation";

function getWaypoints(value?: string | null): MapWaypoint[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) =>
          typeof item === "object" && item
            ? {
                id: String(item.id ?? crypto.randomUUID()),
                x: Number(item.x ?? 0),
                y: Number(item.y ?? 0),
                name: String(item.name ?? "Waypoint"),
                notes: String(item.notes ?? ""),
              }
            : null,
        )
        .filter(Boolean) as MapWaypoint[];
    }
  } catch {
    return [];
  }
  return [];
}

function serializeWaypoints(waypoints: MapWaypoint[]): string {
  return JSON.stringify(
    waypoints.map((waypoint) => ({
      id: waypoint.id,
      x: Number(Number(waypoint.x).toFixed(3)),
      y: Number(Number(waypoint.y).toFixed(3)),
      name: waypoint.name,
      notes: waypoint.notes,
    })),
  );
}

export default function MapsPage() {
  const { t } = useTranslation();
  const {
    worldElements,
    loading,
    error,
    createWorldElementRecord,
    saveWorldElementRecord,
    deleteWorldElementRecord,
    activeProjectTitle,
  } = useDashboardWorkspace();
  const router = useRouter();

  const mapElements = worldElements.filter((element) => element.type === "location");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(true);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

  const [entryDraft, setEntryDraft] = useState<{
    id: string;
    name: string;
    description: string;
    attributes: Record<string, string>;
  } | null>(null);

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

  const serializedWaypoints = entryDraft?.attributes?.waypoints ?? "";
  const waypoints = useMemo(() => getWaypoints(serializedWaypoints), [serializedWaypoints]);
  const [selectedWaypointId, setSelectedWaypointId] = useState<string | null>(null);

  const selectedElement = useMemo(
    () => mapElements.find((el) => el.id === selectedId) || null,
    [mapElements, selectedId],
  );

  // Filtered maps based on search
  const filteredMaps = useMemo(() => {
    if (!searchQuery.trim()) return mapElements;
    const query = searchQuery.toLowerCase();
    return mapElements.filter((map) => {
      const name = (map.name || "").toLowerCase();
      const region = (getAttributeText(map.attributes, "region") || "").toLowerCase();
      return name.includes(query) || region.includes(query);
    });
  }, [mapElements, searchQuery]);

  useEffect(() => {
    if (!selectedElement) {
      setEntryDraft(null);
      setSelectedWaypointId(null);
      setMapUrl(null);
      return;
    }

    const newDraft = {
      id: selectedElement.id,
      name: selectedElement.name ?? "",
      description: selectedElement.description ?? "",
      attributes: {
        region: getAttributeText(selectedElement.attributes, "region"),
        map_url: getAttributeText(selectedElement.attributes, "map_url"),
        waypoints: getAttributeText(selectedElement.attributes, "waypoints"),
      },
    };
    setEntryDraft(newDraft);
    setSelectedWaypointId(null);
  }, [selectedElement]);

  useEffect(() => {
    const url = entryDraft?.attributes?.map_url;
    if (!url) {
      setMapUrl(null);
      return;
    }
    if (url.startsWith("http")) {
      setMapUrl(url);
      return;
    }

    let active = true;
    createCharacterImageSignedUrl(url)
      .then((signed) => {
        if (active) {
          setMapUrl(signed);
        }
      })
      .catch(() => setMapUrl(null));

    return () => {
      active = false;
    };
  }, [entryDraft?.attributes?.map_url]);

  const handleDraftChange = (key: string, value: string) => {
    setEntryDraft((current) =>
      current
        ? {
            ...current,
            attributes: {
              ...current.attributes,
              [key]: value,
            },
          }
        : current,
    );
  };

  const handleWaypointUpdate = (nextWaypoints: MapWaypoint[]) => {
    handleDraftChange("waypoints", serializeWaypoints(nextWaypoints));
  };

  const handleSave = async () => {
    if (!entryDraft) return;
    setSaving(true);
    setErrorMessage(null);

    try {
      await saveWorldElementRecord(entryDraft.id, {
        name: entryDraft.name,
        description: entryDraft.description,
        attributes: {
          ...(typeof selectedElement?.attributes === 'object' && selectedElement?.attributes !== null ? selectedElement.attributes : {}),
          region: entryDraft.attributes.region,
          map_url: entryDraft.attributes.map_url,
          waypoints: entryDraft.attributes.waypoints,
        },
      });
      setStatus("Changes saved");
      setTimeout(() => setStatus(null), 3000);
    } catch (saveError) {
      setErrorMessage(saveError instanceof Error ? saveError.message : "Unable to save map");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!entryDraft) return;
    setDeleting(true);
    setErrorMessage(null);
    try {
      await deleteWorldElementRecord(entryDraft.id);
      setSelectedId(null);
      setEntryDraft(null);
      setStatus("Map deleted");
      setTimeout(() => setStatus(null), 3000);
    } catch (deleteError) {
      setErrorMessage(deleteError instanceof Error ? deleteError.message : "Unable to delete map");
    } finally {
      setDeleting(false);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    setErrorMessage(null);
    try {
      const created = await createWorldElementRecord("location");
      await saveWorldElementRecord(created.id, {
        attributes: {
          ...(typeof created.attributes === 'object' && created.attributes !== null ? created.attributes : {}),
          map_url: "",
          waypoints: serializeWaypoints([]),
        },
      });
      setSelectedId(created.id);
      setEntryDraft({
        id: created.id,
        name: created.name,
        description: created.description ?? "",
        attributes: {
          region: "",
          map_url: "",
          waypoints: serializeWaypoints([]),
        },
      });
      setStatus("Map created");
      setTimeout(() => setStatus(null), 3000);
    } catch (createError) {
      setErrorMessage(createError instanceof Error ? createError.message : "Unable to create map");
    } finally {
      setCreating(false);
    }
  };

  const handleSelectFile = (path: string) => {
    handleDraftChange("map_url", path);
  };

  const isDirty = useMemo(() => {
    if (!selectedElement || !entryDraft) return false;

    return (
      selectedElement.name !== entryDraft.name ||
      (selectedElement.description ?? "") !== entryDraft.description ||
      getAttributeText(selectedElement.attributes, "region") !== entryDraft.attributes.region ||
      getAttributeText(selectedElement.attributes, "map_url") !== entryDraft.attributes.map_url ||
      getAttributeText(selectedElement.attributes, "waypoints") !== entryDraft.attributes.waypoints
    );
  }, [selectedElement, entryDraft]);

  if (loading) {
    return (
      <div className="flex flex-1 min-h-0 items-center justify-center bg-[var(--background-surface)]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-row overflow-hidden bg-[var(--background-surface)]">
      {/* LEFT PANEL: Map List */}
      <aside 
        className={cn(
          "flex flex-col border-r border-[var(--border-ui)] bg-[var(--background-surface)] transition-all duration-300 ease-in-out",
          isSidebarOpen ? "w-[320px] min-w-[320px]" : "w-0 min-w-0 overflow-hidden border-r-0"
        )}
      >
        <div className="flex items-center justify-between border-b border-[var(--border-ui)]/50 px-4 py-3">
            <div className="flex items-center gap-2">
                <MapIcon className="h-5 w-5 text-emerald-500" />
                <h2 className="text-sm font-bold text-[var(--text-primary)]">{t('maps.title')}</h2>
            </div>
            <button
                onClick={handleCreate}
                disabled={creating}
                className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--background-app)] hover:text-emerald-500"
                title={t('maps.new')}
            >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </button>
        </div>

        <div className="border-b border-[var(--border-ui)]/50 p-3">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`${t('maps.searchPlaceholder')} (Ctrl+K)`}
                    className="w-full rounded-lg bg-[var(--background-app)] py-2 pl-9 pr-8 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:ring-1 focus:ring-emerald-500/50"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                    >
                        <X className="h-3 w-3" />
                    </button>
                )}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
            {filteredMaps.length === 0 ? (
                <div className="py-10 text-center text-sm text-[var(--text-tertiary)]">
                    {searchQuery ? "No maps found matching your search." : "No maps yet. Create one to begin."}
                </div>
            ) : (
                <div className="space-y-1">
                    {filteredMaps.map((element) => {
                        const isActive = element.id === selectedId;
                        return (
                            <button
                                key={element.id}
                                onClick={() => setSelectedId(element.id)}
                                className={cn(
                                    "flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-all",
                                    isActive
                                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                        : "text-[var(--text-secondary)] hover:bg-[var(--background-app)]"
                                )}
                            >
                                <Compass className={cn("mt-0.5 h-4 w-4 shrink-0", isActive ? "text-emerald-600 dark:text-emerald-400" : "text-[var(--text-tertiary)]")} />
                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-sm font-medium">
                                        {element.name || "Untitled Map"}
                                    </div>
                                    <div className="truncate text-xs text-[var(--text-tertiary)]">
                                        {getAttributeText(element.attributes, "region") || "Uncharted Region"}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
      </aside>

      {/* CENTER PANEL: Map Viewport */}
      <main className="relative flex flex-1 flex-col overflow-hidden bg-[var(--background-app)]">
        {/* Viewport Header / Toolbar */}
        <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent px-4 py-4 text-white pointer-events-none">
            <div className="flex items-center gap-2 pointer-events-auto">
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="rounded-lg bg-black/40 p-2 text-white/80 backdrop-blur-md transition-colors hover:bg-black/60 hover:text-white"
                    title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                >
                    <ArrowLeft className={cn("h-4 w-4 transition-transform", !isSidebarOpen && "rotate-180")} />
                </button>
                {entryDraft && (
                    <div className="flex flex-col drop-shadow-md">
                        <h1 className="text-lg font-bold leading-tight">{entryDraft.name || "Untitled Map"}</h1>
                        <span className="text-xs font-medium opacity-80">{entryDraft.attributes.region || "Unknown Region"}</span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 pointer-events-auto">
                 {entryDraft && (
                    <button
                         onClick={() => setIsDetailsPanelOpen(!isDetailsPanelOpen)}
                         className={cn(
                             "rounded-lg p-2 backdrop-blur-md transition-colors",
                             isDetailsPanelOpen ? "bg-emerald-500 text-white shadow-lg" : "bg-black/40 text-white/80 hover:bg-black/60 hover:text-white"
                         )}
                         title="Toggle Details"
                    >
                         {isDetailsPanelOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
                    </button>
                 )}
            </div>
        </div>

        {/* Map Canvas */}
        <div className="flex-1 relative h-full w-full bg-[#1a1a1a]">
           {entryDraft ? (
               <InteractiveMap
                  imageUrl={mapUrl}
                  waypoints={waypoints}
                  selectedWaypointId={selectedWaypointId}
                  onAddWaypoint={({ xPercent, yPercent }) => {
                    const newWaypoint: MapWaypoint = {
                      id: crypto.randomUUID(),
                      x: xPercent,
                      y: yPercent,
                      name: `Point ${waypoints.length + 1}`,
                      notes: "",
                    };
                    handleWaypointUpdate([...waypoints, newWaypoint]);
                    setSelectedWaypointId(newWaypoint.id);
                    if (!isDetailsPanelOpen) setIsDetailsPanelOpen(true);
                  }}
                  onSelectWaypoint={(id) => {
                      setSelectedWaypointId(id);
                      if (!isDetailsPanelOpen) setIsDetailsPanelOpen(true);
                  }}
                  disabled={!entryDraft.attributes.map_url}
               >
                   {!entryDraft.attributes.map_url && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/40 backdrop-blur-sm p-4 text-center">
                            <p className="text-lg font-semibold text-white drop-shadow-md">
                                This map has no image yet.
                            </p>
                            <button
                                onClick={() => setSelectorOpen(true)}
                                className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-emerald-500 transition-colors"
                            >
                                Select Map Image
                            </button>
                        </div>
                   )}
               </InteractiveMap>
           ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-[var(--text-tertiary)]">
                     <MapPinned className="h-16 w-16 opacity-20" />
                     <p>Select a map from the sidebar to view details.</p>
                </div>
           )}
        </div>
      </main>

      {/* RIGHT PANEL: Details & Properties */}
      {entryDraft && (
        <aside 
            className={cn(
                "flex flex-col border-l border-[var(--border-ui)] bg-[var(--background-surface)] transition-all duration-300 ease-in-out shadow-xl z-20",
                isDetailsPanelOpen ? "w-[360px] min-w-[360px]" : "w-0 min-w-0 overflow-hidden border-l-0"
            )}
        >
             {/* Toolbar */}
            <div className="flex items-center justify-between border-b border-[var(--border-ui)]/50 px-4 py-3 bg-[var(--background-surface)]">
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">{t('maps.details.properties')}</span>
                <div className="flex items-center gap-2">
                     <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="rounded-md p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600"
                        title="Delete Map"
                     >
                        {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                     </button>
                     <button
                        onClick={handleSave}
                        disabled={saving || !isDirty}
                        className={cn(
                            "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all",
                            isDirty 
                                ? "bg-emerald-600 text-white shadow-md hover:bg-emerald-500" 
                                : "bg-[var(--background-app)] text-[var(--text-tertiary)] cursor-default opacity-50"
                        )}
                     >
                        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        Save
                     </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* General Settings */}
                <div className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">Map Name</label>
                        <input
                            type="text"
                            value={entryDraft.name}
                            onChange={(e) => setEntryDraft(curr => curr ? { ...curr, name: e.target.value } : curr)}
                            className="w-full rounded-lg border border-[var(--border-ui)] bg-[var(--background-app)] px-3 py-2 text-sm outline-none focus:border-emerald-500/50"
                            placeholder="e.g. The Northern Wastes"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">Region</label>
                            <input
                                type="text"
                                value={entryDraft.attributes.region ?? ""}
                                onChange={(e) => handleDraftChange("region", e.target.value)}
                                className="w-full rounded-lg border border-[var(--border-ui)] bg-[var(--background-app)] px-3 py-2 text-sm outline-none focus:border-emerald-500/50"
                                placeholder="Realm or Area"
                            />
                         </div>
                         <div>
                             <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">Coordinates</label>
                             <div className="rounded-lg border border-[var(--border-ui)] bg-[var(--background-app)] px-3 py-2 text-sm text-[var(--text-tertiary)] cursor-not-allowed">
                                 Auto-generated
                             </div>
                         </div>
                    </div>

                    <div>
                        <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)]">
                            <span>Image Source</span>
                            <button onClick={() => setSelectorOpen(true)} className="text-emerald-500 hover:text-emerald-600 hover:underline">Change</button>
                        </label>
                        <div className="flex items-center gap-2 rounded-lg border border-[var(--border-ui)] bg-[var(--background-app)] p-2">
                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-black/10">
                                {mapUrl ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img src={mapUrl} alt="Preview" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-[var(--text-tertiary)]">
                                        <ImagePlus className="h-4 w-4" />
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs text-[var(--text-secondary)]">
                                    {entryDraft.attributes.map_url || "No image selected"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="h-px w-full bg-[var(--border-ui)]/50" />

                {/* Selected Waypoint Editor */}
                {selectedWaypointId ? (
                    (() => {
                        const waypoint = waypoints.find(wp => wp.id === selectedWaypointId);
                        if (!waypoint) return null;
                        return (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-[var(--text-primary)]">Selected Point</h3>
                                    <button 
                                        onClick={() => {
                                            handleWaypointUpdate(waypoints.filter(wp => wp.id !== waypoint.id));
                                            setSelectedWaypointId(null);
                                        }}
                                        className="text-xs text-red-500 hover:text-red-600"
                                    >
                                        Delete
                                    </button>
                                </div>
                                <div className="space-y-3 rounded-xl border border-[var(--border-ui)] bg-[var(--background-app)]/50 p-4">
                                     <input
                                        type="text"
                                        value={waypoint.name}
                                        onChange={(e) => handleWaypointUpdate(
                                            waypoints.map(wp => wp.id === waypoint.id ? { ...wp, name: e.target.value } : wp)
                                        )}
                                        className="w-full bg-transparent text-sm font-semibold outline-none placeholder:font-normal"
                                        placeholder="Waypoint Name"
                                        autoFocus
                                     />
                                     <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--text-tertiary)]">
                                         <span className="rounded bg-[var(--background-app)] px-1.5 py-0.5 border border-[var(--border-ui)]">X: {waypoint.x.toFixed(1)}%</span>
                                         <span className="rounded bg-[var(--background-app)] px-1.5 py-0.5 border border-[var(--border-ui)]">Y: {waypoint.y.toFixed(1)}%</span>
                                     </div>
                                     <div className="h-px w-full bg-[var(--border-ui)]/50" />
                                     <RichTextEditor
                                        value={waypoint.notes}
                                        onChange={(value) => handleWaypointUpdate(
                                            waypoints.map(wp => wp.id === waypoint.id ? { ...wp, notes: value } : wp)
                                        )}
                                        mentionItems={mentionEntities}
                                        placeholder="Add notes about this location..."
                                        minHeight="120px"
                                        className="text-xs"
                                     />
                                     <button 
                                        onClick={() => setSelectedWaypointId(null)}
                                        className="mt-2 w-full rounded-lg border border-[var(--border-ui)] py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--background-app)]"
                                     >
                                         Back to List
                                     </button>
                                </div>
                            </div>
                        );
                    })()
                ) : (
                    <div className="space-y-3">
                        <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
                            Waypoints ({waypoints.length})
                        </h3>
                        {waypoints.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-[var(--border-ui)] p-6 text-center">
                                <MapPinned className="mx-auto mb-2 h-8 w-8 text-[var(--text-tertiary)] opacity-50" />
                                <p className="text-sm text-[var(--text-tertiary)]">
                                    Click anywhere on the map to create a waypoint.
                                </p>
                            </div>
                        ) : (
                            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                                {waypoints.map((wp) => (
                                    <button
                                        key={wp.id}
                                        onClick={() => setSelectedWaypointId(wp.id)}
                                        className="flex w-full items-center justify-between rounded-lg border border-[var(--border-ui)] bg-[var(--background-app)]/50 px-3 py-2 text-left text-sm transition-colors hover:border-emerald-500/30 hover:bg-[var(--background-app)]"
                                    >
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                            <span className="truncate font-medium text-[var(--text-secondary)]">
                                                {wp.name || "Untitled Point"}
                                            </span>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-1 text-[10px] text-[var(--text-tertiary)] font-mono opacity-70">
                                            <span>{Math.round(wp.x)},{Math.round(wp.y)}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="h-px w-full bg-[var(--border-ui)]/50" />

                {/* Map Description */}
                <div>
                     <label className="mb-2 block text-xs font-semibold text-[var(--text-secondary)]">Map Description</label>
                     <RichTextEditor
                        value={entryDraft.description}
                        onChange={(value) =>
                            setEntryDraft((current) => (current ? { ...current, description: value } : current))
                        }
                        mentionItems={mentionEntities}
                        placeholder="General notes about this map..."
                        minHeight="150px"
                     />
                </div>
            </div>
        </aside>
      )}

      <FileSelectorModal
        isOpen={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={(path) => {
          handleSelectFile(path);
          setSelectorOpen(false);
        }}
        title="Select Map Image"
      />

      {/* Notification Toast */}
      {status && (
          <div className="absolute bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-lg animate-in fade-in slide-in-from-bottom-4">
              {status}
          </div>
      )}
      
      {errorMessage && (
           <div className="absolute bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-lg animate-in fade-in slide-in-from-bottom-4">
              {errorMessage}
           </div>
      )}
    </div>
  );
}
