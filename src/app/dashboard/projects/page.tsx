"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
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
      return new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime();
    });
  }, [projects]);

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
    if (projectId === activeProjectId) {
      return;
    }

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

  const renderProjectCard = (project: ProjectRecord) => {
    const isActive = project.id === activeProjectId;
    const statusLabel = isActive ? t("projects.statusActive") : t("projects.statusInactive");

    return (
      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={project.id}>
        <Card
          elevation={0}
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: isActive ? "primary.main" : "divider",
            bgcolor: isActive ? "primary.main" + "1A" : "background.paper",
            transition: "transform 160ms ease",
            "&:hover": {
              transform: "translateY(-2px)",
              borderColor: isActive ? "primary.main" : "text.secondary",
            },
          }}
        >
          <CardContent sx={{ flexGrow: 1 }}>
            <Stack direction="row" alignItems="flex-start" spacing={2} justifyContent="space-between">
              <Box>
                <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing={1.2}>
                  {statusLabel}
                </Typography>
                <Typography variant="h6" fontWeight={700} sx={{ wordBreak: "break-word" }}>
                  {project.title}
                </Typography>
              </Box>
              {isActive && (
                <Chip
                  label={t("projects.activeBadge")}
                  color="success"
                  variant="outlined"
                  size="small"
                  icon={<CheckCircleIcon fontSize="small" />}
                />
              )}
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              {project.description || project.genre || ""}
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ mt: 3 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t("projects.updated")}
                </Typography>
                <Typography variant="subtitle2">{formatDate(project.updated_at, language)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t("projects.created")}
                </Typography>
                <Typography variant="subtitle2">{formatDate(project.created_at, language)}</Typography>
              </Box>
            </Stack>
          </CardContent>
          <CardActions sx={{ px: 3, pb: 3, pt: 0 }}>
            <Button
              fullWidth
              variant={isActive ? "contained" : "outlined"}
              color={isActive ? "primary" : "inherit"}
              startIcon={isActive ? <CheckCircleIcon fontSize="small" /> : undefined}
              onClick={() => handleActivateProject(project.id)}
              disabled={activatingId === project.id}
            >
              {isActive ? t("projects.statusActive") : t("projects.setActive")}
            </Button>
          </CardActions>
        </Card>
      </Grid>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack spacing={4}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={3} alignItems={{ xs: "flex-start", sm: "center" }}>
          <Box>
            <Typography variant="h4" fontWeight={800} gutterBottom>
              {t("projects.title")}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t("projects.subtitle")}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={refreshing || loading}
            >
              {t("projects.refresh")}
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              {t("projects.create")}
            </Button>
          </Stack>
        </Stack>

        {orderedProjects.length === 0 ? (
          <Box
            sx={{
              border: "1px dashed",
              borderColor: "divider",
              borderRadius: 4,
              p: 6,
              textAlign: "center",
              bgcolor: "background.paper",
            }}
          >
            <AutoAwesomeIcon sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
            <Typography variant="h6" fontWeight={700} gutterBottom>
              {t("projects.emptyTitle")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t("projects.emptySubtitle")}
            </Typography>
            <Button variant="contained" onClick={() => setDialogOpen(true)} startIcon={<AddIcon />}>
              {t("projects.create")}
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {orderedProjects.map(renderProjectCard)}
          </Grid>
        )}
      </Stack>

      <Dialog open={dialogOpen} onClose={() => !submitting && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={handleCreateProject}>
          <DialogTitle>{t("projects.dialog.title")}</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t("projects.dialog.description")}
            </Typography>
            <Stack spacing={3}>
              <TextField
                label={t("projects.dialog.name")}
                value={name}
                onChange={(event) => setName(event.target.value)}
                fullWidth
                required
                autoFocus
              />
              <TextField
                label={t("projects.dialog.genre")}
                value={genre}
                onChange={(event) => setGenre(event.target.value)}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setDialogOpen(false)} disabled={submitting}>
              {t("projects.dialog.cancel")}
            </Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {t("projects.dialog.submit")}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Snackbar open={Boolean(feedback)} autoHideDuration={4000} onClose={() => setFeedback(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity="success" onClose={() => setFeedback(null)} variant="filled">
          {feedback}
        </Alert>
      </Snackbar>
      <Snackbar open={Boolean(error)} autoHideDuration={5000} onClose={() => setError(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity="error" onClose={() => setError(null)} variant="filled">
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
}

