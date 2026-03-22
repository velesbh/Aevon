"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Loader2, PlusCircle, Save } from "lucide-react";
import { useDashboardWorkspace } from "@/components/dashboard/workspace-provider";
import { useTranslation } from "@/lib/i18n";
import Grid from "@mui/material/Grid";
import { DashboardThemeToggle } from "@/components/dashboard/theme-toggle";
import { DashboardLanguageToggle } from "@/components/dashboard/language-toggle";

const TabPanel = ({ children, value, index }: { children: React.ReactNode; value: number; index: number }) => (
  <Box role="tabpanel" hidden={value !== index} sx={{ py: { xs: 3, md: 4 } }}>
    {value === index && children}
  </Box>
);

export default function SettingsPage() {
  const { t } = useTranslation();
  const {
    loading,
    profile,
    workspace,
    switchProject,
    saveProfileRecord,
    saveActiveProjectRecord,
    createProjectRecord,
  } = useDashboardWorkspace();

  const [tabIndex, setTabIndex] = useState(0);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingProject, setSavingProject] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const [profileData, setProfileData] = useState({ name: "", genre: "", experience_level: "" });
  const [projectData, setProjectData] = useState({ title: "", genre: "", description: "" });

  useEffect(() => {
    if (profile) {
      setProfileData({
        name: profile.name || "",
        genre: profile.genre || "",
        experience_level: profile.experience_level || "",
      });
    }
  }, [profile]);

  useEffect(() => {
    if (workspace?.activeProject) {
      setProjectData({
        title: workspace.activeProject.title || "",
        genre: workspace.activeProject.genre || "",
        description: workspace.activeProject.description || "",
      });
    }
  }, [workspace?.activeProject]);

  const isProfileDirty = useMemo(() => {
    if (!profile) return false;
    return (
      profile.name !== profileData.name ||
      profile.genre !== profileData.genre ||
      profile.experience_level !== profileData.experience_level
    );
  }, [profile, profileData]);

  const isActiveProjectDirty = useMemo(() => {
    if (!workspace?.activeProject) return false;
    return (
      workspace.activeProject.title !== projectData.title ||
      workspace.activeProject.genre !== projectData.genre ||
      (workspace.activeProject.description || "") !== projectData.description
    );
  }, [workspace?.activeProject, projectData]);

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingProfile(true);
    setError(null);
    setStatus(null);

    try {
      await saveProfileRecord(profileData);
      setStatus(t("settings.status.profile_saved"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("settings.error.profile_save"));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveProject = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!workspace?.activeProject) return;

    setSavingProject(true);
    setError(null);
    setStatus(null);

    try {
      await saveActiveProjectRecord(projectData);
      setStatus(t("settings.status.project_saved"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("settings.error.project_save"));
    } finally {
      setSavingProject(false);
    }
  };

  const handleCreateProject = async () => {
    setCreatingProject(true);
    setError(null);
    setStatus(null);

    try {
      const created = await createProjectRecord(t("settings.project.new_title"), "");
      await switchProject(created.id);
      setStatus(t("settings.status.project_created"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("settings.error.project_create"));
    } finally {
      setCreatingProject(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress color="success" />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "background.default" }}>
      <AppBar
        position="sticky"
        elevation={0}
        color="transparent"
        sx={{
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: (theme) => alpha(theme.palette.background.paper, 0.92),
          backdropFilter: "blur(18px)",
        }}
      >
        <CardContent sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight={800} color="text.primary">
              {t("settings.title") || "Settings"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("settings.description") || "Manage your preferences and active projects."}
            </Typography>
          </Box>
          <Button
            onClick={handleCreateProject}
            disabled={creatingProject}
            variant="outlined"
            color="success"
            startIcon={creatingProject ? <Loader2 className="animate-spin" size={16} /> : <PlusCircle size={16} />}
            sx={{ borderRadius: 999, fontWeight: 700 }}
          >
            {t("settings.create_project")}
          </Button>
        </CardContent>
      </AppBar>

      <Box sx={{ flex: 1, overflowY: "auto" }} className="custom-scrollbar">
        <Stack spacing={4} sx={{ px: { xs: 2, md: 5 }, py: { xs: 3, md: 5 }, maxWidth: 1100, mx: "auto" }}>
          {(error || status) && (
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid",
                borderColor: error ? "error.light" : "success.light",
                bgcolor: error ? alpha("#f87171", 0.12) : alpha("#34d399", 0.12),
                color: error ? "error.main" : "success.darker",
                p: 2.5,
                fontWeight: 600,
              }}
            >
              {error ?? status}
            </Paper>
          )}

          <Card sx={{ borderRadius: 4, border: "1px solid", borderColor: "divider" }} elevation={0}>
            <Tabs
              value={tabIndex}
              onChange={(_, newValue) => setTabIndex(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: "1px solid", borderColor: "divider" }}
            >
              <Tab label={t("settings.tabs.profile")} sx={{ fontWeight: 700 }} />
              <Tab label={t("settings.tabs.project")} sx={{ fontWeight: 700 }} />
              <Tab label={t("dashboard.settings") || "System"} sx={{ fontWeight: 700 }} />
            </Tabs>

            <TabPanel value={tabIndex} index={0}>
              <form onSubmit={handleSaveProfile}>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label={t("settings.fields.display_name")}
                      value={profileData.name}
                      onChange={(event) => setProfileData((prev) => ({ ...prev, name: event.target.value }))}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 3,
                          fontWeight: 600,
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label={t("settings.fields.favorite_genre")}
                      value={profileData.genre}
                      onChange={(event) => setProfileData((prev) => ({ ...prev, genre: event.target.value }))}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label={t("settings.fields.experience_level")}
                      value={profileData.experience_level}
                      onChange={(event) => setProfileData((prev) => ({ ...prev, experience_level: event.target.value }))}
                      select
                      SelectProps={{ native: true }}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    >
                      <option value="">{t("settings.fields.level_placeholder")}</option>
                      <option value="Beginner">{t("settings.levels.beginner")}</option>
                      <option value="Intermediate">{t("settings.levels.intermediate")}</option>
                      <option value="Professional">{t("settings.levels.professional")}</option>
                    </TextField>
                  </Grid>
                </Grid>
                <Divider sx={{ my: 3 }} />
                <Stack direction="row" justifyContent="flex-end" spacing={2}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="success"
                    startIcon={savingProfile ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
                    disabled={savingProfile || !isProfileDirty}
                    sx={{ borderRadius: 999, px: 3, fontWeight: 700 }}
                  >
                    {t("settings.actions.save_profile")}
                  </Button>
                </Stack>
              </form>
            </TabPanel>

            <TabPanel value={tabIndex} index={1}>
              <form onSubmit={handleSaveProject}>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label={t("settings.fields.project_title")}
                      value={projectData.title}
                      onChange={(event) => setProjectData((prev) => ({ ...prev, title: event.target.value }))}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label={t("settings.fields.genre")}
                      value={projectData.genre}
                      onChange={(event) => setProjectData((prev) => ({ ...prev, genre: event.target.value }))}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label={t("settings.fields.project_description")}
                      multiline
                      minRows={4}
                      value={projectData.description}
                      onChange={(event) => setProjectData((prev) => ({ ...prev, description: event.target.value }))}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>
                <Divider sx={{ my: 3 }} />
                <Stack direction="row" justifyContent="flex-end" spacing={2}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="success"
                    startIcon={savingProject ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
                    disabled={savingProject || !isActiveProjectDirty}
                    sx={{ borderRadius: 999, px: 3, fontWeight: 700 }}
                  >
                    {t("settings.actions.save_project")}
                  </Button>
                </Stack>
              </form>
            </TabPanel>

            <TabPanel value={tabIndex} index={2}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                    Appearance
                  </Typography>
                  <DashboardThemeToggle />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                    Language
                  </Typography>
                  <DashboardLanguageToggle />
                </Grid>
              </Grid>
            </TabPanel>
          </Card>

          <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
            <Card elevation={0} sx={{ flex: 1, borderRadius: 4, border: "1px solid", borderColor: "divider" }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  {t("settings.project.overview")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("settings.project.active")}: {workspace?.activeProject?.title ?? t("settings.project.none")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("settings.project.total_count")}: {workspace?.projects.length ?? 0}
                </Typography>
              </CardContent>
            </Card>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}
