"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Plus, Search, User as UserIcon } from "lucide-react";
import Image from "next/image";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CircularProgress,
  InputAdornment,
  List,
  ListItem,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { CharacterDetailsEditor } from "@/components/dashboard/character-details-editor";
import { getCharacterAttributes, getCharacterImagePath, createCharacterImageSignedUrl } from "@/lib/workspace";
import { useDashboardWorkspace } from "./workspace-provider";
import { useTranslation } from "@/lib/i18n";

function CharacterPortrait({ imagePath, name }: { imagePath: string; name: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const theme = useTheme();

  useEffect(() => {
    let active = true;
    if (!imagePath) {
      setUrl(null);
      return () => {
        active = false;
      };
    }

    createCharacterImageSignedUrl(imagePath)
      .then((signedUrl) => {
        if (active) setUrl(signedUrl);
      })
      .catch(() => {
        if (active) setUrl(null);
      });

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
    activeProjectTitle,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const theme = useTheme();

  const filteredCharacters = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return characters;
    }

    return characters.filter((character) => {
      const attributes = getCharacterAttributes(character.attributes);
      const haystack = [
        character.name,
        attributes.role,
        attributes.summary,
        attributes.appearance,
        attributes.personality,
        attributes.motivation,
        attributes.conflict,
        attributes.arc,
        attributes.notes,
        attributes.status,
        character.description ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [characters, searchQuery]);

  useEffect(() => {
    if (filteredCharacters.length === 0) {
      return;
    }

    if (!selectedCharacterId || !filteredCharacters.some((character) => character.id === selectedCharacterId)) {
      setSelectedCharacterId(filteredCharacters[0].id);
    }
  }, [filteredCharacters, selectedCharacterId, setSelectedCharacterId]);

  const selectedCharacter =
    filteredCharacters.length === 0
      ? searchQuery.trim()
        ? null
        : characters.find((character) => character.id === selectedCharacterId) ?? null
      : filteredCharacters.find((character) => character.id === selectedCharacterId) ?? filteredCharacters[0] ?? null;

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    setStatus(null);

    try {
      const created = await createWorldElementRecord("character");
      setSelectedCharacterId(created.id);
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
      setTimeout(() => setStatus(null), 3000);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : t("char.deleteError"));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Box
        className={className}
        sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", bgcolor: "background.default" }}
      >
        <CircularProgress color="success" />
      </Box>
    );
  }

  return (
    <Box
      className={className}
      sx={{ display: "flex", flex: 1, minHeight: 0, width: "100%", bgcolor: "background.default", position: "relative" }}
    >
      <Box
        component="aside"
        sx={{
          width: { xs: "100%", md: 360, lg: 420 },
          flexShrink: 0,
          borderRight: { xs: "none", md: "1px solid" },
          borderColor: "divider",
          display: { xs: selectedCharacterId ? "none" : "flex", md: "flex" },
          flexDirection: "column",
          bgcolor: "background.paper",
          boxShadow: { xs: "none", md: "4px 0 32px rgba(0,0,0,0.14)" },
          zIndex: 2,
          minHeight: 0,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            px: 4,
            py: 3,
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: alpha(theme.palette.background.paper, 0.9),
            backdropFilter: "blur(12px)",
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={800} color="text.primary">
              {t("char.title")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {activeProjectTitle ?? t("ms.noProject")}
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="success"
            size="small"
            onClick={() => void handleCreate()}
            disabled={creating}
            startIcon={creating ? <CircularProgress size={14} color="inherit" /> : <Plus size={16} />}
            sx={{ borderRadius: 999, fontWeight: 700, boxShadow: "0 12px 24px rgba(16,185,129,0.25)" }}
          >
            {creating ? t("char.creating") : t("char.new")}
          </Button>
        </Stack>

        <Box sx={{ px: 4, py: 3, borderBottom: "1px solid", borderColor: "divider" }}>
          <TextField
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t("char.searchPlaceholder")}
            fullWidth
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={16} />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 999,
                bgcolor: "background.default",
                fontWeight: 500,
                "& fieldset": { borderColor: alpha(theme.palette.divider, 0.7) },
                "&:hover fieldset": { borderColor: theme.palette.success.light },
                "&.Mui-focused fieldset": {
                  borderColor: theme.palette.success.main,
                  boxShadow: `0 0 0 2px ${alpha(theme.palette.success.main, 0.15)}`,
                },
              },
            }}
          />
        </Box>

        <Box sx={{ flex: 1, overflowY: "auto", p: 3 }} className="custom-scrollbar">
          {filteredCharacters.length > 0 ? (
            <List
              disablePadding
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                gap: 2,
                listStyle: "none",
              }}
            >
              {filteredCharacters.map((character) => {
                const attributes = getCharacterAttributes(character.attributes);
                const isActive = selectedCharacter?.id === character.id;
                const imagePath = getCharacterImagePath(character.attributes);

                return (
                  <ListItem key={character.id} disablePadding sx={{ display: "block" }}>
                    <Card
                      elevation={0}
                      sx={{
                        borderRadius: 4,
                        border: "2px solid",
                        borderColor: isActive ? "success.main" : alpha(theme.palette.divider, 0.8),
                        bgcolor: alpha(theme.palette.background.paper, 0.95),
                        transition: "all 0.3s ease",
                        boxShadow: isActive
                          ? "0 18px 40px rgba(16,185,129,0.3)"
                          : "0 10px 28px rgba(15,23,42,0.12)",
                        transform: isActive ? "translateY(-4px)" : "none",
                        overflow: "hidden",
                      }}
                    >
                      <CardActionArea
                        onClick={() => {
                          setSelectedCharacterId(character.id);
                          setStatus(null);
                          setError(null);
                        }}
                        sx={{ position: "relative" }}
                      >
                        <Box sx={{ position: "relative", width: "100%", pt: "133%" }}>
                          <CharacterPortrait imagePath={imagePath} name={character.name} />
                          <Box
                            sx={{
                              position: "absolute",
                              inset: 0,
                              background: "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%)",
                              opacity: 0.9,
                            }}
                          />
                          <Stack sx={{ position: "absolute", inset: 0, p: 2, justifyContent: "flex-end" }} spacing={0.5}>
                            <Typography variant="caption" sx={{ color: "success.light", fontWeight: 700, textTransform: "uppercase" }}>
                              {attributes.role || t("char.unassigned")}
                            </Typography>
                            <Typography variant="subtitle2" sx={{ color: "common.white", fontWeight: 800 }} noWrap>
                              {character.name || t("char.untitled")}
                            </Typography>
                          </Stack>
                        </Box>
                      </CardActionArea>
                    </Card>
                  </ListItem>
                );
              })}
            </List>
          ) : (
            <Stack spacing={2} alignItems="center" justifyContent="center" sx={{ py: 10, color: "text.secondary", textAlign: "center" }}>
              <UserIcon size={32} />
              <Typography variant="body2" fontWeight={500}>
                {searchQuery ? t("char.noMatch") : t("char.noChar")}
              </Typography>
            </Stack>
          )}
        </Box>
      </Box>

      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", position: "relative" }}>
        {selectedCharacter && (
          <Box sx={{ position: "absolute", inset: 0, opacity: 0.07, pointerEvents: "none" }}>
            <CharacterPortrait imagePath={getCharacterImagePath(selectedCharacter.attributes)} name={selectedCharacter.name} />
            <Box sx={{ position: "absolute", inset: 0, bgcolor: alpha(theme.palette.background.default, 0.8), backdropFilter: "blur(30px)" }} />
          </Box>
        )}

        <Box sx={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              alignItems: "center",
              justifyContent: "space-between",
              px: 2,
              py: 1.5,
              borderBottom: "1px solid",
              borderColor: "divider",
              bgcolor: alpha(theme.palette.background.paper, 0.9),
              backdropFilter: "blur(14px)",
            }}
          >
            <Button
              size="small"
              startIcon={<ChevronLeft size={16} />}
              onClick={() => setSelectedCharacterId(null)}
              sx={{ fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}
            >
              {t("char.mobileRoster")}
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {t("char.entries").replace("{count}", filteredCharacters.length.toString())}
            </Typography>
          </Box>

          <CharacterDetailsEditor
            key={selectedCharacter ? `${selectedCharacter.id}-${selectedCharacter.updated_at}` : "empty-character"}
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
        </Box>
      </Box>
    </Box>
  );
}
