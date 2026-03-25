"use client";

import React, { useEffect, useMemo, useState, useCallback, memo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Lightbulb,
  Loader2,
  LogOut,
  Moon,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sun,
  X,
} from "lucide-react";
import {
  Box as MuiBox,
  Button,
  ButtonBase,
  Chip,
  Collapse,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Popover,
  Stack,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Menu,
  MenuItem,
} from "@mui/material";
import { useTheme } from "next-themes";
import {
  moduleDefinitions,
  moduleSections,
  getModuleBySegment,
  type ModuleDefinition,
  type ModuleId,
} from "@/components/dashboard/modules";
import { useDashboardWorkspace } from "@/components/dashboard/workspace-provider";
import { signOutWorkspaceUser, type WorldElementType } from "@/lib/workspace";
import { onSyncStateChange } from "@/lib/sync-manager";
import { useLanguage } from "@/lib/i18n";

type SidebarModule = ModuleDefinition & {
  label: string;
  description?: string;
  count?: number;
};

const BRAND_COLOR = "var(--primary, #188038)";
const BRAND_SURFACE = "rgba(24, 128, 56, 0.14)";
const BRAND_BORDER = "rgba(24, 128, 56, 0.25)";

export function DashboardSidebar({
  mobileMenuOpen,
  setMobileMenuOpen,
  isMui = false,
  onHideSidebar,
}: {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  isMui?: boolean;
  onHideSidebar?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeId = searchParams.get("id");
  const { t } = useLanguage();

  const [signingOut, setSigningOut] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [projectAnchorEl, setProjectAnchorEl] = useState<HTMLElement | null>(null);
  const [projectFilter, setProjectFilter] = useState("");
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);

  // Expanded state for modules
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    characters: true,
    locations: true,
    lore: true,
  });

  const {
    projects,
    activeProjectId,
    activeProjectTitle,
    switchProject,
    chapters,
    worldElements,
    files,
    createProjectRecord,
    createWorldElementRecord,
    createChapterRecord,
  } = useDashboardWorkspace();

  useEffect(() => {
    const unsubscribe = onSyncStateChange((syncing) => setIsSyncing(syncing));
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  const counts = useModuleCounts({ chapters, worldElements, files, projects });

  const sidebarModules = useMemo<SidebarModule[]>(() => {
    return moduleDefinitions.map((definition) => ({
      ...definition,
      label: t(definition.labelKey),
      description: definition.descriptionKey ? t(definition.descriptionKey) : undefined,
      count: definition.countKey ? counts[definition.countKey] : undefined,
    }));
  }, [t, counts]);

  const modulesById = useMemo(() => {
    return sidebarModules.reduce<Record<ModuleId, SidebarModule>>((acc, module) => {
      acc[module.id] = module;
      return acc;
    }, {} as Record<ModuleId, SidebarModule>);
  }, [sidebarModules]);

  const activeModuleId: ModuleId = useMemo(() => {
    const normalized = pathname?.split("?")[0] ?? "/dashboard";
    const segments = normalized.split("/").filter(Boolean);
    const section = segments[1] ?? "";
    return getModuleBySegment(section)?.id ?? "dashboard";
  }, [pathname]);

  const filteredProjects = useMemo(() => {
    if (!projectFilter.trim()) {
      return projects;
    }
    const query = projectFilter.toLowerCase();
    return projects.filter((project) => project.title.toLowerCase().includes(query));
  }, [projectFilter, projects]);

  const closeMobileNav = useCallback(() => {
    if (typeof setMobileMenuOpen === "function" && mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }, [setMobileMenuOpen, mobileMenuOpen]);

  const handleSignOut = async () => {
    setSigningOut(true);
    setAuthError(null);
    try {
      await signOutWorkspaceUser();
      router.push("/login");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : t("sidebar.auth.error_sign_out"));
      setSigningOut(false);
    }
  };

  const handleProjectSelect = async (projectId: string) => {
    await switchProject(projectId);
    setProjectAnchorEl(null);
    setProjectFilter("");
    closeMobileNav();
  };

  const handleCreateProject = async () => {
    if (!newProjectTitle.trim()) {
      return;
    }
    setCreatingProject(true);
    try {
      const project = await createProjectRecord(newProjectTitle.trim());
      setNewProjectTitle("");
      await switchProject(project.id);
    } finally {
      setCreatingProject(false);
    }
  };

  const handleCreateEntry = async (e: React.MouseEvent, type: string, href: string) => {
    e.stopPropagation();
    try {
      let newEntryId = "";
      if (type === "chapter") {
        const entry = await createChapterRecord("New Chapter");
        newEntryId = entry.id;
      } else {
        const entry = await createWorldElementRecord(type as WorldElementType);
        newEntryId = entry.id;
      }
      if (newEntryId) {
        router.push(`${href}?id=${newEntryId}`);
        closeMobileNav();
      }
    } catch (error) {
      console.error("Failed to create entry:", error);
    }
  };

  const toggleExpanded = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedModules((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const elementsByType = useMemo(() => {
    const map: Record<string, { id: string; title: string }[]> = {
      character: [],
      location: [],
      item: [],
      idea: [],
      map: [],
      lore: [],
    };
    for (const el of worldElements) {
      if (!map[el.type]) map[el.type] = [];
      map[el.type].push({ id: el.id, title: el.name || "Untitled" });
    }
    return map;
  }, [worldElements]);

  const chapterItems = useMemo(() => {
    return chapters.map((c) => ({ id: c.id, title: c.title || "Untitled Chapter" }));
  }, [chapters]);

  const getNestedItems = useCallback((moduleId: string) => {
    if (moduleId === "manuscript") {
      return chapterItems;
    }
    let type = moduleId;
    if (moduleId.endsWith("s")) type = moduleId.slice(0, -1);
    const typeMap: Record<string, string> = {
      characters: "character",
      locations: "location",
      items: "item",
      ideas: "idea",
      maps: "map",
      lore: "lore"
    };
    const elementType = typeMap[moduleId] || type;
    return elementsByType[elementType] || [];
  }, [chapterItems, elementsByType]);

  const handleNestedSelect = useCallback((href: string, id: string) => {
    router.push(`${href}?id=${id}`);
    closeMobileNav();
  }, [router, closeMobileNav]);

  const handleModuleSelectCb = useCallback((item: SidebarModule) => {
    router.push(item.href);
    closeMobileNav();
  }, [router, closeMobileNav]);

  const handleCreateEntryCb = useCallback(async (e: React.MouseEvent, type: string, href: string) => {
    e.stopPropagation();
    try {
      let newEntryId = "";
      if (type === "chapter") {
        const entry = await createChapterRecord("New Chapter");
        newEntryId = entry.id;
      } else {
        const entry = await createWorldElementRecord(type as WorldElementType);
        newEntryId = entry.id;
      }
      if (newEntryId) {
        router.push(`${href}?id=${newEntryId}`);
        closeMobileNav();
      }
    } catch (error) {
      console.error("Failed to create entry:", error);
    }
  }, [createChapterRecord, createWorldElementRecord, router, closeMobileNav]);

  return (
    <MuiBox
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: "background.paper",
        borderRight: isMui ? undefined : "1px solid",
        borderColor: "divider",
      }}
    >
      <MuiBox sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top Header - Project Switcher */}
        <MuiBox
          sx={{
            p: 1.5,
            borderBottom: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <ButtonBase
            onClick={(event) => setProjectAnchorEl(event.currentTarget)}
            sx={{
              px: 1,
              py: 0.75,
              borderRadius: 2,
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            <MuiBox
              sx={{
                height: 28,
                width: 28,
                borderRadius: 1.25,
                background: "linear-gradient(135deg, var(--color-primary, #10b981), #059669)",
                color: "white",
                fontWeight: 700,
                fontSize: "0.875rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {(activeProjectTitle ?? t("sidebar.project.fallback_title")).charAt(0).toUpperCase()}
            </MuiBox>
            <Stack spacing={0} sx={{ flex: 1, minWidth: 0, alignItems: "flex-start" }}>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ textTransform: "uppercase", fontSize: "0.6rem", letterSpacing: "0.05em", fontWeight: 600, lineHeight: 1 }}>
                {t("sidebar.projects.count").replace("{count}", projects.length.toString())}
              </Typography>
              <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600, fontSize: "0.85rem", lineHeight: 1.2, mt: 0.25 }}>
                {activeProjectTitle ?? t("sidebar.project.fallback_title")}
              </Typography>
            </Stack>
            <ChevronDown size={14} />
          </ButtonBase>

          {/* Hide Sidebar Button */}
          {onHideSidebar && (
            <IconButton
              size="small"
              onClick={onHideSidebar}
              sx={{
                display: { xs: 'none', md: 'flex' },
                color: 'text.secondary',
                '&:hover': { color: 'text.primary', bgcolor: 'action.hover' }
              }}
              title="Hide Sidebar"
            >
              <ChevronLeft size={18} />
            </IconButton>
          )}
        </MuiBox>

        {/* Main List Area */}
        <MuiBox sx={{ flex: 1, overflow: "auto", py: 1.5, px: 1.5 }}>
          {isSyncing && (
            <MuiBox sx={{ mb: 2, display: "flex", justifyContent: "flex-end" }}>
              <Chip
                size="small"
                icon={<RefreshCw className="animate-spin" size={12} />}
                label="Syncing"
                color="success"
                variant="outlined"
                sx={{ height: 20, "& .MuiChip-label": { px: 1, fontSize: "0.65rem" } }}
              />
            </MuiBox>
          )}

          {moduleSections.map((section, idx) => {
            const sectionModules = section.ids
              .map((id) => modulesById[id])
              .filter((m): m is SidebarModule => Boolean(m));

            if (sectionModules.length === 0) return null;

            return (
              <MuiBox key={section.labelKey} sx={{ mb: idx < moduleSections.length - 1 ? 2 : 0 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ px: 1, mb: 0.5, display: "block", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", fontSize: "0.65rem" }}
                >
                  {t(section.labelKey)}
                </Typography>
                <List dense disablePadding>
                  {sectionModules.map((module) => {
                    const isActive = module.id === activeModuleId;
                    const isExpanded = expandedModules[module.id];
                    const nestedItems = module.nested ? getNestedItems(module.id) : [];

                    return (
                        <SidebarModuleItem
                          key={module.id}
                          module={module}
                          isActive={isActive}
                          isExpanded={isExpanded}
                          activeId={activeId}
                          nestedItems={nestedItems}
                          onModuleSelect={handleModuleSelectCb}
                          onCreateEntry={handleCreateEntryCb}
                          onToggleExpanded={toggleExpanded}
                          onNestedSelect={handleNestedSelect}
                        />
                    );
                  })}
                </List>
              </MuiBox>
            );
          })}
        </MuiBox>
      </MuiBox>

      {/* Footer */}
      <SidebarFooter
        onSignOut={handleSignOut}
        signingOut={signingOut}
        authError={authError}
        onOpenSettings={() => router.push("/dashboard/settings")}
      />

      <ProjectPopover
        projects={filteredProjects}
        anchorEl={projectAnchorEl}
        onClose={() => {
          setProjectAnchorEl(null);
          setProjectFilter("");
        }}
        activeProjectId={activeProjectId}
        filter={projectFilter}
        onFilterChange={setProjectFilter}
        onSelect={handleProjectSelect}
        newProjectTitle={newProjectTitle}
        onNewProjectTitleChange={setNewProjectTitle}
        onCreateProject={handleCreateProject}
        creatingProject={creatingProject}
      />
    </MuiBox>
  );
}

function ProjectPopover({
  projects,
  anchorEl,
  onClose,
  activeProjectId,
  filter,
  onFilterChange,
  onSelect,
  newProjectTitle,
  onNewProjectTitleChange,
  onCreateProject,
  creatingProject,
}: {
  projects: { id: string; title: string }[];
  anchorEl: HTMLElement | null;
  onClose: () => void;
  activeProjectId: string | null;
  filter: string;
  onFilterChange: (value: string) => void;
  onSelect: (projectId: string) => void;
  newProjectTitle: string;
  onNewProjectTitleChange: (value: string) => void;
  onCreateProject: () => void;
  creatingProject: boolean;
}) {
  const open = Boolean(anchorEl);
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
    >
      <MuiBox sx={{ width: 360, display: "flex", flexDirection: "column", maxHeight: 520 }}>
        <TextField
          value={filter}
          onChange={(event) => onFilterChange(event.target.value)}
          placeholder="Search projects"
          size="small"
          variant="outlined"
          sx={{ m: 2 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment> }}
        />
        <Divider />
        <List sx={{ flex: 1, overflowY: "auto" }}>
          {projects.map((project) => (
            <ListItemButton
              key={project.id}
              selected={project.id === activeProjectId}
              onClick={() => {
                onSelect(project.id);
                onClose();
              }}
            >
              <ListItemText
                primary={project.title}
                primaryTypographyProps={{ fontWeight: project.id === activeProjectId ? 600 : 500 }}
              />
              {project.id === activeProjectId && <Check size={16} />}
            </ListItemButton>
          ))}
          {projects.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
              No projects found.
            </Typography>
          )}
        </List>
        <Divider />
        <MuiBox sx={{ p: 2, display: "flex", gap: 1 }}>
          <TextField
            value={newProjectTitle}
            onChange={(event) => onNewProjectTitleChange(event.target.value)}
            placeholder="New project name"
            size="small"
            fullWidth
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onCreateProject();
              }
            }}
          />
          <Button variant="contained" onClick={onCreateProject} disabled={creatingProject}>
            {creatingProject ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
          </Button>
        </MuiBox>
      </MuiBox>
    </Popover>
  );
}

function SidebarFooter({
  onSignOut,
  signingOut,
  authError,
  onOpenSettings,
}: {
  onSignOut: () => void;
  signingOut: boolean;
  authError: string | null;
  onOpenSettings: () => void;
}) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [ideaOpen, setIdeaOpen] = useState(false);
  const [ideaText, setIdeaText] = useState("");
  const [isSavingIdea, setIsSavingIdea] = useState(false);
  const { createQuickIdea } = useDashboardWorkspace();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "es" : "en");
  };

  const handleSaveIdea = async () => {
    if (!ideaText.trim()) return;
    setIsSavingIdea(true);
    try {
      await createQuickIdea(ideaText);
      setIdeaText("");
      setIdeaOpen(false);
    } catch (e) {
      console.error("Failed to save idea", e);
    } finally {
      setIsSavingIdea(false);
    }
  };

  return (
    <MuiBox sx={{ borderTop: "1px solid", borderColor: "divider", p: 1.5 }}>
      <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
        <IconButton
          size="small"
          onClick={() => setIdeaOpen(true)}
          title="Quick Idea"
          sx={{ color: "text.secondary", "&:hover": { color: "var(--color-primary, #10b981)" } }}
        >
          <Lightbulb size={20} />
        </IconButton>
        <IconButton
          size="small"
          onClick={toggleTheme}
          title="Toggle Theme"
          sx={{ color: "text.secondary", "&:hover": { color: "var(--color-primary, #10b981)" } }}
        >
          {(resolvedTheme ?? theme) === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </IconButton>
        <IconButton
          size="small"
          onClick={toggleLanguage}
          title="Toggle Language"
          sx={{ color: "text.secondary", fontSize: "0.875rem", fontWeight: 700 }}
        >
          {language.toUpperCase()}
        </IconButton>
        <IconButton
          size="small"
          onClick={onOpenSettings}
          title="Settings"
          sx={{ color: "text.secondary" }}
        >
          <Settings size={20} />
        </IconButton>
        <IconButton
          size="small"
          color="error"
          onClick={onSignOut}
          disabled={signingOut}
          title="Sign out"
        >
          {signingOut ? <Loader2 className="animate-spin" size={20} /> : <LogOut size={20} />}
        </IconButton>
      </Stack>
      {authError && (
        <Typography variant="caption" color="error" align="center" display="block" sx={{ mt: 1 }}>
          {authError}
        </Typography>
      )}

      {/* Quick Idea Dialog */}
      <Dialog 
        open={ideaOpen} 
        onClose={() => !isSavingIdea && setIdeaOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: "background.paper",
            backgroundImage: "none",
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <MuiBox sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Lightbulb className="text-emerald-500" size={20} />
            <Typography variant="h6" fontWeight="bold">Quick Idea</Typography>
          </MuiBox>
          <IconButton onClick={() => setIdeaOpen(false)} size="small" disabled={isSavingIdea}>
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <TextField
            autoFocus
            multiline
            rows={4}
            placeholder="Type your idea here..."
            variant="outlined"
            fullWidth
            value={ideaText}
            onChange={(e) => setIdeaText(e.target.value)}
            disabled={isSavingIdea}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            variant="contained" 
            onClick={handleSaveIdea}
            disabled={!ideaText.trim() || isSavingIdea}
            endIcon={isSavingIdea ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: 'emerald.500',
              '&:hover': { bgcolor: 'emerald.600' }
            }}
          >
            Save Idea
          </Button>
        </DialogActions>
      </Dialog>
    </MuiBox>
  );
}

function useModuleCounts({
  chapters,
  worldElements,
  files,
  projects,
}: {
  chapters: { id: string }[];
  worldElements: { id: string; type: string }[];
  files: { id: string }[];
  projects: { id: string }[];
}) {
  return useMemo(() => {
    const byType = worldElements.reduce<Record<string, number>>((acc, element) => {
      acc[element.type] = (acc[element.type] ?? 0) + 1;
      return acc;
    }, {});

    return {
      totalEntries: (chapters?.length ?? 0) + (worldElements?.length ?? 0) + (files?.length ?? 0),
      chapters: chapters?.length ?? 0,
      characters: byType.character ?? 0,
      locations: byType.location ?? 0,
      lore: byType.lore ?? 0,
      items: byType.item ?? 0,
      ideas: byType.idea ?? 0,
      maps: byType.map ?? 0,
      files: files?.length ?? 0,
      projects: projects?.length ?? 0,
    } as const;
  }, [chapters, worldElements, files, projects]);
}

const SidebarModuleItem = memo(function SidebarModuleItem({
  module,
  isActive,
  isExpanded,
  activeId,
  nestedItems,
  onModuleSelect,
  onCreateEntry,
  onToggleExpanded,
  onNestedSelect,
}: {
  module: SidebarModule;
  isActive: boolean;
  isExpanded: boolean;
  activeId: string | null;
  nestedItems: { id: string; title: string }[];
  onModuleSelect: (module: SidebarModule) => void;
  onCreateEntry: (e: React.MouseEvent, type: string, href: string) => void;
  onToggleExpanded: (e: React.MouseEvent, id: string) => void;
  onNestedSelect: (href: string, id: string) => void;
}) {
  const { deleteWorldElementRecord, deleteChapterRecord } = useDashboardWorkspace();
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    id: string;
    type: string;
    title: string;
  } | null>(null);

  const handleContextMenu = (event: React.MouseEvent, id: string, title: string) => {
    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? {
            mouseX: event.clientX + 2,
            mouseY: event.clientY - 6,
            id,
            type: module.createType || '',
            title,
          }
        : null
    );
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleDelete = async () => {
    if (!contextMenu) return;
    
    if (window.confirm(`Are you sure you want to delete "${contextMenu.title}"?`)) {
      if (contextMenu.type === 'chapter') {
        await deleteChapterRecord(contextMenu.id);
      } else {
        await deleteWorldElementRecord(contextMenu.id);
      }
    }
    handleCloseContextMenu();
  };

  const handleRename = () => {
    if (!contextMenu) return;
    onNestedSelect(module.href, contextMenu.id);
    handleCloseContextMenu();
  };

  return (
    <MuiBox sx={{ mb: 0.25 }}>
      <ListItemButton
        selected={isActive}
        onClick={(e) => {
          if (module.nested) {
            onToggleExpanded(e, module.id);
          }
          onModuleSelect(module);
        }}
        className="group relative"
        sx={{
          borderRadius: 1,
          py: 0.5,
          px: 1,
          minHeight: 32,
          "&.Mui-selected": {
            bgcolor: "var(--color-primary-light, rgba(16, 185, 129, 0.1))",
            "&:hover": { bgcolor: "var(--color-primary-light, rgba(16, 185, 129, 0.15))" },
          },
          "&:hover": {
            bgcolor: "action.hover",
          },
        }}
      >
        {module.nested && (
          <IconButton
            size="small"
            onClick={(e) => onToggleExpanded(e, module.id)}
            sx={{
              p: 0.25,
              mr: 0.75,
              ml: -0.5,
              color: isActive ? "var(--color-primary, #10b981)" : "text.secondary",
            }}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </IconButton>
        )}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, ml: module.nested ? 0 : 0.5 }}>
          <module.icon
            size={16}
            style={{
              color: isActive ? "var(--color-primary, #10b981)" : "inherit",
            }}
          />
          <Typography
            variant="body2"
            sx={{
              fontSize: "0.8125rem",
              fontWeight: isActive ? 600 : 500,
              color: isActive ? "var(--color-primary, #10b981)" : "text.primary",
            }}
          >
            {module.label}
          </Typography>
        </Stack>
        
        <Stack
          direction="row"
          spacing={0.25}
          alignItems="center"
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          sx={isActive ? { opacity: 1 } : {}}
        >
          {module.createType && (
            <IconButton
              size="small"
              onClick={(e) => onCreateEntry(e, module.createType!, module.href)}
              sx={{
                p: 0.25,
                color: "text.secondary",
                "&:hover": { color: "var(--color-primary, #10b981)", bgcolor: "var(--color-primary-light, rgba(16, 185, 129, 0.1))" },
              }}
            >
              <Plus size={14} />
            </IconButton>
          )}
        </Stack>
      </ListItemButton>

      {/* Nested Items */}
      {module.nested && nestedItems.length > 0 && (
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <List dense disablePadding className="mt-1">
            {nestedItems.map((nested) => {
              const isNestedActive = isActive && activeId === nested.id;
              return (
                <ListItemButton
                  key={nested.id}
                  selected={isNestedActive}
                  onClick={() => onNestedSelect(module.href, nested.id)}
                  onContextMenu={(e) => handleContextMenu(e, nested.id, nested.title)}
                  className="pl-8 pr-2 py-1 rounded min-h-[24px]"
                  sx={{
                    "&.Mui-selected": {
                      bgcolor: "var(--color-primary-light, rgba(16, 185, 129, 0.1))",
                      "&:hover": { bgcolor: "var(--color-primary-light, rgba(16, 185, 129, 0.15))" },
                    },
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" className="flex-1">
                    <span className={`text-[0.4rem] flex items-center ${isNestedActive ? 'text-[var(--color-primary)]' : 'text-gray-400'}`}>
                      ■
                    </span>
                    <Typography
                      variant="body2"
                      noWrap
                      className={`text-xs ${isNestedActive ? 'font-medium text-[var(--color-primary)]' : 'font-normal text-gray-500 dark:text-gray-400'}`}
                    >
                      {nested.title}
                    </Typography>
                  </Stack>
                </ListItemButton>
              );
            })}
          </List>
        </Collapse>
      )}

      {/* Context Menu for nested items */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
        slotProps={{
          paper: {
            sx: {
              minWidth: 150,
              boxShadow: "var(--elevation-2)",
            }
          }
        }}
      >
        <MenuItem onClick={handleRename} sx={{ fontSize: '0.875rem' }}>
          Open / Rename
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main', fontSize: '0.875rem' }}>
          Delete
        </MenuItem>
      </Menu>
    </MuiBox>
  );
});
