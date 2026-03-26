"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  Stack,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import {
  Plus,
  RefreshCw,
  Check,
  FolderKanban,
  Calendar,
  Loader2,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { useDashboardWorkspace } from "@/components/dashboard/workspace-provider";
import { type ProjectRecord } from "@/lib/workspace";
import { useLanguage } from "@/lib/i18n";

function formatDate(value: string, lang: string = "en") {
  const date = new Date(value);
  return new Intl.DateTimeFormat(lang, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function ProjectsDashboardPage() {
  const { projects, activeProjectId, switchProject, refreshWorkspace, loading, createProjectRecord } =
    useDashboardWorkspace();
  const { t, language } = useLanguage();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [genre, setGenre] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const orderedProjects = useMemo(() => {
    return [...projects].sort((left, right) => {
      if (left.id === activeProjectId) return -1;
      if (right.id === activeProjectId) return 1;
      return new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime();
    });
  }, [projects, activeProjectId]);

  const handleCreateProject = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      setError(t("projects.error.nameRequired"));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const project = await createProjectRecord(name.trim(), genre.trim() || null);
      setDialogOpen(false);
      setName("");
      setGenre("");
      setFeedback(t("projects.feedback.created"));
      await refreshWorkspace(project.id);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : t("projects.error.generic"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivateProject = async (projectId: string) => {
    if (projectId === activeProjectId) return;
    setActivatingId(projectId);
    setError(null);
    try {
      await switchProject(projectId);
      setFeedback(t("projects.feedback.activated"));
    } catch (activateError) {
      setError(activateError instanceof Error ? activateError.message : t("projects.error.generic"));
    } finally {
      setActivatingId(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      await refreshWorkspace(activeProjectId ?? undefined);
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : t("projects.error.generic"));
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <Box sx={{
        px: { xs: 2, md: 4 },
        pt: { xs: 2, md: 3 },
        pb: 2,
        borderBottom: "1px solid",
        borderColor: "divider",
      }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: "action.hover",
              color: "text.secondary",
              display: "flex",
            }}>
              <FolderKanban size={18} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                {t("projects.title")}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t("projects.subtitle")}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            <IconButton
              size="small"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              sx={{ color: "text.secondary", "&:hover": { color: "text.primary" }, "&:active": { transform: "scale(0.9)" }, transition: "all 0.15s ease" }}
            >
              <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            </IconButton>
            <Button
              variant="contained"
              size="small"
              startIcon={<Plus size={14} />}
              onClick={() => setDialogOpen(true)}
              sx={{
                borderRadius: 999,
                textTransform: "none",
                fontWeight: 600,
                px: 2.5,
                bgcolor: "var(--primary, #188038)",
                "&:hover": { bgcolor: "var(--primary-strong, #115b27)" },
                "&:active": { transform: "scale(0.97)" },
                transition: "all 0.15s ease",
              }}
            >
              {t("projects.create")}
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Content */}
      <Box sx={{ flexGrow: 1, overflowY: "auto", p: { xs: 2, md: 3 }, scrollbarWidth: "thin" }}>
        {orderedProjects.length === 0 ? (
          <Box sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            py: 12,
          }}>
            <Box sx={{
              p: 3,
              borderRadius: "50%",
              bgcolor: "action.hover",
              mb: 3,
              color: "text.secondary",
            }}>
              <FolderKanban size={48} strokeWidth={1.5} />
            </Box>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
              {t("projects.emptyTitle")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t("projects.emptySubtitle")}
            </Typography>
            <Button
              variant="contained"
              startIcon={<Plus size={16} />}
              onClick={() => setDialogOpen(true)}
              sx={{
                borderRadius: 999,
                textTransform: "none",
                fontWeight: 600,
                bgcolor: "var(--primary, #188038)",
                "&:hover": { bgcolor: "var(--primary-strong, #115b27)" },
                "&:active": { transform: "scale(0.97)" },
                transition: "all 0.15s ease",
              }}
            >
              {t("projects.create")}
            </Button>
          </Box>
        ) : (
          <Stack spacing={1.5}>
            {orderedProjects.map((project) => {
              const isActive = project.id === activeProjectId;
              const isActivating = activatingId === project.id;

              return (
                <Box
                  key={project.id}
                  onClick={() => handleActivateProject(project.id)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2.5,
                    px: 3,
                    py: 2.5,
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: isActive ? "var(--primary, #34a853)" : "divider",
                    bgcolor: isActive ? "var(--state-layer-primary, rgba(52, 168, 83, 0.08))" : "background.paper",
                    cursor: isActive ? "default" : "pointer",
                    transition: "all 0.2s ease",
                    "&:hover": isActive ? {} : {
                      borderColor: "text.disabled",
                      bgcolor: "action.hover",
                    },
                  }}
                >
                  {/* Icon */}
                  <Box sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: isActive ? "var(--state-layer-primary, rgba(52, 168, 83, 0.12))" : "action.hover",
                    color: isActive ? "var(--primary, #34a853)" : "text.secondary",
                    fontWeight: 800,
                    fontSize: "1.1rem",
                    flexShrink: 0,
                  }}>
                    {project.title.charAt(0).toUpperCase()}
                  </Box>

                  {/* Info */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.25 }}>
                      <Typography
                        variant="subtitle2"
                        fontWeight={700}
                        noWrap
                        sx={{ color: isActive ? "text.primary" : "text.primary" }}
                      >
                        {project.title}
                      </Typography>
                      {isActive && (
                        <Chip
                          size="small"
                          icon={<Check size={10} />}
                          label={t("projects.activeBadge")}
                          sx={{
                            height: 20,
                            fontSize: "0.6rem",
                            fontWeight: 600,
                            bgcolor: "var(--state-layer-primary, rgba(52, 168, 83, 0.12))",
                            color: "var(--primary, #34a853)",
                            "& .MuiChip-icon": { color: "var(--primary, #34a853)" },
                          }}
                        />
                      )}
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {project.description || project.genre || t("projects.statusInactive")}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: "text.disabled", flexShrink: 0 }}>
                        <Calendar size={11} />
                        <Typography variant="caption" sx={{ fontSize: "0.675rem" }}>
                          {formatDate(project.updated_at, language)}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>

                  {/* Action */}
                  {isActivating ? (
                    <CircularProgress size={18} color="success" />
                  ) : !isActive ? (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleActivateProject(project.id);
                      }}
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        borderColor: "divider",
                        color: "text.secondary",
                        flexShrink: 0,
                        "&:hover": {
                          borderColor: "var(--primary, #34a853)",
                          color: "var(--primary, #34a853)",
                        },
                      }}
                    >
                      {t("projects.setActive")}
                    </Button>
                  ) : null}
                </Box>
              );
            })}
          </Stack>
        )}
      </Box>

      {/* Create Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => !submitting && setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, backgroundImage: "none" } }}
      >
        <Box component="form" onSubmit={handleCreateProject}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            {t("projects.dialog.title")}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t("projects.dialog.description")}
            </Typography>
            <Stack spacing={2.5}>
              <TextField
                label={t("projects.dialog.name")}
                value={name}
                onChange={(event) => setName(event.target.value)}
                fullWidth
                required
                autoFocus
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
              <TextField
                label={t("projects.dialog.genre")}
                value={genre}
                onChange={(event) => setGenre(event.target.value)}
                fullWidth
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
              sx={{ borderRadius: 2, textTransform: "none" }}
            >
              {t("projects.dialog.cancel")}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              endIcon={submitting ? <CircularProgress size={14} color="inherit" /> : null}
              sx={{
                borderRadius: 999,
                textTransform: "none",
                fontWeight: 600,
                bgcolor: "var(--primary, #188038)",
                "&:hover": { bgcolor: "var(--primary-strong, #115b27)" },
                "&:active": { transform: "scale(0.97)" },
                transition: "all 0.15s ease",
              }}
            >
              {t("projects.dialog.submit")}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Snackbar open={Boolean(feedback)} autoHideDuration={4000} onClose={() => setFeedback(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity="success" onClose={() => setFeedback(null)} variant="filled" sx={{ borderRadius: 2 }}>
          {feedback}
        </Alert>
      </Snackbar>
      <Snackbar open={Boolean(error)} autoHideDuration={5000} onClose={() => setError(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity="error" onClose={() => setError(null)} variant="filled" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
