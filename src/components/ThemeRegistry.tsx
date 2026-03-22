'use client';

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ThemeProvider, CssBaseline, createTheme, responsiveFontSizes } from '@mui/material';
import type { ThemeOptions } from '@mui/material/styles';
import { useTheme as useNextTheme } from 'next-themes';

const brandGreen = '#10b981';

function buildTheme(mode: 'light' | 'dark'): ThemeOptions {
  const isDark = mode === 'dark';

  const basePalette = {
    primary: {
      main: brandGreen,
      dark: '#059669',
      light: '#6ee7b7',
    },
    secondary: {
      main: isDark ? '#d1fae5' : '#064e3b',
    },
    background: {
      default: isDark ? '#050607' : '#f5f7f6',
      paper: isDark ? '#0f1115' : '#ffffff',
    },
    text: {
      primary: isDark ? '#f4f7f5' : '#0a0d0c',
      secondary: isDark ? '#a5b2af' : '#4b625b',
    },
    divider: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'
  } as const;

  return {
    palette: {
      mode,
      ...basePalette,
    },
    shape: {
      borderRadius: 14,
    },
    typography: {
      fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      button: {
        fontWeight: 600,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 999,
            paddingInline: 20,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 24,
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
    },
  } satisfies ThemeOptions;
}

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const muiTheme = useMemo(() => {
    const mode = (resolvedTheme ?? 'light') as 'light' | 'dark';
    return responsiveFontSizes(createTheme(buildTheme(mode)));
  }, [resolvedTheme]);

  if (!mounted) {
    return null;
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline enableColorScheme />
      {children}
    </ThemeProvider>
  );
}
