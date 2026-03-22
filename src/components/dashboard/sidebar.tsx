"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  Download,
  FolderOpen,
  LayoutDashboard,
  Loader2,
  LogOut,
  Settings,
  Users,
  ChevronDown,
  MapPinned,
  ScrollText,
  MapPin,
  Package,
  Network,
  Check,
  PlusCircle,
  RefreshCw,
} from "lucide-react";
import { useDashboardWorkspace } from "@/components/dashboard/workspace-provider";
import { signOutWorkspaceUser } from "@/lib/workspace";
import { onSyncStateChange } from "@/lib/sync-manager";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Box as MuiBox,
  Collapse,
} from "@mui/material";

export function DashboardSidebar({ 
  mobileMenuOpen, 
  setMobileMenuOpen,
  isMui = false
}: { 
  mobileMenuOpen: boolean, 
  setMobileMenuOpen: (open: boolean) => void,
  isMui?: boolean
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const [signingOut, setSigningOut] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const { projects, activeProjectId, activeProjectTitle, switchProject } = useDashboardWorkspace();

  useEffect(() => {
    const unsubscribe = onSyncStateChange((syncing) => setIsSyncing(syncing));
    return () => { unsubscribe(); };
  }, []);

  const navigation = [
    { name: t("dashboard.nav.dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { name: t("dashboard.nav.manuscript"), href: "/dashboard/manuscript", icon: BookOpen },
    { name: t("dashboard.nav.characters"), href: "/dashboard/characters", icon: Users },
  ];

  const worldNavigation = [
    { name: t("dashboard.nav.locations"), href: "/dashboard/locations", icon: MapPin },
    { name: t("dashboard.nav.lore"), href: "/dashboard/lore", icon: ScrollText },
    { name: t("dashboard.nav.items"), href: "/dashboard/items", icon: Package },
    { name: t("dashboard.nav.maps"), href: "/dashboard/maps", icon: MapPinned },
    { name: t("dashboard.nav.relationships"), href: "/dashboard/relationships", icon: Network },
  ];

  const bottomNavigation = [
    { name: t("dashboard.nav.files"), href: "/dashboard/files", icon: FolderOpen },
    { name: t("dashboard.nav.export"), href: "/dashboard/export", icon: Download },
  ];

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

  const content = (
    <>
      <MuiBox sx={{ display: 'flex', alignItems: 'center', p: 2, pb: 1, minHeight: 64 }}>
        <MuiBox 
          onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
          sx={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer', width: '100%', '&:hover': { opacity: 0.8 } }}
        >
          <MuiBox sx={{ 
            display: 'flex', 
            height: 32, 
            width: 32, 
            alignItems: 'center', 
            justifyContent: 'center', 
            borderRadius: '10px', 
            background: 'linear-gradient(to bottom right, #10b981, #047857)', 
            color: 'white',
            fontWeight: 'bold',
            flexShrink: 0
          }}>
            {activeProjectTitle ? activeProjectTitle.charAt(0).toUpperCase() : t("sidebar.project.default_initial")}
          </MuiBox>
          <MuiBox sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
            <MuiBox sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" noWrap sx={{ fontWeight: 'bold' }}>
                {activeProjectTitle || t("sidebar.project.fallback_title")}
              </Typography>
              {isSyncing && (
                <RefreshCw
                  className="animate-spin text-emerald-500"
                  style={{ width: 14, height: 14 }}
                />
              )}
            </MuiBox>
            <Typography variant="caption" color="text.secondary" noWrap>
              {projects.length === 0 ? t("sidebar.projects.none") : t("sidebar.projects.count").replace("{count}", projects.length.toString())}
            </Typography>
          </MuiBox>
          <ChevronDown style={{ width: 16, height: 16, transition: 'transform 0.2s', transform: projectDropdownOpen ? 'rotate(180deg)' : 'none' }} />
        </MuiBox>
      </MuiBox>

      <Collapse in={projectDropdownOpen} timeout="auto" unmountOnExit>
        <List component="div" disablePadding sx={{ bgcolor: 'background.default', borderBottom: 1, borderColor: 'divider' }}>
          {projects.map((project) => (
            <ListItemButton
              key={project.id}
              sx={{ pl: 4, py: 0.5 }}
              selected={project.id === activeProjectId}
              onClick={(e) => {
                e.preventDefault();
                switchProject(project.id);
                setProjectDropdownOpen(false);
                if (typeof setMobileMenuOpen === 'function') {
                  try { setMobileMenuOpen(false); } catch(err) {}
                }
              }}
            >
              <ListItemText 
                primary={project.title} 
                primaryTypographyProps={{ variant: 'body2', noWrap: true, color: project.id === activeProjectId ? 'primary.main' : 'text.primary' }} 
              />
              {project.id === activeProjectId && <Check style={{ width: 16, height: 16, color: '#10b981' }} />}
            </ListItemButton>
          ))}
          {projects.length === 0 && (
            <ListItem sx={{ pl: 4 }}><ListItemText primary={t("sidebar.projects.none")} primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }} /></ListItem>
          )}
          <ListItemButton
            sx={{ pl: 4, py: 1, color: 'primary.main', borderTop: 1, borderColor: 'divider' }}
            onClick={(e) => {
              e.preventDefault();
              setProjectDropdownOpen(false);
              if (typeof setMobileMenuOpen === 'function') {
                try { setMobileMenuOpen(false); } catch(err) {}
              }
              router.push("/dashboard/projects");
            }}
          >
            <ListItemIcon sx={{ minWidth: 28, color: 'inherit' }}>
              <PlusCircle style={{ width: 16, height: 16 }} />
            </ListItemIcon>
            <ListItemText primary={t("sidebar.projects.create_new") || "Create New Project"} primaryTypographyProps={{ variant: 'body2', fontWeight: 'bold' }} />
          </ListItemButton>
        </List>
      </Collapse>

      <MuiBox sx={{ overflow: 'auto', flexGrow: 1 }}>
        <Typography variant="overline" sx={{ px: 2, pt: 2, display: 'block', color: 'text.secondary', fontWeight: 'bold', lineHeight: 1 }}>
          {t("sidebar.section.workspace")}
        </Typography>
        <List>
          {navigation.map((item) => (
            <NavLink key={item.name} href={item.href} icon={item.icon} name={item.name} onClick={() => typeof setMobileMenuOpen === 'function' && setMobileMenuOpen(false)} />
          ))}
        </List>

        <Typography variant="overline" sx={{ px: 2, pt: 1, display: 'block', color: 'text.secondary', fontWeight: 'bold', lineHeight: 1 }}>
          {t("sidebar.section.world")}
        </Typography>
        <List>
          {worldNavigation.map((item) => (
            <NavLink key={item.name} href={item.href} icon={item.icon} name={item.name} onClick={() => typeof setMobileMenuOpen === 'function' && setMobileMenuOpen(false)} />
          ))}
        </List>

        <Typography variant="overline" sx={{ px: 2, pt: 1, display: 'block', color: 'text.secondary', fontWeight: 'bold', lineHeight: 1 }}>
          {t("sidebar.section.system")}
        </Typography>
        <List>
          {bottomNavigation.map((item) => (
            <NavLink key={item.name} href={item.href} icon={item.icon} name={item.name} onClick={() => typeof setMobileMenuOpen === 'function' && setMobileMenuOpen(false)} />
          ))}
        </List>
      </MuiBox>

      <Divider />
      <MuiBox sx={{ p: 2 }}>
        <List disablePadding>
          <ListItem disablePadding>
            <ListItemButton onClick={(e) => { e.preventDefault(); router.push("/dashboard/settings"); }} sx={{ borderRadius: 1, py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 36 }}><Settings style={{ width: 18, height: 18 }} /></ListItemIcon>
              <ListItemText primary={t("dashboard.settings")} primaryTypographyProps={{ variant: 'body2' }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={handleSignOut} disabled={signingOut} sx={{ borderRadius: 1, py: 0.5, color: 'error.main', '&:hover': { bgcolor: 'error.main', color: 'error.contrastText' } }}>
              <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
                {signingOut ? <Loader2 className="animate-spin" style={{ width: 18, height: 18 }} /> : <LogOut style={{ width: 18, height: 18 }} />}
              </ListItemIcon>
              <ListItemText primary={t("dashboard.signOut")} primaryTypographyProps={{ variant: 'body2' }} />
            </ListItemButton>
          </ListItem>
        </List>
        {authError && <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>{authError}</Typography>}
      </MuiBox>
    </>
  );

  return (
    <MuiBox sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.paper' }}>
      {content}
    </MuiBox>
  );
}

function NavLink({
  href,
  icon: Icon,
  name,
  onClick,
}: {
  href: string;
  icon: any;
  name: string;
  onClick?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  // Strip trailing slashes for clean comparison
  const normalizedPathname = pathname.replace(/\/$/, '') || '/';
  const normalizedHref = href.replace(/\/$/, '') || '/';
  const isActive =
    normalizedHref === "/dashboard"
      ? normalizedPathname === "/dashboard"
      : normalizedPathname === normalizedHref || normalizedPathname.startsWith(normalizedHref + '/');

  const handleClick = (e: any) => {
    e.preventDefault();
    if (typeof onClick === 'function') {
      try { onClick(); } catch(err) {}
    }
    router.push(href);
  };

  return (
    <ListItem disablePadding>
      <ListItemButton
        selected={isActive}
        onClick={handleClick}
        sx={{
              mx: 1,
              borderRadius: 1,
              mb: 0.5,
              py: 0.5,
              '&.Mui-selected': {
                bgcolor: 'rgba(16, 185, 129, 0.1)',
                color: '#059669',
                '&:hover': {
                  bgcolor: 'rgba(16, 185, 129, 0.2)',
                }
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: isActive ? '#059669' : 'text.secondary' }}>
              <Icon style={{ width: 18, height: 18 }} />
            </ListItemIcon>
            <ListItemText
              primary={name}
              primaryTypographyProps={{
                variant: 'body2',
                fontWeight: isActive ? 'bold' : 'medium'
              }}
            />
          </ListItemButton>
    </ListItem>
  );
}
