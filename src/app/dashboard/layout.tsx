"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Menu as MenuIcon,
} from "lucide-react";
import { DashboardWorkspaceProvider } from "@/components/dashboard/workspace-provider";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { hasSupabaseEnv, supabase } from "@/lib/supabase";
import { bootstrapWorkspaceForCurrentUser, signOutWorkspaceUser } from "@/lib/workspace";
import { useLanguage } from "@/lib/i18n";
import { RefreshCw } from "lucide-react";
import { DashboardBottomNav } from "@/components/dashboard/bottom-nav";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  CircularProgress,
  Container,
  Paper,
} from "@mui/material";

const DEFAULT_DRAWER_WIDTH = 220;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState(DEFAULT_DRAWER_WIDTH);
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingSidebar) return;
      const newWidth = Math.max(200, Math.min(e.clientX, 600));
      setDrawerWidth(newWidth);
    };
    const handleMouseUp = () => {
      setIsDraggingSidebar(false);
    };
    if (isDraggingSidebar) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingSidebar]);

  const handleSidebarMouseDown = () => {
    setIsDraggingSidebar(true);
  };

  useEffect(() => {
    const { onSyncStateChange } = require('@/lib/sync-manager');
    const unsubscribe = onSyncStateChange((syncing: boolean) => {
      setIsSyncing(syncing);
    });
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  const handleDrawerClose = () => {
    setIsClosing(true);
    setMobileOpen(false);
  };

  const handleDrawerTransitionEnd = () => {
    setIsClosing(false);
  };

  const handleDrawerToggle = () => {
    if (!isClosing) {
      setMobileOpen(!mobileOpen);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function initializeDashboard() {
      if (!hasSupabaseEnv) {
        if (!cancelled) {
          setAuthError(
            "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and a public Supabase browser key.",
          );
        }
        return;
      }

      try {
        const pendingProjectName = typeof window !== "undefined" ? window.localStorage.getItem("aevon.pendingProjectName") : null;
        
        const user = await bootstrapWorkspaceForCurrentUser({
          projectName: pendingProjectName || undefined,
        });
        
        if (typeof window !== "undefined" && pendingProjectName) {
          window.localStorage.removeItem("aevon.pendingProjectName");
        }

        if (!user) {
          router.replace("/login");
          return;
        }

        if (!cancelled) {
          setAuthReady(true);
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : "Unable to initialize your workspace.";
          setAuthError(message);
        }
      }
    }

    void initializeDashboard();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Ignore initial session and token refresh events to prevent reload flicker/jumps
      if (
        (event as string) === 'INITIAL_SESSION' || 
        (event as string) === 'TOKEN_REFRESHED' || 
        (event as string) === 'TOKEN_REFRESH_FAILED'
      ) {
        if (session?.user && !authReady) {
          setAuthError(null);
          setAuthReady(true);
        }
        return;
      }

      // Only handle definitive sign-out or sign-in that isn't a refresh
      if (event === 'SIGNED_OUT' || (!session?.user && event !== 'INITIAL_SESSION')) {
        setAuthReady(false);
        router.replace("/login");
        return;
      }
      
      if (session?.user && !authReady) {
        setAuthError(null);
        setAuthReady(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  if (!authReady) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', px: 3 }}>
        <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%', textAlign: 'center' }}>
          {authError ? (
            <>
              <Typography variant="h6" color="error" gutterBottom>{t("dashboard.unavailable")}</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>{authError}</Typography>
              <Button variant="contained" onClick={() => router.push("/login")}>
                {t("dashboard.returnLogin")}
              </Button>
            </>
          ) : (
            <>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography variant="h6" gutterBottom>{t("dashboard.loading")}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t("dashboard.loading.desc")}
              </Typography>
            </>
          )}
        </Paper>
      </Box>
    );
  }

  return (
    <DashboardWorkspaceProvider>
      <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
        {/* Mobile menu handled by Bottom Nav or FAB, removing redundant top AppBar */}
        <Box
          component="nav"
          sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
          aria-label="mailbox folders"
        >
          {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onTransitionEnd={handleDrawerTransitionEnd}
            onClose={handleDrawerClose}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
          >
            <DashboardSidebar setMobileMenuOpen={setMobileOpen} mobileMenuOpen={mobileOpen} isMui={true} onHideSidebar={() => setIsSidebarHidden(true)} />
          </Drawer>
          {!isSidebarHidden && (
            <Drawer
              variant="permanent"
              sx={{
                display: { xs: 'none', md: 'block' },
                '& .MuiDrawer-paper': { 
                  boxSizing: 'border-box', 
                  width: drawerWidth, 
                  transition: isDraggingSidebar ? 'none' : undefined,
                  overflow: 'visible' 
                },
              }}
              open
            >
              <DashboardSidebar setMobileMenuOpen={setMobileOpen} mobileMenuOpen={mobileOpen} isMui={true} onHideSidebar={() => setIsSidebarHidden(true)} />
              
              {/* Drag Handle */}
              <Box
                onMouseDown={handleSidebarMouseDown}
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '4px',
                  height: '100%',
                  cursor: 'col-resize',
                  backgroundColor: isDraggingSidebar ? 'var(--color-primary)' : 'transparent',
                  zIndex: 9999,
                  '&:hover': {
                    backgroundColor: 'var(--color-primary)',
                  }
                }}
              />
            </Drawer>
          )}
        </Box>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: { xs: '100%', md: isSidebarHidden ? '100%' : `calc(100% - ${drawerWidth}px)` },
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            overflow: 'auto',
            position: 'relative',
          }}
        >
          {/* Main Content Area - No redundant topbars */}
          {/* Desktop floating syncing indicator */}
          {isSidebarHidden && (
            <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 50, display: { xs: 'none', md: 'block' } }}>
              <IconButton 
                size="small" 
                onClick={() => setIsSidebarHidden(false)}
                sx={{ bgcolor: 'background.paper', boxShadow: 1, border: '1px solid', borderColor: 'divider', '&:hover': { bgcolor: 'action.hover' } }}
              >
                <MenuIcon size={18} />
              </IconButton>
            </Box>
          )}
          {isSyncing && (
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                position: 'absolute',
                bottom: 24,
                right: 24,
                zIndex: 50,
                alignItems: 'center',
                gap: 1,
                bgcolor: 'background.paper',
                px: 1.5,
                py: 0.75,
                borderRadius: 4,
                boxShadow: 3,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <RefreshCw className="animate-spin text-emerald-500" size={14} />
            </Box>
          )}
          {children}
          <Box sx={{ height: { xs: 80, md: 0 } }} />
          <DashboardBottomNav />
        </Box>
      </Box>
    </DashboardWorkspaceProvider>
  );
}
