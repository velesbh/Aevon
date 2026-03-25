"use client";

import { usePathname, useRouter } from "next/navigation";
import { 
  BookOpen, 
  Users, 
  Map, 
  FolderOpen,
  Plus
} from "lucide-react";
import { 
  Paper, 
  BottomNavigation, 
  BottomNavigationAction,
  Box,
  Fab
} from "@mui/material";
import { useLanguage } from "@/lib/i18n";
import { useDashboardWorkspace } from "./workspace-provider";

export function DashboardBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const { createQuickIdea } = useDashboardWorkspace();

  // Map path to index for BottomNavigation
  const getValue = () => {
    if (pathname.includes("/manuscript")) return 0;
    if (pathname.includes("/characters")) return 1;
    if (pathname.includes("/locations") || pathname.includes("/items") || pathname.includes("/ideas")) return 2;
    if (pathname.includes("/files")) return 3;
    return -1;
  };

  const handleChange = (event: any, newValue: number) => {
    switch (newValue) {
      case 0: router.push("/dashboard/manuscript"); break;
      case 1: router.push("/dashboard/characters"); break;
      case 2: router.push("/dashboard/ideas"); break; // Default to ideas for world elements
      case 3: router.push("/dashboard/files"); break;
    }
  };

  return (
    <Paper 
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        display: { xs: 'block', md: 'none' },
        zIndex: (theme) => theme.zIndex.appBar,
        borderRadius: '16px 16px 0 0',
        overflow: 'hidden',
        boxShadow: '0 -4px 12px rgba(0,0,0,0.1)'
      }} 
      elevation={3}
    >
      <BottomNavigation
        showLabels
        value={getValue()}
        onChange={handleChange}
        sx={{ height: 64 }}
      >
        <BottomNavigationAction 
          label={t("dashboard.nav.manuscript")} 
          icon={<BookOpen size={20} />} 
        />
        <BottomNavigationAction 
          label={t("dashboard.nav.characters")} 
          icon={<Users size={20} />} 
        />
        <BottomNavigationAction 
          label={t("dashboard.nav.world")} 
          icon={<Map size={20} />} 
        />
        <BottomNavigationAction 
          label={t("dashboard.nav.files")} 
          icon={<FolderOpen size={20} />} 
        />
      </BottomNavigation>
    </Paper>
  );
}
