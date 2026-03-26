"use client";

import { BookOpen, Clock, FileText, Loader2, Map as MapIcon, ChevronRight, Target, PenTool, Users, ScrollText } from "lucide-react";
import { useDashboardWorkspace } from "@/components/dashboard/workspace-provider";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n";
import { QuickScratchpad } from "@/components/dashboard/quick-scratchpad";
import Grid from "@mui/material/Grid";
import {
  Typography,
  Box,
  Stack,
  Card,
  CardContent,
  Button,
  Chip,
  Paper,
  Divider,
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
    transition: { staggerChildren: 0.07 },
  },
};

const itemVariants: import("framer-motion").Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 30 } },
};

function getTypeIcon(type: string) {
  switch (type.toLowerCase()) {
    case "chapter": return FileText;
    case "character": return Users;
    case "location": return MapIcon;
    case "lore": return ScrollText;
    default: return FileText;
  }
}

export default function DashboardOverview() {
  const { error, loading, workspace } = useDashboardWorkspace();
  const { t } = useLanguage();
  const theme = useTheme();

  if (loading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
        <CircularProgress sx={{ color: "var(--color-primary, #10b981)" }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", p: 4 }}>
        <Paper elevation={0} sx={{ maxWidth: 520, p: 4, borderRadius: 3, border: "1px solid", borderColor: "error.light" }}>
          <Typography variant="h6" fontWeight={700} color="error.main">
            {t("dashboard.overview.error_loading")}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1.5 }} color="text.secondary">
            {error}
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (!workspace || !workspace.activeProject) {
    return (
      <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", p: 4 }}>
        <Paper elevation={0} sx={{ maxWidth: 560, p: 5, borderRadius: 4, border: "1px solid", borderColor: "divider" }}>
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
    .slice(0, 6);

  const displayName = workspace.profile?.name ?? workspace.user.email ?? t("dashboard.writer");
  const projectGenre = workspace.activeProject.genre ?? workspace.profile?.genre ?? t("dashboard.uncategorized");

  const dailyGoal = ((workspace.activeProject.settings as any)?.dailyGoal as number) || 2000;
  const dailyPercent = Math.min(100, Math.round((totalWords / dailyGoal) * 100));
  const formatGoalValue = (current: number, goal: number) => {
    const fmtNum = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1).replace('.0', '')}k` : n.toString();
    return `${fmtNum(current)} / ${fmtNum(goal)}`;
  };

  const stats = [
    {
      label: t("dash.totalWords"),
      value: totalWords.toLocaleString(),
      icon: BookOpen,
      sub: t("dashboard.overview.chapters_count")
        .replace("{count}", workspace.chapters.length.toString())
        .replace("{plural}", workspace.chapters.length === 1 ? "" : "s"),
    },
    {
      label: t("dash.activeManuscripts"),
      value: workspace.projects.length.toString(),
      icon: FileText,
      sub: workspace.activeProject.title,
    },
    {
      label: t("dash.worldEntities"),
      value: workspace.worldElements.length.toString(),
      icon: MapIcon,
      sub: t("dashboard.overview.cast_locations_lore"),
    },
    {
      label: t("dashboard.overview.daily_goal"),
      value: formatGoalValue(totalWords, dailyGoal),
      icon: Target,
      sub: t("dashboard.overview.percent_completed").replace("{percent}", dailyPercent.toString()),
    },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      <Box sx={{ px: { xs: 2, md: 4 }, pt: { xs: 2, md: 4 }, pb: 0, width: "100%", maxWidth: 1200, mx: "auto" }}>
        {/* Welcome + Project Hero */}
        <Stack spacing={0.5} sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={600}>
            {t("dash.welcome")}, {displayName}
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" spacing={2}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography variant="h4" fontWeight={900} sx={{ lineHeight: 1.1 }}>
                {workspace.activeProject.title}
              </Typography>
              <Chip
                size="small"
                label={projectGenre}
                sx={{
                  fontWeight: 600,
                  fontSize: "0.65rem",
                  bgcolor: "var(--state-layer-neutral, rgba(0,0,0,0.04))",
                  color: "text.secondary",
                  height: 22,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              />
            </Stack>
            <Button
              component="a"
              href="/dashboard/manuscript/"
              variant="contained"
              size="small"
              startIcon={<PenTool size={14} />}
              sx={{
                borderRadius: 999,
                px: 3,
                fontWeight: 600,
                textTransform: "none",
                bgcolor: "var(--primary, #188038)",
                "&:hover": { bgcolor: "var(--primary-strong, #115b27)" },
                "&:active": { transform: "scale(0.97)" },
                transition: "all 0.15s ease",
              }}
            >
              {t("dashboard.overview.continue_writing")}
            </Button>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
            <Clock size={12} style={{ opacity: 0.5 }} />
            <Typography variant="caption" color="text.tertiary" fontWeight={500}>
              {t("dashboard.overview.last_edited").replace("{time}", formatRelativeTime(workspace.activeProject.updated_at, t))}
            </Typography>
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ flexGrow: 1, px: { xs: 2, md: 4 }, pb: 10, width: "100%", maxWidth: 1200, mx: "auto" }}>
        <Stack spacing={3}>
          {/* Stats Row */}
          <Grid
            container
            spacing={2}
            component={motion.div}
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {stats.map((item) => (
              <Grid key={item.label} size={{ xs: 6, md: 3 }} component={motion.div} variants={itemVariants}>
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                    transition: "all 0.2s ease",
                    "&:hover": { borderColor: "text.disabled" },
                  }}
                >
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1, fontSize: "0.65rem" }}>
                      {item.label}
                    </Typography>
                    <Box sx={{ p: 0.75, borderRadius: 1.5, bgcolor: "var(--state-layer-neutral, rgba(0,0,0,0.04))", color: "text.secondary", display: "flex" }}>
                      <item.icon size={14} />
                    </Box>
                  </Stack>
                  <Typography variant="h5" fontWeight={900} sx={{ mb: 0.5, lineHeight: 1 }}>
                    {item.value}
                  </Typography>
                  <Typography variant="caption" color="text.tertiary" sx={{ fontSize: "0.7rem" }}>
                    {item.sub}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Main Content Grid */}
          <Grid container spacing={3}>
            {/* Left Column - Activity */}
            <Grid size={{ xs: 12, lg: 7 }}>
              <Box
                sx={{
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                  overflow: "hidden",
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, py: 2, borderBottom: "1px solid", borderColor: "divider" }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {t("dash.recentActivity")}
                  </Typography>
                  <Button
                    component="a"
                    href="/dashboard/manuscript/"
                    size="small"
                    endIcon={<ChevronRight size={14} />}
                    sx={{ fontWeight: 600, textTransform: "none", color: "var(--primary, #34a853)", fontSize: "0.75rem" }}
                  >
                    {t("dash.viewAll")}
                  </Button>
                </Stack>

                {recentItems.length > 0 ? (
                  <Stack divider={<Divider />}>
                    {recentItems.map((item) => {
                      const Icon = getTypeIcon(item.type);
                      return (
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
                            px: 3,
                            py: 1.75,
                            color: "inherit",
                            transition: "background-color 0.15s ease",
                            "&:hover": { bgcolor: "action.hover" },
                          }}
                        >
                          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: "action.hover", color: "text.secondary", display: "flex", flexShrink: 0 }}>
                              <Icon size={16} />
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={600} noWrap>
                                {item.title}
                              </Typography>
                              <Typography variant="caption" color="text.tertiary" sx={{ fontSize: "0.675rem" }}>
                                {item.type}
                              </Typography>
                            </Box>
                          </Stack>
                          <Typography variant="caption" color="text.disabled" sx={{ flexShrink: 0, fontSize: "0.675rem" }}>
                            {formatRelativeTime(item.updated_at, t)}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Stack>
                ) : (
                  <Stack spacing={1.5} alignItems="center" justifyContent="center" sx={{ py: 8 }}>
                    <Clock size={32} style={{ opacity: 0.3 }} />
                    <Typography variant="body2" color="text.secondary">
                      {t("dash.noActivity")}
                    </Typography>
                  </Stack>
                )}
              </Box>
            </Grid>

            {/* Right Column - Scratchpad + Progress */}
            <Grid size={{ xs: 12, lg: 5 }}>
              <Stack spacing={3}>
                <Box
                  sx={{
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                    height: 280,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  <QuickScratchpad project={workspace.activeProject} />
                </Box>

                <Box
                  sx={{
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                    p: 3,
                    textAlign: "center",
                  }}
                >
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1.5, fontSize: "0.65rem" }}>
                    {t("dashboard.overview.daily_progress")}
                  </Typography>
                  <Box sx={{ position: "relative", display: "inline-flex", mt: 3, mb: 2 }}>
                    <svg width={130} height={130} style={{ transform: "rotate(-90deg)" }}>
                      <circle cx="65" cy="65" r="52" fill="none" stroke={alpha(theme.palette.divider, 0.4)} strokeWidth={10} />
                      <circle
                        cx="65"
                        cy="65"
                        r="52"
                        fill="none"
                        stroke="var(--primary, #34a853)"
                        strokeWidth={10}
                        strokeDasharray={327}
                        strokeDashoffset={327 - (327 * dailyPercent) / 100}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dashoffset 0.6s ease" }}
                      />
                    </svg>
                    <Stack sx={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }} spacing={0}>
                      <Typography variant="h5" fontWeight={900}>
                        {dailyPercent}%
                      </Typography>
                      <Typography variant="caption" fontWeight={600} color="text.disabled" sx={{ fontSize: "0.6rem", letterSpacing: 1.5, textTransform: "uppercase" }}>
                        {t("dashboard.overview.complete")}
                      </Typography>
                    </Stack>
                  </Box>
                  <Typography variant="body2" fontWeight={700}>
                    {totalWords.toLocaleString()} {t("dashboard.overview.words_written")}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {Math.max(0, dailyGoal - totalWords).toLocaleString()} {t("dashboard.overview.words_to_go")}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      </Box>
    </Box>
  );
}
