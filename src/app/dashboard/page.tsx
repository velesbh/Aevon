"use client";

import { BookOpen, Clock, FileText, Loader2, Map as MapIcon, ChevronRight, Target, PenTool } from "lucide-react";
import { useDashboardWorkspace } from "@/components/dashboard/workspace-provider";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n";
import Grid from "@mui/material/Grid";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Stack,
  Card,
  CardContent,
  Button,
  Chip,
  Paper,
  Divider,
  TextField,
  CircularProgress,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

function formatRelativeTime(value: string, t: (key: string) => string) {
  const timestamp = new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.floor((Date.now() - timestamp) / 60000));
  if (diffMinutes < 60) return `${diffMinutes}${t("dashboard.time.minute")}`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}${t("dashboard.time.hour")}`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}${t("dashboard.time.day")}`;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants: import("framer-motion").Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 30 } }
};

import { QuickScratchpad } from "@/components/dashboard/quick-scratchpad";

export default function DashboardOverview() {
  const { error, loading, workspace } = useDashboardWorkspace();
  const { t } = useLanguage();
  const theme = useTheme();

  if (loading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", bgcolor: "background.default" }}>
        <CircularProgress color="success" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ height: "100%", bgcolor: "background.default", display: "flex", alignItems: "center", justifyContent: "center", p: 4 }}>
        <Paper elevation={3} sx={{ maxWidth: 520, p: 4, borderRadius: 3, border: "1px solid", borderColor: "error.light" }}>
          <Typography variant="h6" fontWeight={700} color="error.main">
            {t("dashboard.overview.error_loading")}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1.5 }} color="error.dark">
            {error}
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (!workspace || !workspace.activeProject) {
    return (
      <Box sx={{ height: "100%", bgcolor: "background.default", display: "flex", alignItems: "center", justifyContent: "center", p: 4 }}>
        <Paper elevation={1} sx={{ maxWidth: 560, p: 5, borderRadius: 4 }}>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            {t("dashboard.overview.no_project")}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t("dashboard.overview.onboarding_hint")}
          </Typography>
        </Paper>
      </Box>
    );
  }

  const totalWords = workspace.chapters.reduce((sum, chapter) => sum + chapter.word_count, 0);
  const recentItems = [
    ...workspace.chapters.map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      type: "Chapter",
      updated_at: chapter.updated_at,
    })),
    ...workspace.worldElements.map((element) => ({
      id: element.id,
      title: element.name,
      type: element.type[0].toUpperCase() + element.type.slice(1),
      updated_at: element.updated_at,
    })),
  ]
    .sort((left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime())
    .slice(0, 5);

  const displayName = workspace.profile?.name ?? workspace.user.email ?? t("dashboard.writer");
  const projectGenre = workspace.activeProject.genre ?? workspace.profile?.genre ?? t("dashboard.uncategorized");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "background.default", overflowY: "auto" }}>
      <Box sx={{ px: { xs: 3, md: 5 }, pt: { xs: 3, md: 5 }, pb: 2, width: "100%", maxWidth: 1400, mx: "auto" }}>
        <Typography variant="h4" fontWeight={800} color="text.primary">
          {t("dash.welcome")}, {displayName}
        </Typography>
      </Box>

      <Box sx={{ flexGrow: 1 }}>
        <Stack spacing={4} sx={{ px: { xs: 3, md: 5 }, pb: 10, width: "100%", maxWidth: 1400, mx: "auto" }}>
          <Grid
            container
            spacing={{ xs: 2, md: 3 }}
            component={motion.div}
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {[
              {
                name: t("dash.totalWords"),
                stat: totalWords.toLocaleString(),
                icon: BookOpen,
                change: t("dashboard.overview.chapters_count")
                  .replace("{count}", workspace.chapters.length.toString())
                  .replace("{plural}", workspace.chapters.length === 1 ? "" : "s"),
              },
              {
                name: t("dash.activeManuscripts"),
                stat: workspace.projects.length.toString(),
                icon: FileText,
                change: workspace.activeProject.title,
              },
              {
                name: t("dash.worldEntities"),
                stat: workspace.worldElements.length.toString(),
                icon: MapIcon,
                change: t("dashboard.overview.cast_locations_lore"),
              },
              {
                name: t("dashboard.overview.daily_goal"),
                stat: "1,240 / 2k",
                icon: Target,
                change: t("dashboard.overview.percent_completed").replace("{percent}", "62"),
              },
            ].map((item) => (
              <Grid key={item.name} size={{ xs: 12, sm: 6, lg: 3 }} component={motion.div} variants={itemVariants}>
                <Card
                  elevation={0}
                  sx={{
                    p: { xs: 3, md: 4 },
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    height: "100%",
                    position: "relative",
                    overflow: "hidden",
                    bgcolor: "background.paper",
                    boxShadow: "0px 2px 8px rgba(0,0,0,0.04)",
                    transition: "box-shadow 0.3s ease, transform 0.3s ease",
                    "&:hover": {
                      boxShadow: "0px 10px 30px rgba(0,0,0,0.08)",
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  <Box sx={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                    <Box sx={{ position: "absolute", top: -32, right: -32, width: 140, height: 140, borderRadius: "50%", bgcolor: alpha(theme.palette.success.main, 0.08) }} />
                  </Box>
                  <CardContent sx={{ position: "relative", p: 0, height: "100%" }}>
                    <Stack spacing={3} sx={{ height: "100%" }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="overline" fontWeight={700} color="text.secondary" sx={{ letterSpacing: 2 }}>
                          {item.name}
                        </Typography>
                        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.15), color: "success.main" }}>
                          <item.icon size={20} />
                        </Box>
                      </Stack>
                      <Typography variant="h4" fontWeight={900} color="text.primary">
                        {item.stat}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.change}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={{ xs: 3, md: 4 }}>
            <Grid size={{ xs: 12, lg: 8 }}>
              <Stack spacing={{ xs: 3, md: 4 }}>
                <Paper
                  elevation={1}
                  sx={{
                    position: "relative",
                    borderRadius: 4,
                    p: { xs: 3, md: 5 },
                    overflow: "hidden",
                    backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.08)}, transparent)`,
                  }}
                >
                  <Stack direction={{ xs: "column", md: "row" }} alignItems={{ xs: "flex-start", md: "flex-end" }} spacing={4} justifyContent="space-between">
                    <Stack spacing={2} maxWidth={720}>
                      <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
                        <Chip size="small" label={projectGenre} color="success" variant="outlined" sx={{ fontWeight: 700, letterSpacing: 1 }} />
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Clock size={14} />
                          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ letterSpacing: 1 }}>
                            {t("dashboard.overview.last_edited").replace("{time}", formatRelativeTime(workspace.activeProject.updated_at, t))}
                          </Typography>
                        </Stack>
                      </Stack>
                      <Typography variant="h3" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                        {workspace.activeProject.title}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {workspace.activeProject.description ?? t("dash.liveProject")}
                      </Typography>
                    </Stack>
                      <Button
                      component="a"
                      href="/dashboard/manuscript/"
                      variant="contained"
                      color="success"
                      size="large"
                      startIcon={<PenTool size={18} />}
                      sx={{ borderRadius: 999, px: 4, fontWeight: 700, boxShadow: "0 12px 24px rgba(16,185,129,0.25)" }}
                    >
                      {t("dashboard.overview.continue_writing")}
                    </Button>
                  </Stack>
                </Paper>

                <Paper elevation={1} sx={{ borderRadius: 4, p: { xs: 3, md: 4 } }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ pb: 2, borderBottom: "1px solid", borderColor: "divider", mb: 3 }}>
                    <Typography variant="h6" fontWeight={700}>
                      {t("dash.recentActivity")}
                    </Typography>
                    <Button component="a" href="/dashboard/manuscript/" size="small" color="success" endIcon={<ChevronRight size={16} />} sx={{ fontWeight: 700 }}>
                      {t("dash.viewAll")}
                    </Button>
                  </Stack>

                  {recentItems.length > 0 ? (
                    <Stack divider={<Divider flexItem />}>
                      {recentItems.map((item) => (
                        <Box
                          key={item.id}
                          component="a"
                          href={item.type === "Chapter" ? "/dashboard/manuscript/" : "/dashboard/world/"}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 2,
                            textDecoration: "none",
                            py: 2,
                            color: "inherit",
                            transition: "background-color 0.2s ease",
                            "&:hover": { bgcolor: "action.hover" },
                          }}
                        >
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Paper elevation={0} sx={{ p: 1.5, borderRadius: 3, border: "1px solid", borderColor: "divider", color: "text.secondary" }}>
                              <FileText size={20} />
                            </Paper>
                            <Box>
                              <Typography variant="subtitle1" fontWeight={700} sx={{ color: "text.primary" }}>
                                {item.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {item.type}
                              </Typography>
                            </Box>
                          </Stack>
                          <Chip
                            label={formatRelativeTime(item.updated_at, t)}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 600, letterSpacing: 1 }}
                          />
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Stack spacing={2} alignItems="center" justifyContent="center" sx={{ py: 6 }}>
                      <Clock size={40} color={theme.palette.text.secondary} />
                      <Typography variant="body1" color="text.secondary">
                        {t("dash.noActivity")}
                      </Typography>
                    </Stack>
                  )}
                </Paper>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, lg: 4 }}>
              <Stack spacing={{ xs: 3, md: 4 }}>
                <Paper elevation={1} sx={{ borderRadius: 4, height: 300, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  <QuickScratchpad project={workspace.activeProject} />
                </Paper>

                <Paper
                  elevation={1}
                  sx={{
                    borderRadius: 4,
                    p: 4,
                    textAlign: "center",
                    backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.success.light, 0.2)})`,
                  }}
                >
                  <Typography variant="overline" fontWeight={700} sx={{ letterSpacing: 2 }}>
                    {t("dashboard.overview.daily_progress")}
                  </Typography>
                  <Box sx={{ position: "relative", display: "inline-flex", mt: 4, mb: 3 }}>
                    <svg width={160} height={160} style={{ transform: "rotate(-90deg)" }}>
                      <circle cx="80" cy="80" r="64" fill="none" stroke={alpha(theme.palette.divider, 0.6)} strokeWidth={12} />
                      <circle
                        cx="80"
                        cy="80"
                        r="64"
                        fill="none"
                        stroke={theme.palette.success.main}
                        strokeWidth={12}
                        strokeDasharray={402}
                        strokeDashoffset={154}
                        strokeLinecap="round"
                      />
                    </svg>
                    <Stack sx={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }} spacing={0.5}>
                      <Typography variant="h4" fontWeight={900}>
                        62%
                      </Typography>
                      <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ letterSpacing: 2 }}>
                        {t("dashboard.overview.complete")}
                      </Typography>
                    </Stack>
                  </Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    1,240 {t("dashboard.overview.words_written")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    760 {t("dashboard.overview.words_to_go")}
                  </Typography>
                </Paper>
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      </Box>
    </Box>
  );
}



