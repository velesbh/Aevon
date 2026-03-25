"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, User as UserIcon, Loader2, Trash2, Search, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import {
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Select,
  Stack,
  Typography,
  useTheme,
  FormControl,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { CharacterDetailsEditor } from "@/components/dashboard/character-details-editor";
import { 
  getCharacterAttributes, 
  getCharacterImagePath, 
  createCharacterImageSignedUrl,
  type WorldElementRecord 
} from "@/lib/workspace";
import { useDashboardWorkspace } from "./workspace-provider";
import { useTranslation } from "@/lib/i18n";
import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

function CharacterPortrait({ imagePath, name }: { imagePath: string; name: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const theme = useTheme();

  useEffect(() => {
    let active = true;
    (async () => {
      if (!imagePath) {
        if (active) {
          setUrl(null);
        }
        return;
      }

      try {
        const signed = await createCharacterImageSignedUrl(imagePath);
        if (active) {
          setUrl(signed);
        }
      } catch {
        if (active) {
          setUrl(null);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [imagePath]);

  if (!url) {
    return (
      <Box
        sx={{
          width: "100%",
          height: "100%",
          bgcolor: alpha(theme.palette.background.paper, 0.5),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: alpha(theme.palette.text.secondary, 0.6),
        }}
      >
        <UserIcon size={20} />
      </Box>
    );
  }

  return (
    <Box sx={{ position: "absolute", inset: 0 }}>
      <Image src={url} alt={name} fill unoptimized style={{ objectFit: "cover" }} />
    </Box>
  );
}

export function CharacterWorkspacePanel({ className }: { className?: string }) {
  const {
    characters,
    createWorldElementRecord,
    deleteWorldElementRecord,
    error: workspaceError,
    loading,
    removeCharacterImageRecord,
    saveWorldElementRecord,
    selectedCharacterId,
    setSelectedCharacterId,
    uploadCharacterImageRecord,
  } = useDashboardWorkspace();
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const urlId = searchParams.get("id");
  const router = useRouter();

  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const theme = useTheme();

  // Sync with URL
  useEffect(() => {
    if (urlId && urlId !== selectedCharacterId) {
      setSelectedCharacterId(urlId);
    }
  }, [urlId, selectedCharacterId, setSelectedCharacterId]);

  const selectedCharacter = useMemo(
    () => characters.find((character) => character.id === (urlId || selectedCharacterId)) || null,
    [characters, urlId, selectedCharacterId]
  );

  const filteredCharacters = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return characters;
    return characters.filter(c => 
      c.name.toLowerCase().includes(query) || 
      (c.description ?? "").toLowerCase().includes(query)
    );
  }, [characters, searchQuery]);

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    setStatus(null);

    try {
      const created = await createWorldElementRecord("character");
      setSelectedCharacterId(created.id);
      const params = new URLSearchParams(window.location.search);
      params.set("id", created.id);
      router.push(`${window.location.pathname}?${params.toString()}`);
      setStatus(t("char.created"));
      setTimeout(() => setStatus(null), 3000);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : t("char.createError"));
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async (
    id: string,
    updates: Parameters<typeof saveWorldElementRecord>[1],
  ) => {
    setSaving(true);
    setError(null);
    setStatus(null);

    try {
      await saveWorldElementRecord(id, updates);
      setStatus(t("char.saved"));
      setTimeout(() => setStatus(null), 3000);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t("char.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    setError(null);
    setStatus(null);

    try {
      await deleteWorldElementRecord(id);
      setStatus(t("char.deleted"));
      setSelectedCharacterId(null);
      router.push("/dashboard/characters");
      setTimeout(() => setStatus(null), 3000);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : t("char.deleteError"));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--background-surface)]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-[var(--background-app)] overflow-hidden", className)}>


      <main className="flex-1 overflow-hidden flex flex-col relative">
        <AnimatePresence mode="wait">
          {!selectedCharacter ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar"
            >
              <div className="max-w-6xl mx-auto space-y-8">
                {/* Topbar removed for cleaner UI */}

                {filteredCharacters.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-[var(--border-ui)]/50 rounded-3xl bg-[var(--background-surface)]/30">
                    <div className="w-16 h-16 rounded-3xl bg-[var(--background-app)] flex items-center justify-center mb-4 border border-[var(--border-ui)]/50 shadow-sm">
                      <UserIcon className="w-8 h-8 text-[var(--text-tertiary)]" />
                    </div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">
                      {searchQuery ? "No matching characters found" : "No characters yet"}
                    </h3>
                    <p className="text-[var(--text-secondary)] text-sm mb-6 max-w-xs mx-auto">
                      {searchQuery ? "Try a different search term or clear the filter." : "Start by creating your first character."}
                    </p>
                    <button
                      onClick={handleCreate}
                      disabled={creating}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--text-primary)] text-[var(--background-app)] text-sm font-bold hover:scale-105 active:scale-95 transition-all shadow-lg"
                    >
                      {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      <span>Add New Character</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                    {filteredCharacters.map((character) => (
                      <CharacterCard
                        key={character.id}
                        character={character}
                        onClick={() => {
                          const params = new URLSearchParams(window.location.search);
                          params.set("id", character.id);
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
              className="flex-1 flex flex-col min-h-0"
            >
              <CharacterDetailsEditor
                key={selectedCharacter.id}
                character={selectedCharacter}
                layout="page"
                saving={saving}
                deleting={deleting}
                status={status}
                error={error ?? workspaceError}
                onSave={handleSave}
                onDelete={handleDelete}
                onUploadImage={uploadCharacterImageRecord}
                onRemoveImage={removeCharacterImageRecord}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function CharacterCard({ character, onClick }: { character: WorldElementRecord; onClick: () => void }) {
  const imagePath = getCharacterImagePath(character.attributes);
  const [url, setUrl] = useState<string | null>(null);
  const attributes = getCharacterAttributes(character.attributes);

  useEffect(() => {
    let active = true;
    if (!imagePath) return;
    createCharacterImageSignedUrl(imagePath).then(signedUrl => {
      if (active) setUrl(signedUrl);
    });
    return () => { active = false; };
  }, [imagePath]);

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer flex flex-col rounded-[24px] border border-[var(--border-ui)] bg-[var(--background-app)] overflow-hidden shadow-sm hover:border-emerald-500/50 transition-all duration-300 relative aspect-[4/5]"
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent z-10" />
      
      {url ? (
        <img
          src={url}
          alt={character.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--background-surface)]">
          <UserIcon className="w-12 h-12 text-[var(--text-tertiary)] opacity-20" />
        </div>
      )}

      <div className="mt-auto p-6 relative z-20">
        <div className="flex items-center gap-2 mb-2">
          {attributes.role && (
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 backdrop-blur-md">
              {attributes.role}
            </span>
          )}
          {attributes.status && (
            <span className="text-[10px] font-black uppercase tracking-widest text-white/80 bg-white/10 px-2.5 py-1 rounded-full border border-white/20 backdrop-blur-md">
              {attributes.status}
            </span>
          )}
        </div>
        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">
          {character.name || "Untitled"}
        </h3>
        {attributes.summary && (
          <p className="text-sm text-white/60 line-clamp-2 leading-relaxed">
            {attributes.summary.replace(/<[^>]+>/g, '')}
          </p>
        )}
      </div>
    </div>
  );
}
