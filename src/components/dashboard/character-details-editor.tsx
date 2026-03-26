"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Loader2, Save, Trash2, UploadCloud, X, ImagePlus, Layers, User, BookOpen, Plus, RefreshCw, Sparkles, User as UserIcon, Heart, FileText, Anchor, Backpack } from "lucide-react";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  buildCharacterAttributes,
  createCharacterImageSignedUrl,
  getCharacterAttributes,
  getCharacterImagePath,
  type CharacterAttributes,
  type WorldElementRecord,
} from "@/lib/workspace";
import { motion, AnimatePresence } from "framer-motion";
import { FileSelectorModal } from "./file-selector-modal";
import { RichTextEditor } from "@/components/rich-text/rich-text-editor";
import { useTranslation } from "@/lib/i18n";
import { useDashboardWorkspace } from "@/components/dashboard/workspace-provider";
import type { MentionEntity } from "@/components/rich-text/mention-data";
import { LoreAttachmentPicker } from "@/components/dashboard/lore-attachment-picker";

type CharacterFormState = {
  name: string;
  description: string;
  attached_lore: string[];
} & CharacterAttributes;

type CharacterFieldKey =
  | "role"
  | "summary"
  | "appearance"
  | "personality"
  | "motivation"
  | "conflict"
  | "arc"
  | "notes"
  | "status"
  | "nationality"
  | "age"
  | "occupation";

interface CharacterDetailsEditorProps {
  character: WorldElementRecord | null;
  onSave: (
    id: string,
    updates: Partial<Pick<WorldElementRecord, "name" | "description" | "attributes">>,
  ) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onUploadImage?: (id: string, file: File) => Promise<unknown>;
  onRemoveImage?: (id: string) => Promise<unknown>;
  saving?: boolean;
  deleting?: boolean;
  status?: string | null;
  error?: string | null;
  layout?: "sidebar" | "page";
}

function getCharacterFormState(character: WorldElementRecord): CharacterFormState {
  const attributes = getCharacterAttributes(character.attributes);

  let attachedLoreIds: string[] = [];
  try {
    const raw = (character.attributes as any)?.attached_lore;
    if (typeof raw === "string") {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        attachedLoreIds = parsed;
      }
    }
  } catch {
    // ignore invalid json
  }

  return {
    name: character.name,
    description: character.description ?? "",
    attached_lore: attachedLoreIds,
    ...attributes,
  };
}

const MaterialCard = ({
  title,
  icon: Icon,
  children,
  action,
}: {
  title: string;
  icon?: any;
  children: React.ReactNode;
  action?: React.ReactNode;
}) => (
  <Card 
    elevation={0} 
    className="surface-raised"
    sx={{ 
      borderRadius: 4, 
      border: "1px solid", 
      borderColor: "divider", 
      bgcolor: "background.paper",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      transition: "box-shadow 0.2s ease",
      "&:hover": {
        boxShadow: "0 4px 20px rgba(0,0,0,0.05)"
      }
    }}
  >
    <Box sx={{ px: 3, py: 2, borderBottom: "1px solid", borderColor: "divider", display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        {Icon && <Icon size={18} className="text-[var(--text-secondary)]" />}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: "text.primary" }}>
          {title}
        </Typography>
      </Stack>
      {action}
    </Box>
    <CardContent sx={{ p: { xs: 2, md: 3 }, flex: 1, display: "flex", flexDirection: "column" }}>
      {children}
    </CardContent>
  </Card>
);

const MinimalRichText = ({ value, onChange, placeholder, mentionItems, minHeight = "120px" }: any) => (
  <Box sx={{ 
    "& .ProseMirror": { 
      minHeight, 
      padding: 0,
      border: "none",
      "&:focus-visible": { outline: "none" }
    },
    "& .rich-text-editor-container": {
      border: "none !important",
      boxShadow: "none !important",
      p: 0,
      "&:hover": { border: "none !important" },
      "&:focus-within": { border: "none !important", boxShadow: "none !important" }
    },
    "& .rich-text-toolbar": {
      borderBottom: "1px solid",
      borderColor: "divider",
      mb: 2,
      pb: 1,
      px: 0,
    }
  }}>
    <RichTextEditor
      value={value}
      onChange={onChange}
      mentionItems={mentionItems}
      placeholder={placeholder}
      className={`min-h-[${minHeight}]`}
    />
  </Box>
);

export function CharacterDetailsEditor({
  character,
  onSave,
  onDelete,
  onUploadImage,
  onRemoveImage,
  saving = false,
  deleting = false,
  status,
  error,
}: CharacterDetailsEditorProps) {
  const { t } = useTranslation();

  const { worldElements } = useDashboardWorkspace();
  const mentionEntities: MentionEntity[] = useMemo(
    () =>
      worldElements
        .filter((el) => ["character", "location", "item", "lore"].includes(el.type))
        .map((element) => ({
          id: element.id,
          label: element.name || "Untitled",
          type: element.type as MentionEntity["type"],
          description: element.description ?? undefined,
          folderId: element.project_id,
          folderName: t("characters.activeProject") || "Current project",
          folderCategory: element.project_id === character?.project_id ? "active" : "shared",
          imageUrl: undefined,
        })),
    [worldElements, t, character?.project_id],
  );

  const [form, setForm] = useState<CharacterFormState | null>(() => {
    if (!character || !character.id) return null;
    try {
      return getCharacterFormState(character);
    } catch {
      return null;
    }
  });
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageActionLoading, setImageActionLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const imagePath = character ? getCharacterImagePath(character.attributes) : "";
  const [activeTab, setActiveTab] = useState(0);

  // Variants state (stored in attributes as JSON)
  type Variant = { id: string; label: string; imagePath: string; imageUrl?: string };
  const [variants, setVariants] = useState<Variant[]>(() => {
    try {
      const raw = (character?.attributes as any)?.variants;
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [variantImageLoading, setVariantImageLoading] = useState<Record<string, boolean>>({});
  const [variantUrls, setVariantUrls] = useState<Record<string, string>>({});
  const variantFileInputRef = useRef<HTMLInputElement | null>(null);
  const [addingVariant, setAddingVariant] = useState(false);

  // Load variant signed URLs
  useEffect(() => {
    let active = true;
    for (const v of variants) {
      if (!v.imagePath || variantUrls[v.id]) continue;
      setVariantImageLoading(prev => ({ ...prev, [v.id]: true }));
      createCharacterImageSignedUrl(v.imagePath).then((url: string | null) => {
        if (active) {
          setVariantUrls(prev => ({ ...prev, [v.id]: url ?? '' }));
          setVariantImageLoading(prev => ({ ...prev, [v.id]: false }));
        }
      }).catch(() => {
        if (active) setVariantImageLoading(prev => ({ ...prev, [v.id]: false }));
      });
    }
    return () => { active = false; };
  }, [variants]);

  const handleAddVariant = async (file: File) => {
    if (!onUploadImage || !character) return;
    setAddingVariant(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      if (!supabase) throw new Error('Supabase not available');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const ext = file.name.split('.').pop();
      const filePath = `${user.id}/variants/${character.id}/${crypto.randomUUID()}.${ext}`;
      
      const { error } = await supabase.storage.from('workspace-files').upload(filePath, file, { upsert: false });
      if (error) throw error;
      
      const newVariant: Variant = { id: crypto.randomUUID(), label: `Variant ${variants.length + 1}`, imagePath: filePath };
      const newVariants = [...variants, newVariant];
      setVariants(newVariants);
      
      if (character) {
        await onSave(character.id, {
          attributes: buildCharacterAttributes(character.attributes, {
            variants: JSON.stringify(newVariants),
          })
        });
      }
    } catch (e) {
      console.error('Failed to add variant', e);
    } finally {
      setAddingVariant(false);
    }
  };

  const handleRemoveVariant = async (variantId: string) => {
    if (!character) return;
    const newVariants = variants.filter(v => v.id !== variantId);
    setVariants(newVariants);
    await onSave(character.id, {
      attributes: buildCharacterAttributes(character.attributes, {
        variants: JSON.stringify(newVariants),
      })
    });
  };

  const handleSetPrimaryVariant = async (variant: Variant) => {
    if (!character || !onSave) return;
    const newPrimaryPath = variant.imagePath;
    await onSave(character.id, {
      attributes: buildCharacterAttributes(character.attributes, {
        image_path: newPrimaryPath,
        image_updated_at: new Date().toISOString(),
      }),
    });
  };

  const handleVariantLabelChange = (variantId: string, label: string) => {
    const newVariants = variants.map(v => v.id === variantId ? { ...v, label } : v);
    setVariants(newVariants);
  };

  const handleSaveVariantLabels = async () => {
    if (!character) return;
    await onSave(character.id, {
      attributes: buildCharacterAttributes(character.attributes, {
        variants: JSON.stringify(variants),
      })
    });
  };

  const isDirty = useMemo(() => {
    if (!character || !form) return false;
    try {
      const baseline = getCharacterFormState(character);
      return JSON.stringify(baseline) !== JSON.stringify(form);
    } catch {
      return false;
    }
  }, [character, form]);

  const prevCharacterIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (!character) {
      setForm(null);
      prevCharacterIdRef.current = null;
      return;
    }
    
    const currentCharacterId = character.id;
    const isCharacterChanged = prevCharacterIdRef.current !== currentCharacterId;
    
    if (isCharacterChanged || !form) {
      try {
        const baseline = getCharacterFormState(character);
        setForm(baseline);
        prevCharacterIdRef.current = currentCharacterId;
      } catch (error) {
        console.error("Error setting form state:", error);
        setForm(null);
      }
    } else if (!isDirty && !saving) {
      try {
        const baseline = getCharacterFormState(character);
        setForm(baseline);
      } catch (error) {
        console.error("Error resetting form state:", error);
      }
    }
  }, [character, isDirty, saving]);

  useEffect(() => {
    let active = true;
    void (async () => {
      if (!imagePath) {
        if (active) {
          setImageUrl(null);
          setImageError(null);
          setImageLoading(false);
        }
        return;
      }
      if (active) {
        setImageLoading(true);
        setImageError(null);
      }
      try {
        const signedUrl = await createCharacterImageSignedUrl(imagePath);
        if (active) setImageUrl(signedUrl);
      } catch (loadError) {
        if (active) {
          setImageError(loadError instanceof Error ? loadError.message : t("char.error.load_portrait"));
          setImageUrl(null);
        }
      } finally {
        if (active) setImageLoading(false);
      }
    })();
    return () => { active = false; };
  }, [imagePath, t]);

  if (!character || !form) {
    return (
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", p: 4 }}>
        <Typography color="text.secondary">{t("characters.empty_state")}</Typography>
      </Box>
    );
  }

  const handleSave = async () => {
    await onSave(character.id, {
      name: form.name,
      description: form.description,
      attributes: buildCharacterAttributes(character.attributes, {
        role: form.role,
        summary: form.summary,
        appearance: form.appearance,
        personality: form.personality,
        motivation: form.motivation,
        conflict: form.conflict,
        arc: form.arc,
        notes: form.notes,
        status: form.status,
        nationality: form.nationality,
        age: form.age,
        occupation: form.occupation,
        attached_lore: JSON.stringify(form.attached_lore),
      }),
    });
  };

  useEffect(() => {
    if (!isDirty || saving) return;
    const timer = setTimeout(() => { void handleSave(); }, 2000);
    return () => clearTimeout(timer);
  }, [form, isDirty, saving]);

  const handleImageSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onUploadImage) return;
    setImageActionLoading(true);
    setImageError(null);
    try {
      await onUploadImage(character.id, file);
    } catch (uploadError) {
      setImageError(uploadError instanceof Error ? uploadError.message : t("char.error.upload_portrait"));
    } finally {
      setImageActionLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAssignImage = async (filePath: string) => {
    setImageActionLoading(true);
    setImageError(null);
    try {
      await onSave(character.id, {
        attributes: buildCharacterAttributes(character.attributes, {
          image_path: filePath,
          image_updated_at: new Date().toISOString(),
        }),
      });
    } catch (assignError) {
      setImageError(assignError instanceof Error ? assignError.message : t("char.error.assign_portrait"));
    } finally {
      setImageActionLoading(false);
    }
  };

  return (
    <Stack sx={{ flex: 1, minHeight: 0, minWidth: 0, bgcolor: "background.default" }}>
      {/* HEADER */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 3, md: 5 },
          py: { xs: 2, md: 2.5 },
          borderBottom: "1px solid",
          borderColor: "divider",
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: "background.paper",
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" fontWeight={800} noWrap>
              {form.name || t("characters.untitled")}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              {isDirty && (
                <Chip label={t("char.status.unsaved")} size="small" color="warning" variant="outlined" sx={{ fontWeight: 700 }} />
              )}
            </Stack>
          </Box>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">
          <AnimatePresence mode="wait">
            {status && (
              <motion.div key={status} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                <Typography variant="caption" sx={{ color: "success.main", fontWeight: 600 }}>{status}</Typography>
              </motion.div>
            )}
            {error && (
              <motion.div key={error} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                <Typography variant="caption" sx={{ color: "error.main", fontWeight: 600 }}>{error}</Typography>
              </motion.div>
            )}
          </AnimatePresence>

          {saving && <RefreshCw size={16} className="text-[var(--primary)] animate-spin" />}
          {onDelete && (
            <IconButton color="error" onClick={() => void onDelete(character.id)} disabled={deleting} sx={{ border: "1px solid", borderColor: "divider" }}>
              {deleting ? <CircularProgress size={20} /> : <Trash2 size={18} />}
            </IconButton>
          )}
        </Stack>
      </Box>

      {/* TABS */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', px: { xs: 2, md: 4 } }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} textColor="inherit" TabIndicatorProps={{ style: { backgroundColor: '#10b981' } }}>
          <Tab icon={<UserIcon size={14} />} iconPosition="start" label="Details" sx={{ textTransform: 'none', fontWeight: 600, minHeight: 44 }} />
          <Tab icon={<Layers size={14} />} iconPosition="start" label={`Variants (${variants.length})`} sx={{ textTransform: 'none', fontWeight: 600, minHeight: 44 }} />
          <Tab icon={<Backpack size={14} />} iconPosition="start" label="Backpack" sx={{ textTransform: 'none', fontWeight: 600, minHeight: 44 }} />
        </Tabs>
      </Box>

      {/* CONTENT */}
      <Box sx={{ flex: 1, overflowY: "auto", p: { xs: 2, md: 4 } }} className="custom-scrollbar">
        <Box sx={{ maxWidth: 1400, mx: "auto" }}>
          
          {activeTab === 0 && (
            <Grid container spacing={3}>
              {/* LEFT COLUMN: Basic Info & Physical Traits */}
              <Grid size={{ xs: 12, lg: 4 }}>
                <Stack spacing={3}>
                  <MaterialCard title="Basic Information" icon={UserIcon}>
                    <Stack spacing={3} alignItems="center" sx={{ mb: 2 }}>
                      <Box sx={{ position: "relative", width: 140, height: 140 }}>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelection} hidden />
                        <Avatar 
                          src={imageUrl || undefined}
                          sx={{ 
                            width: 140, 
                            height: 140, 
                            bgcolor: "success.main", 
                            fontSize: 56,
                            fontWeight: 700,
                            border: "4px solid",
                            borderColor: "background.paper",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                            cursor: "pointer",
                            transition: "transform 0.2s",
                            "&:hover": { transform: "scale(1.02)" },
                            "&:hover::after": {
                              content: '""',
                              position: "absolute",
                              inset: 0,
                              bgcolor: "rgba(0,0,0,0.3)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "50%"
                            }
                          }}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {!imageUrl && (form.name || "?").slice(0, 2).toUpperCase()}
                        </Avatar>
                        {imageLoading && (
                          <CircularProgress size={140} color="success" sx={{ position: "absolute", top: 0, left: 0, zIndex: 2 }} />
                        )}
                        <IconButton
                          size="small"
                          color="primary"
                          sx={{
                            position: "absolute",
                            bottom: 0,
                            right: 0,
                            bgcolor: "background.paper",
                            boxShadow: 2,
                            "&:hover": { bgcolor: "background.default" }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                        >
                          <ImagePlus size={18} />
                        </IconButton>
                      </Box>
                      {imageError && (
                        <Typography color="error" variant="caption" sx={{ display: "block", textAlign: "center" }}>
                          {imageError}
                        </Typography>
                      )}
                    </Stack>

                    <Stack spacing={2.5}>
                      <TextField
                        variant="standard"
                        fullWidth
                        label="Name"
                        value={form.name}
                        onChange={(event) => setForm((current) => (current ? { ...current, name: event.target.value } : current))}
                        InputProps={{ disableUnderline: true, sx: { fontSize: '1.25rem', fontWeight: 800, borderBottom: '1px solid', borderColor: 'divider', pb: 0.5 } }}
                        InputLabelProps={{ shrink: true, sx: { fontWeight: 600, color: 'success.main', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.75rem' } }}
                      />
                      <TextField
                        variant="standard"
                        fullWidth
                        label="Role"
                        placeholder="e.g. Protagonist"
                        value={form.role || ""}
                        onChange={(event) => setForm((current) => (current ? { ...current, role: event.target.value } : current))}
                        InputProps={{ disableUnderline: true, sx: { fontSize: '1rem', fontWeight: 500, borderBottom: '1px solid', borderColor: 'divider', pb: 0.5 } }}
                        InputLabelProps={{ shrink: true, sx: { fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.75rem' } }}
                      />
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 6 }}>
                          <TextField
                            variant="standard"
                            fullWidth
                            label="Age"
                            placeholder="e.g. 24"
                            value={form.age || ""}
                            onChange={(event) => setForm((current) => (current ? { ...current, age: event.target.value } : current))}
                            InputProps={{ disableUnderline: true, sx: { fontSize: '0.875rem', fontWeight: 500, borderBottom: '1px solid', borderColor: 'divider', pb: 0.5 } }}
                            InputLabelProps={{ shrink: true, sx: { fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.75rem' } }}
                          />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <TextField
                            variant="standard"
                            fullWidth
                            label="Status"
                            placeholder="e.g. Alive"
                            value={form.status || ""}
                            onChange={(event) => setForm((current) => (current ? { ...current, status: event.target.value } : current))}
                            InputProps={{ disableUnderline: true, sx: { fontSize: '0.875rem', fontWeight: 500, borderBottom: '1px solid', borderColor: 'divider', pb: 0.5 } }}
                            InputLabelProps={{ shrink: true, sx: { fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.75rem' } }}
                          />
                        </Grid>
                      </Grid>
                      <TextField
                        variant="standard"
                        fullWidth
                        label="Nationality"
                        value={form.nationality || ""}
                        onChange={(event) => setForm((current) => (current ? { ...current, nationality: event.target.value } : current))}
                        InputProps={{ disableUnderline: true, sx: { fontSize: '0.875rem', fontWeight: 500, borderBottom: '1px solid', borderColor: 'divider', pb: 0.5 } }}
                        InputLabelProps={{ shrink: true, sx: { fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.75rem' } }}
                      />
                      <TextField
                        variant="standard"
                        fullWidth
                        label="Occupation"
                        value={form.occupation || ""}
                        onChange={(event) => setForm((current) => (current ? { ...current, occupation: event.target.value } : current))}
                        InputProps={{ disableUnderline: true, sx: { fontSize: '0.875rem', fontWeight: 500, borderBottom: '1px solid', borderColor: 'divider', pb: 0.5 } }}
                        InputLabelProps={{ shrink: true, sx: { fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.75rem' } }}
                      />
                    </Stack>
                  </MaterialCard>

                  <MaterialCard title="Physical Traits" icon={Sparkles}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, display: "block", mb: 1 }}>
                        Appearance
                      </Typography>
                      <MinimalRichText
                        value={form.appearance || ""}
                        onChange={(value: string) => setForm((current) => (current ? { ...current, appearance: value } : current))}
                        mentionItems={mentionEntities}
                        placeholder="Describe their physical appearance, clothing, distinguishing marks..."
                        minHeight="150px"
                      />
                    </Box>
                  </MaterialCard>
                </Stack>
              </Grid>

              {/* RIGHT COLUMN: Bio & Personality & Notes */}
              <Grid size={{ xs: 12, lg: 8 }}>
                <Stack spacing={3}>
                  <MaterialCard title="Bio & Backstory" icon={BookOpen}>
                    <Stack spacing={3} sx={{ flex: 1 }}>
                      <Box>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, display: "block", mb: 1 }}>
                          Summary
                        </Typography>
                        <MinimalRichText
                          value={form.summary || ""}
                          onChange={(value: string) => setForm((current) => (current ? { ...current, summary: value } : current))}
                          mentionItems={mentionEntities}
                          placeholder="A brief summary of who they are..."
                          minHeight="80px"
                        />
                      </Box>
                      <Divider sx={{ borderColor: "divider", opacity: 0.5 }} />
                      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, display: "block", mb: 1 }}>
                          Full Background
                        </Typography>
                        <Box sx={{ flex: 1 }}>
                          <MinimalRichText
                            value={form.description || ""}
                            onChange={(value: string) => setForm((current) => (current ? { ...current, description: value } : current))}
                            mentionItems={mentionEntities}
                            placeholder="Write their full backstory here..."
                            minHeight="250px"
                          />
                        </Box>
                      </Box>
                    </Stack>
                  </MaterialCard>

                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <MaterialCard title="Personality Traits" icon={Heart}>
                        <Stack spacing={3} sx={{ flex: 1 }}>
                          <Box>
                            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, display: "block", mb: 1 }}>
                              Personality
                            </Typography>
                            <MinimalRichText
                              value={form.personality || ""}
                              onChange={(value: string) => setForm((current) => (current ? { ...current, personality: value } : current))}
                              mentionItems={mentionEntities}
                              placeholder="Describe their personality..."
                              minHeight="100px"
                            />
                          </Box>
                          <Divider sx={{ borderColor: "divider", opacity: 0.5 }} />
                          <Box>
                            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, display: "block", mb: 1 }}>
                              Motivation
                            </Typography>
                            <MinimalRichText
                              value={form.motivation || ""}
                              onChange={(value: string) => setForm((current) => (current ? { ...current, motivation: value } : current))}
                              mentionItems={mentionEntities}
                              placeholder="What drives them?"
                              minHeight="100px"
                            />
                          </Box>
                        </Stack>
                      </MaterialCard>
                    </Grid>
                    
                    <Grid size={{ xs: 12, md: 6 }}>
                      <MaterialCard title="Character Arc" icon={Anchor}>
                        <Stack spacing={3} sx={{ flex: 1 }}>
                          <Box>
                            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, display: "block", mb: 1 }}>
                              Internal Conflict
                            </Typography>
                            <MinimalRichText
                              value={form.conflict || ""}
                              onChange={(value: string) => setForm((current) => (current ? { ...current, conflict: value } : current))}
                              mentionItems={mentionEntities}
                              placeholder="What are they struggling with internally?"
                              minHeight="100px"
                            />
                          </Box>
                          <Divider sx={{ borderColor: "divider", opacity: 0.5 }} />
                          <Box>
                            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, display: "block", mb: 1 }}>
                              Development Arc
                            </Typography>
                            <MinimalRichText
                              value={form.arc || ""}
                              onChange={(value: string) => setForm((current) => (current ? { ...current, arc: value } : current))}
                              mentionItems={mentionEntities}
                              placeholder="How do they change over the story?"
                              minHeight="100px"
                            />
                          </Box>
                        </Stack>
                      </MaterialCard>
                    </Grid>
                  </Grid>

                  <MaterialCard title="Notes & Attachments" icon={FileText}>
                    <Stack spacing={3}>
                      <LoreAttachmentPicker
                        attachedLoreIds={form.attached_lore}
                        onChange={(ids) => setForm((current) => (current ? { ...current, attached_lore: ids } : current))}
                      />
                      <Divider sx={{ borderColor: "divider", opacity: 0.5 }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, display: "block", mb: 1 }}>
                          Additional Notes
                        </Typography>
                        <MinimalRichText
                          value={form.notes || ""}
                          onChange={(value: string) => setForm((current) => (current ? { ...current, notes: value } : current))}
                          mentionItems={mentionEntities}
                          placeholder="Any extra details, trivia, or notes..."
                          minHeight="120px"
                        />
                      </Box>
                    </Stack>
                  </MaterialCard>

                </Stack>
              </Grid>
            </Grid>
          )}

          {/* === VARIANTS TAB === */}
          {activeTab === 1 && (
            <Box sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                  <Typography variant="h6" fontWeight={700}>Character Variants</Typography>
                  <Typography variant="body2" color="text.secondary">Add different looks, outfits, or alternate images for this character.</Typography>
                </Box>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={addingVariant ? <CircularProgress size={14} color="inherit" /> : <Plus size={16} />}
                  onClick={() => variantFileInputRef.current?.click()}
                  disabled={addingVariant}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                >
                  Add Variant
                </Button>
                <input
                  ref={variantFileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) await handleAddVariant(file);
                    if (variantFileInputRef.current) variantFileInputRef.current.value = "";
                  }}
                />
              </Box>

              {variants.length === 0 ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 6, textAlign: 'center', borderRadius: 4,
                    border: '2px dashed', borderColor: 'divider',
                    bgcolor: 'background.default',
                  }}
                >
                  <Layers size={40} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                  <Typography fontWeight={600} color="text.secondary">No variants yet.</Typography>
                  <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>Upload images to create variants for this character.</Typography>
                </Paper>
              ) : (
                <Grid container spacing={3}>
                  {variants.map((variant) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={variant.id}>
                      <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                        <Box sx={{ position: 'relative', pt: '120%', bgcolor: 'background.default' }}>
                          {variantImageLoading[variant.id] ? (
                            <Stack sx={{ position: 'absolute', inset: 0 }} alignItems="center" justifyContent="center">
                              <CircularProgress color="success" size={28} />
                            </Stack>
                          ) : variantUrls[variant.id] ? (
                            <Image src={variantUrls[variant.id]} alt={variant.label} fill unoptimized style={{ objectFit: 'cover' }} />
                          ) : (
                            <Stack sx={{ position: 'absolute', inset: 0 }} alignItems="center" justifyContent="center">
                              <ImagePlus size={28} style={{ opacity: 0.3 }} />
                            </Stack>
                          )}
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveVariant(variant.id)}
                            sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'background.paper', boxShadow: 1 }}
                          >
                            <X size={14} />
                          </IconButton>
                        </Box>
                        <CardContent sx={{ pt: 1.5, pb: '12px !important' }}>
                          <Stack spacing={1}>
                            <TextField
                              size="small"
                              value={variant.label}
                              onChange={(e) => handleVariantLabelChange(variant.id, e.target.value)}
                              onBlur={handleSaveVariantLabels}
                              placeholder="Label (e.g. Summer Outfit)"
                              fullWidth
                              variant="outlined"
                              InputProps={{ sx: { borderRadius: 2, fontWeight: 600, fontSize: '0.875rem' } }}
                            />
                            <Button
                              size="small"
                              variant="outlined"
                              color="success"
                              fullWidth
                              startIcon={<ImagePlus size={14} />}
                              onClick={() => handleSetPrimaryVariant(variant)}
                              sx={{ 
                                borderRadius: 1.5, 
                                textTransform: 'none', 
                                fontWeight: 700, 
                                fontSize: '0.75rem',
                                border: '1px solid',
                                borderColor: 'success.main'
                              }}
                            >
                              Set as Primary
                            </Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}

          {/* === BACKPACK TAB === */}
          {activeTab === 2 && (
            <Box sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                  <Typography variant="h6" fontWeight={700}>Backpack / Inventory</Typography>
                  <Typography variant="body2" color="text.secondary">Items assigned to this character.</Typography>
                </Box>
              </Box>

              <Grid container spacing={3}>
                {worldElements.filter(el => el.type === "item" && (el.attributes as any)?.owner_id === character?.id).length === 0 ? (
                  <Grid size={{ xs: 12 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 6, textAlign: 'center', borderRadius: 4,
                        border: '2px dashed', borderColor: 'divider',
                        bgcolor: 'background.default',
                      }}
                    >
                      <Backpack size={40} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                      <Typography fontWeight={600} color="text.secondary">Backpack is empty.</Typography>
                      <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>Assign items to this character in the Items section.</Typography>
                    </Paper>
                  </Grid>
                ) : (
                  worldElements.filter(el => el.type === "item" && (el.attributes as any)?.owner_id === character?.id).map((item) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
                      <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                        <CardContent sx={{ pt: 2, pb: '16px !important' }}>
                          <Stack spacing={1}>
                            <Typography variant="subtitle1" fontWeight={700}>{item.name}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {item.description ? item.description.replace(/<[^>]*>?/gm, '') : "No description."}
                            </Typography>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))
                )}
              </Grid>
            </Box>
          )}

        </Box>
      </Box>

      <FileSelectorModal
        isOpen={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={handleAssignImage}
        onUploadClick={() => fileInputRef.current?.click()}
        title={t("char.details.portrait_title")}
      />
    </Stack>
  );
}
