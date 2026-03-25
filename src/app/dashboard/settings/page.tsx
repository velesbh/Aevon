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
import { Loader2, PlusCircle, Save, UserCircle, FolderKanban, Settings as SettingsIcon } from "lucide-react";
import { useDashboardWorkspace } from "@/components/dashboard/workspace-provider";
import { useTranslation } from "@/lib/i18n";
import Grid from "@mui/material/Grid";
import { DashboardThemeToggle } from "@/components/dashboard/theme-toggle";
import { DashboardLanguageToggle } from "@/components/dashboard/language-toggle";

const TabPanel = ({ children, value, index }: { children: React.ReactNode; value: number; index: number }) => (
  <Box role="tabpanel" hidden={value !== index} sx={{ py: 3, px: { xs: 2, md: 4 } }}>
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

      <Box sx={{ flex: 1, overflowY: "auto", p: { xs: 2, md: 4 } }} className="custom-scrollbar">
        <Box sx={{ maxWidth: 1000, mx: "auto", display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 4 }}>
          {/* Vertical Tabs Navigation */}
          <Box sx={{ width: { xs: "100%", md: 240 }, flexShrink: 0 }}>
            <Tabs
              orientation="vertical"
              variant="scrollable"
              value={tabIndex}
              onChange={(_, newValue) => setTabIndex(newValue)}
              aria-label="Settings tabs"
              sx={{
                borderRight: { xs: 0, md: 1 },
                borderBottom: { xs: 1, md: 0 },
                borderColor: "divider",
                "& .MuiTab-root": {
                  alignItems: "flex-start",
                  textAlign: "left",
                  justifyContent: "flex-start",
                  minHeight: 48,
                  px: 3,
                  py: 1.5,
                  borderRadius: { xs: 0, md: 2 },
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  transition: "all 0.2s",
                  "&:hover": {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                  },
                  "&.Mui-selected": {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                  },
                },
                "& .MuiTabs-indicator": {
                  left: 0,
                  right: "auto",
                  width: 3,
                  borderRadius: "0 4px 4px 0",
                },
              }}
            >
              <Tab 
                icon={<UserCircle size={20} />} 
                iconPosition="start" 
                label={t("settings.tabs.profile")} 
              />
              <Tab 
                icon={<FolderKanban size={20} />} 
                iconPosition="start" 
                label={t("settings.tabs.project")} 
              />
              <Tab 
                icon={<SettingsIcon size={20} />} 
                iconPosition="start" 
                label={t("dashboard.settings") || "System"} 
              />
            </Tabs>
          </Box>

          {/* Tab Content Area */}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            {(error || status) && (
              <Paper
                elevation={0}
                sx={{
                  mb: 4,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: error ? "error.light" : "success.light",
                  bgcolor: error ? alpha("#f87171", 0.12) : alpha("#34d399", 0.12),
                  color: error ? "error.main" : "success.darker",
                  p: 2.5,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                {error ?? status}
                <Button 
                  size="small" 
                  onClick={() => { setError(null); setStatus(null); }}
                  sx={{ minWidth: "auto", p: 0.5, color: "inherit" }}
                >
                  ✕
                </Button>
              </Paper>
            )}

            <Card sx={{ borderRadius: 4, border: "1px solid", borderColor: "divider" }} className="surface-raised">
              {/* Profile Tab */}
              <TabPanel value={tabIndex} index={0}>
                <Box mb={3}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {t("settings.tabs.profile")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Update your personal details and preferences.
                  </Typography>
                </Box>
                
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
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 3,
                            fontWeight: 600,
                          },
                        }}
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
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 3,
                            fontWeight: 600,
                          },
                        }}
                      >
                        <option value="">{t("settings.fields.level_placeholder")}</option>
                        <option value="Beginner">{t("settings.levels.beginner")}</option>
                        <option value="Intermediate">{t("settings.levels.intermediate")}</option>
                        <option value="Professional">{t("settings.levels.professional")}</option>
                      </TextField>
                    </Grid>
                  </Grid>
                  <Box sx={{ mt: 4, pt: 3, borderTop: "1px solid", borderColor: "divider", display: "flex", justifyContent: "flex-end" }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disableElevation
                      startIcon={savingProfile ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
                      disabled={savingProfile || !isProfileDirty}
                      sx={{ borderRadius: 999, px: 3, py: 1, fontWeight: 700 }}
                    >
                      {t("settings.actions.save_profile")}
                    </Button>
                  </Box>
                </form>
              </TabPanel>

              {/* Project Tab */}
              <TabPanel value={tabIndex} index={1}>
                <Box mb={3}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {t("settings.tabs.project")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Manage details for your currently active project.
                  </Typography>
                </Box>
                
                <form onSubmit={handleSaveProject}>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label={t("settings.fields.project_title")}
                        value={projectData.title}
                        onChange={(event) => setProjectData((prev) => ({ ...prev, title: event.target.value }))}
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
                        label={t("settings.fields.genre")}
                        value={projectData.genre}
                        onChange={(event) => setProjectData((prev) => ({ ...prev, genre: event.target.value }))}
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
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label={t("settings.fields.project_description")}
                        multiline
                        minRows={4}
                        value={projectData.description}
                        onChange={(event) => setProjectData((prev) => ({ ...prev, description: event.target.value }))}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 3,
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                  <Box sx={{ mt: 4, pt: 3, borderTop: "1px solid", borderColor: "divider", display: "flex", justifyContent: "flex-end" }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disableElevation
                      startIcon={savingProject ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
                      disabled={savingProject || !isActiveProjectDirty}
                      sx={{ borderRadius: 999, px: 3, py: 1, fontWeight: 700 }}
                    >
                      {t("settings.actions.save_project")}
                    </Button>
                  </Box>
                </form>
                
                <Box sx={{ mt: 4, pt: 3, borderTop: "1px solid", borderColor: "divider" }}>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    {t("settings.project.overview")}
                  </Typography>
                  <Stack direction="row" spacing={4} sx={{ mt: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {t("settings.project.active")}
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {workspace?.activeProject?.title ?? t("settings.project.none")}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {t("settings.project.total_count")}
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {workspace?.projects.length ?? 0}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </TabPanel>

              {/* System Tab */}
              <TabPanel value={tabIndex} index={2}>
                <Box mb={4}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    System Preferences
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Customize your dashboard experience.
                  </Typography>
                </Box>
                
                <Stack spacing={4}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom fontWeight="bold" sx={{ mb: 2 }}>
                      Appearance
                    </Typography>
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        borderRadius: 3,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between"
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={600}>Theme</Typography>
                        <Typography variant="caption" color="text.secondary">Select your preferred color scheme.</Typography>
                      </Box>
                      <DashboardThemeToggle />
                    </Paper>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" gutterBottom fontWeight="bold" sx={{ mb: 2 }}>
                      Language & Region
                    </Typography>
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        borderRadius: 3,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between"
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={600}>Language</Typography>
                        <Typography variant="caption" color="text.secondary">Choose the application language.</Typography>
                      </Box>
                      <DashboardLanguageToggle />
                    </Paper>
                  </Box>
                </Stack>
              </TabPanel>
            </Card>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

