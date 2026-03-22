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

const drawerWidth = 240;

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

  useEffect(() => {
    const { onSyncStateChange } = require('@/lib/sync-manager');
    const unsubscribe = onSyncStateChange((syncing: boolean) => {
      setIsSyncing(syncing);
    });
    return () => unsubscribe();
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
      // Don't forcefully log out if token refresh fails due to being offline
      if ((event as string) === 'TOKEN_REFRESH_FAILED') {
        return;
      }
      
      if (!session?.user) {
        setAuthReady(false);
        router.replace("/login");
        return;
      }

      setAuthError(null);
      setAuthReady(true);
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
        <AppBar
          position="fixed"
          sx={{
            display: { md: 'none' },
            width: '100%',
            bgcolor: 'background.paper',
            color: 'text.primary',
            boxShadow: 1,
            zIndex: (theme) => theme.zIndex.drawer + 1,
          }}
        >
          <Toolbar variant="dense">
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Box sx={{ flexGrow: 1 }} />
            {isSyncing && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <RefreshCw className="animate-spin" size={16} />
                <Typography variant="caption">Syncing</Typography>
              </Box>
            )}
          </Toolbar>
        </AppBar>
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
            <DashboardSidebar setMobileMenuOpen={setMobileOpen} mobileMenuOpen={mobileOpen} isMui={true} />
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', md: 'block' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
            open
          >
            <DashboardSidebar setMobileMenuOpen={setMobileOpen} mobileMenuOpen={mobileOpen} isMui={true} />
          </Drawer>
        </Box>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            overflow: 'auto',
            position: 'relative',
          }}
        >
          <Toolbar variant="dense" sx={{ flexShrink: 0, display: { xs: 'flex', md: 'none' } }} />
          {/* Desktop floating syncing indicator */}
          {isSyncing && (
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                position: 'absolute',
                top: 16,
                right: 24,
                zIndex: 50,
                alignItems: 'center',
                gap: 1,
                bgcolor: 'background.paper',
                px: 2,
                py: 1,
                borderRadius: 2,
                boxShadow: 2,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <RefreshCw className="animate-spin text-emerald-500" size={16} />
              <Typography variant="caption" sx={{ fontWeight: 500 }}>Syncing...</Typography>
            </Box>
          )}
          {children}
        </Box>
      </Box>
    </DashboardWorkspaceProvider>
  );
}
