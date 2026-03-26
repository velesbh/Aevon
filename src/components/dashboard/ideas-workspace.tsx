"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  IconButton, 
  TextField, 
  InputAdornment,
  Button,
  Chip,
  Tooltip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import { 
  Search, 
  Plus, 
  Lightbulb, 
  Trash2, 
  ExternalLink,
  Calendar,
  Tag,
  X,
  Sparkles,
  Hash,
} from "lucide-react";
import { useDashboardWorkspace } from "@/components/dashboard/workspace-provider";
import { useLanguage } from "@/lib/i18n";

function extractTags(text: string): string[] {
  const matches = text.match(/@(\w+)/g);
  return matches ? [...new Set((matches ?? []).map((m) => m.slice(1)))] : [];
}

function renderTextWithTags(text: string) {
  const parts = text.split(/(@\w+)/g);
  return (parts ?? []).map((part, i) =>
    part.startsWith("@") ? (
      <span key={i} style={{ color: "var(--color-primary, #10b981)", fontWeight: 600 }}>
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export function IdeasWorkspace() {
  const router = useRouter();
  const { t } = useLanguage();
  const { worldElements, createQuickIdea, deleteWorldElementRecord } = useDashboardWorkspace();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeText, setComposeText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const ideas = useMemo(() => {
    return worldElements
      .filter((e) => e.type === "idea")
      .filter((e) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q || 
          e.name.toLowerCase().includes(q) ||
          (e.description?.toLowerCase() || "").includes(q);
        const matchesTag = !activeTag || 
          (e.description || "").toLowerCase().includes(`@${activeTag.toLowerCase()}`);
        return matchesSearch && matchesTag;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [worldElements, searchQuery, activeTag]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    worldElements
      .filter((e) => e.type === "idea")
      .forEach((e) => {
        extractTags(e.description || "").forEach((tag) => tagSet.add(tag));
      });
    return Array.from(tagSet).sort();
  }, [worldElements]);

  const handleCreateIdea = async () => {
    if (!composeText.trim()) return;
    setIsSaving(true);
    try {
      await createQuickIdea(composeText.trim());
      setComposeText("");
      setComposeOpen(false);
    } catch (e) {
      console.error("Failed to create idea", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteIdea = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this idea?")) {
      await deleteWorldElementRecord(id);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ 
        px: { xs: 2, md: 4 }, 
        pt: { xs: 2, md: 3 }, 
        pb: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ 
              p: 1, 
              borderRadius: 2, 
              bgcolor: 'rgba(16, 185, 129, 0.1)', 
              color: 'var(--color-primary, #10b981)',
              display: 'flex',
            }}>
              <Lightbulb size={20} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                {t("ideas.title")}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {ideas.length} {ideas.length === 1 ? "idea" : "ideas"}
              </Typography>
            </Box>
          </Stack>
          <Button
            variant="contained"
            size="small"
            startIcon={<Plus size={16} />}
            onClick={() => setComposeOpen(true)}
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none', 
              fontWeight: 700,
              px: 2.5,
              bgcolor: 'var(--color-primary, #10b981)',
              '&:hover': { bgcolor: 'var(--color-primary-dark, #059669)' },
            }}
          >
            {t("ideas.new")}
          </Button>
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <TextField
            size="small"
            placeholder={t("ideas.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ 
              flex: 1,
              maxWidth: 360,
              '& .MuiOutlinedInput-root': { borderRadius: 2 },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={16} style={{ color: 'var(--text-tertiary)' }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery("")}>
                    <X size={14} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
          {allTags.length > 0 && (
            <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
              {activeTag && (
                <Chip
                  size="small"
                  label="All"
                  onClick={() => setActiveTag(null)}
                  variant="outlined"
                  sx={{ 
                    borderRadius: 1.5, 
                    fontWeight: 600, 
                    fontSize: '0.7rem',
                    borderColor: 'divider',
                  }}
                />
              )}
              {(allTags ?? []).slice(0, 6).map((tag) => (
                <Chip
                  key={tag}
                  size="small"
                  icon={<Hash size={10} />}
                  label={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  variant={activeTag === tag ? "filled" : "outlined"}
                  sx={{ 
                    borderRadius: 1.5, 
                    fontWeight: 600, 
                    fontSize: '0.7rem',
                    ...(activeTag === tag ? {
                      bgcolor: 'var(--color-primary, #10b981)',
                      color: 'white',
                      '& .MuiChip-icon': { color: 'white' },
                    } : {
                      borderColor: 'divider',
                    }),
                  }}
                />
              ))}
            </Stack>
          )}
        </Stack>
      </Box>

      {/* Grid Content */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: { xs: 2, md: 3 }, scrollbarWidth: 'thin' }}>
        {ideas.length > 0 ? (
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
            gap: 2.5,
          }}>
            {(ideas ?? []).map((idea) => {
              const tags = extractTags(idea.description || "");
              return (
                <Card 
                  key={idea.id} 
                  elevation={0}
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: 'var(--color-primary, #10b981)',
                      boxShadow: '0 8px 32px rgba(16, 185, 129, 0.08)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                  onClick={() => router.push(`/dashboard/ideas?id=${idea.id}`)}
                >
                  <CardContent sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                      <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ flex: 1, mr: 1 }}>
                        {idea.name}
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={(e) => handleDeleteIdea(idea.id, e)} 
                        sx={{ 
                          opacity: 0, 
                          transition: 'opacity 0.15s',
                          '.MuiCard-root:hover &': { opacity: 0.6 },
                          '&:hover': { opacity: 1, color: 'error.main' },
                          p: 0.5,
                        }}
                      >
                        <Trash2 size={14} />
                      </IconButton>
                    </Stack>
                    
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        mb: 1.5, 
                        flexGrow: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.6,
                        fontSize: '0.8125rem',
                      }}
                    >
                      {renderTextWithTags(idea.description || "No description.")}
                    </Typography>

                    {tags.length > 0 && (
                      <Stack direction="row" spacing={0.5} sx={{ mb: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
                        {(tags ?? []).slice(0, 3).map((tag) => (
                          <Chip
                            key={tag}
                            size="small"
                            label={`@${tag}`}
                            sx={{ 
                              height: 20, 
                              fontSize: '0.65rem', 
                              fontWeight: 600,
                              bgcolor: 'rgba(16, 185, 129, 0.08)',
                              color: 'var(--color-primary, #10b981)',
                              borderRadius: 1,
                            }}
                          />
                        ))}
                      </Stack>
                    )}

                    <Box sx={{ 
                      mt: 'auto', 
                      pt: 1.5, 
                      borderTop: '1px solid', 
                      borderColor: 'divider',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5, 
                      color: 'text.disabled',
                    }}>
                      <Calendar size={11} />
                      <Typography variant="caption" sx={{ fontSize: '0.675rem' }}>
                        {new Date(idea.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            py: 12,
          }}>
            <Box sx={{ 
              p: 3, 
              borderRadius: '50%', 
              bgcolor: 'rgba(16, 185, 129, 0.06)', 
              mb: 3,
              color: 'var(--color-primary, #10b981)',
            }}>
              <Lightbulb size={48} strokeWidth={1.5} />
            </Box>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
              {searchQuery || activeTag ? t("ideas.noMatch") : t("ideas.noIdeas")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {searchQuery || activeTag 
                ? "Try adjusting your search or filters."
                : "Use @feature, @plot, @character to tag your ideas."
              }
            </Typography>
            {!searchQuery && !activeTag && (
              <Button 
                variant="contained"
                startIcon={<Plus size={16} />}
                onClick={() => setComposeOpen(true)}
                sx={{ 
                  borderRadius: 2, 
                  textTransform: 'none', 
                  fontWeight: 700,
                  bgcolor: 'var(--color-primary, #10b981)',
                  '&:hover': { bgcolor: 'var(--color-primary-dark, #059669)' },
                }}
              >
                {t("ideas.new")}
              </Button>
            )}
          </Box>
        )}
      </Box>

      {/* Compose Dialog */}
      <Dialog
        open={composeOpen}
        onClose={() => !isSaving && setComposeOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: { borderRadius: 3, backgroundImage: 'none' },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Sparkles size={18} style={{ color: 'var(--color-primary, #10b981)' }} />
            <Typography variant="subtitle1" fontWeight={700}>
              {t("ideas.quickRecord")}
            </Typography>
          </Stack>
          <IconButton onClick={() => setComposeOpen(false)} size="small" disabled={isSaving}>
            <X size={16} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
            Use <strong>@feature</strong>, <strong>@plot</strong>, <strong>@character</strong> to tag your idea.
          </Typography>
          <TextField
            autoFocus
            multiline
            rows={4}
            placeholder={t("ideas.typePlaceholder")}
            variant="outlined"
            fullWidth
            value={composeText}
            onChange={(e) => setComposeText(e.target.value)}
            disabled={isSaving}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleCreateIdea();
              }
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          {extractTags(composeText).length > 0 && (
            <Stack direction="row" spacing={0.5} sx={{ mt: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
              {(extractTags(composeText) ?? []).map((tag) => (
                <Chip
                  key={tag}
                  size="small"
                  label={`@${tag}`}
                  sx={{ 
                    height: 22, 
                    fontSize: '0.7rem', 
                    fontWeight: 600,
                    bgcolor: 'rgba(16, 185, 129, 0.1)',
                    color: 'var(--color-primary, #10b981)',
                  }}
                />
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'space-between' }}>
          <Typography variant="caption" color="text.disabled">
            Ctrl+Enter to save
          </Typography>
          <Button
            variant="contained"
            onClick={handleCreateIdea}
            disabled={!composeText.trim() || isSaving}
            endIcon={isSaving ? <CircularProgress size={14} color="inherit" /> : null}
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none', 
              fontWeight: 700,
              bgcolor: 'var(--color-primary, #10b981)',
              '&:hover': { bgcolor: 'var(--color-primary-dark, #059669)' },
            }}
          >
            {t("ideas.save")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
