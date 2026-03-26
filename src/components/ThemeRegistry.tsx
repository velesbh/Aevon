'use client';

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ThemeProvider, CssBaseline, createTheme, responsiveFontSizes } from '@mui/material';
import type { ThemeOptions } from '@mui/material/styles';
import { useTheme as useNextTheme } from 'next-themes';

function buildTheme(mode: 'light' | 'dark'): ThemeOptions {
  const isDark = mode === 'dark';

  const basePalette = {
    primary: {
      main: isDark ? '#34a853' : '#188038',
      dark: isDark ? '#188038' : '#115b27',
      light: isDark ? '#53b76f' : '#34a853',
      contrastText: '#ffffff',
    },
    secondary: {
      main: isDark ? '#a0a4ab' : '#5f6368',
    },
    background: {
      default: isDark ? '#0c0d10' : '#f8f9fa',
      paper: isDark ? '#131518' : '#ffffff',
    },
    text: {
      primary: isDark ? '#e8e9eb' : '#111214',
      secondary: isDark ? '#8b8f96' : '#5f6368',
    },
    divider: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
  } as const;

  return {
    palette: {
      mode,
      ...basePalette,
    },
    shape: {
      borderRadius: 12,
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
            transition: 'all 0.15s ease',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
            backgroundImage: 'none',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            backgroundImage: 'none',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 20,
            backgroundImage: 'none',
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            transition: 'all 0.15s ease',
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            transition: 'all 0.15s ease',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
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
