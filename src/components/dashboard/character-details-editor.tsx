"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Loader2, Save, Trash2, UploadCloud, X } from "lucide-react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
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
import type { MentionEntity } from "@/components/rich-text/mention-suggestion";
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
  | "status";

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
      attachedLoreIds = JSON.parse(raw);
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

const SectionCard = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
      <Stack spacing={1.5} sx={{ mb: 3 }}>
        <Typography variant="overline" sx={{ letterSpacing: 2, fontWeight: 700, color: "text.secondary" }}>
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        )}
      </Stack>
      {children}
    </CardContent>
  </Card>
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

  const fieldConfig: Array<{ key: CharacterFieldKey; label: string; rows?: number }> = [
    { key: "role", label: t("char.field.role") },
    { key: "status", label: t("char.field.status") },
    { key: "summary", label: t("char.field.summary"), rows: 4 },
    { key: "appearance", label: t("char.field.appearance"), rows: 4 },
    { key: "personality", label: t("char.field.personality"), rows: 4 },
    { key: "motivation", label: t("char.field.motivation"), rows: 4 },
    { key: "conflict", label: t("char.field.conflict"), rows: 4 },
    { key: "arc", label: t("char.field.arc"), rows: 4 },
    { key: "notes", label: t("char.field.notes"), rows: 6 },
  ];

  const { worldElements } = useDashboardWorkspace();
  const mentionEntities: MentionEntity[] = useMemo(
    () =>
      worldElements
        .filter((el) => ["character", "location", "item", "lore"].includes(el.type))
        .map((element) => ({
          id: element.id,
          label: element.name || "Untitled",
          type: element.type as MentionEntity["type"],
        })),
    [worldElements],
  );

  const [form, setForm] = useState<CharacterFormState | null>(() => (character ? getCharacterFormState(character) : null));
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageActionLoading, setImageActionLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const imagePath = character ? getCharacterImagePath(character.attributes) : "";
  const theme = useTheme();

  useEffect(() => {
    setForm(character ? getCharacterFormState(character) : null);
  }, [character]);

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
        if (active) {
          setImageUrl(signedUrl);
        }
      } catch (loadError) {
        if (active) {
          setImageError(loadError instanceof Error ? loadError.message : t("char.error.load_portrait"));
          setImageUrl(null);
        }
      } finally {
        if (active) {
          setImageLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [imagePath, t]);

  const isDirty = useMemo(() => {
    if (!character || !form) {
      return false;
    }

    const baseline = getCharacterFormState(character);
    return JSON.stringify(baseline) !== JSON.stringify(form);
  }, [character, form]);

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
        attached_lore: JSON.stringify(form.attached_lore),
      }),
    });
  };

  useEffect(() => {
    if (!isDirty || saving) return;
    const timer = setTimeout(() => {
      void handleSave();
    }, 2000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, isDirty, saving]);

  const handleImageSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file || !onUploadImage) {
      return;
    }

    setImageActionLoading(true);
    setImageError(null);

    try {
      await onUploadImage(character.id, file);
    } catch (uploadError) {
      setImageError(uploadError instanceof Error ? uploadError.message : t("char.error.upload_portrait"));
    } finally {
      setImageActionLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = async () => {
    if (!onRemoveImage) {
      return;
    }

    setImageActionLoading(true);
    setImageError(null);

    try {
      await onRemoveImage(character.id);
    } catch (removeError) {
      setImageError(removeError instanceof Error ? removeError.message : t("char.error.remove_portrait"));
    } finally {
      setImageActionLoading(false);
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

  const supportingFields = fieldConfig.slice(3, 8);
  const noteField = fieldConfig[8];

  return (
    <Stack sx={{ flex: 1, minHeight: 0, minWidth: 0 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 3, md: 5 },
          py: { xs: 2, md: 3 },
          borderBottom: "1px solid",
          borderColor: "divider",
          position: "sticky",
          top: 0,
          zIndex: 2,
          bgcolor: "background.paper",
          boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
          <Avatar sx={{ bgcolor: "success.main", color: "common.white", fontWeight: 800, textTransform: "uppercase" }}>
            {(form.name || "?").slice(0, 2)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" fontWeight={800} noWrap>
              {form.name || t("characters.untitled")}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              {form.role && (
                <Chip label={form.role} size="small" color="success" variant="outlined" sx={{ fontWeight: 700 }} />
              )}
              {isDirty && (
                <Chip label={t("char.status.unsaved")} size="small" color="warning" variant="outlined" sx={{ fontWeight: 700 }} />
              )}
            </Stack>
          </Box>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">
          <AnimatePresence mode="wait">
            {status && (
              <motion.div
                key={status}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <Chip label={status} color="success" variant="outlined" size="small" />
              </motion.div>
            )}
            {error && (
              <motion.div
                key={error}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <Chip label={error} color="error" variant="outlined" size="small" />
              </motion.div>
            )}
          </AnimatePresence>

          {saving && <CircularProgress size={16} color="success" />}
          {onDelete && (
            <IconButton
              color="error"
              onClick={() => void onDelete(character.id)}
              disabled={deleting}
              sx={{ border: "1px solid", borderColor: "divider" }}
            >
              {deleting ? <CircularProgress size={20} /> : <Trash2 size={18} />}
            </IconButton>
          )}
        </Stack>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", p: { xs: 2, md: 4 }, bgcolor: "background.default" }} className="custom-scrollbar">
        <Stack spacing={3} sx={{ maxWidth: 1080, mx: "auto" }}>
          <SectionCard title={t("characters.basic_info.title")} description={t("characters.basic_info.description")}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Stack spacing={2} alignItems="center">
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelection} hidden />
                  <Paper
                    elevation={0}
                    sx={{
                      width: "100%",
                      pt: "150%",
                      position: "relative",
                      borderRadius: 4,
                      border: "1px dashed",
                      borderColor: imageUrl ? "divider" : "success.light",
                      bgcolor: "background.default",
                      overflow: "hidden",
                    }}
                  >
                    {imageLoading ? (
                      <Stack alignItems="center" justifyContent="center" sx={{ position: "absolute", inset: 0 }}>
                        <CircularProgress color="success" />
                      </Stack>
                    ) : imageUrl ? (
                      <>
                        <Image src={imageUrl} alt="Portrait" fill unoptimized style={{ objectFit: "cover" }} />
                        {onRemoveImage && (
                          <Stack direction="row" spacing={1} sx={{ position: "absolute", bottom: 12, right: 12 }}>
                            <Button
                              variant="contained"
                              size="small"
                              color="error"
                              startIcon={<X size={14} />}
                              onClick={() => void handleRemoveImage()}
                              disabled={imageActionLoading}
                            >
                              {t("characters.actions.remove")}
                            </Button>
                          </Stack>
                        )}
                      </>
                    ) : (
                      <Stack
                        alignItems="center"
                        justifyContent="center"
                        spacing={1}
                        sx={{ position: "absolute", inset: 0, color: "text.secondary" }}
                      >
                        {imageActionLoading ? (
                          <CircularProgress size={28} color="success" />
                        ) : (
                          <UploadCloud size={28} />
                        )}
                        <Typography variant="body2" fontWeight={600}>
                          {t("characters.actions.select_portrait")}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t("characters.actions.upload_pick")}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                          <Button variant="outlined" size="small" onClick={() => fileInputRef.current?.click()}>
                            {t("char.action.upload")}
                          </Button>
                          <Button variant="contained" size="small" color="success" onClick={() => setSelectorOpen(true)}>
                            {t("char.action.browse")}
                          </Button>
                        </Stack>
                      </Stack>
                    )}
                  </Paper>
                  {imageError && (
                    <Alert severity="error" variant="filled" sx={{ width: "100%" }}>
                      {imageError}
                    </Alert>
                  )}
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, md: 8 }}>
                <Stack spacing={3}>
                  <TextField
                    label={t("char.field.name")}
                    value={form.name}
                    onChange={(event) => setForm((current) => (current ? { ...current, name: event.target.value } : current))}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 3,
                        fontWeight: 700,
                        fontSize: 20,
                      },
                    }}
                  />

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label={t("char.field.role")}
                        value={form.role}
                        placeholder={t("char.placeholder.role")}
                        onChange={(event) => setForm((current) => (current ? { ...current, role: event.target.value } : current))}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label={t("char.field.status")}
                        value={form.status}
                        placeholder={t("char.placeholder.status")}
                        onChange={(event) => setForm((current) => (current ? { ...current, status: event.target.value } : current))}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </Grid>

                  <LoreAttachmentPicker
                    attachedLoreIds={form.attached_lore}
                    onChange={(ids) => setForm((current) => (current ? { ...current, attached_lore: ids } : current))}
                  />

                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary", fontWeight: 700 }}>
                      {t("char.field.summary")}
                    </Typography>
                    <RichTextEditor
                      key={`editor-summary-${character.id}`}
                      value={form.summary}
                      onChange={(value) => setForm((current) => (current ? { ...current, summary: value } : current))}
                      mentionItems={mentionEntities}
                      placeholder={t("char.details.summary_placeholder")}
                      className="min-h-[120px]"
                    />
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </SectionCard>

          <SectionCard title={t("char.details.section.detail")} description={t("char.details.section.detailDesc")}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary", fontWeight: 700 }}>
                  {t("char.details.background_label")}
                </Typography>
                <RichTextEditor
                  key={`editor-desc-${character.id}`}
                  value={form.description}
                  onChange={(value) => setForm((current) => (current ? { ...current, description: value } : current))}
                  mentionItems={mentionEntities}
                  placeholder={t("char.details.background_placeholder")}
                  className="min-h-[160px]"
                />
              </Box>

              <Grid container spacing={2}>
                {supportingFields.map((field) => (
                  <Grid size={{ xs: 12, md: 6 }} key={field.key}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary", fontWeight: 700 }}>
                      {field.label}
                    </Typography>
                    <RichTextEditor
                      key={`editor-${field.key}-${character.id}`}
                      value={form[field.key] as string}
                      onChange={(value) => setForm((current) => (current ? { ...current, [field.key]: value } : current))}
                      mentionItems={mentionEntities}
                      className="min-h-[120px]"
                    />
                  </Grid>
                ))}
              </Grid>
            </Stack>
          </SectionCard>

          <SectionCard title={t("char.field.notes")} description={t("char.details.section.notesDesc")}>
            <RichTextEditor
              key={`editor-${noteField.key}-${character.id}`}
              value={form[noteField.key] as string}
              onChange={(value) => setForm((current) => (current ? { ...current, [noteField.key]: value } : current))}
              mentionItems={mentionEntities}
              placeholder={t("char.details.notes_placeholder")}
              className="min-h-[180px]"
            />
          </SectionCard>
        </Stack>
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



