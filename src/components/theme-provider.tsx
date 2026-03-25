"use client"

import * as React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps as NextThemesProviderProps,
  useTheme as useNextTheme,
} from "next-themes"

const THEME_CLASSES = new Set(["light", "dark", "system"])

export type ThemeProviderProps = NextThemesProviderProps & {
  forcedTheme?: string
}

function applyThemeClass(theme: string) {
  if (typeof document === "undefined") return
  const root = document.documentElement
  const normalized = THEME_CLASSES.has(theme) ? theme : "light"
  root.classList.remove("light", "dark")
  if (normalized !== "system") {
    root.classList.add(normalized)
  } else {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    root.classList.add(prefersDark ? "dark" : "light")
  }
}

export function setInstantTheme(theme: string) {
  applyThemeClass(theme)
}

export function useInstantTheme() {
  const { setTheme, resolvedTheme } = useNextTheme()
  const [instantTheme, setInstantThemeState] = useState<string | undefined>(undefined)
  const lastApplied = useRef<string | undefined>()

  const setInstant = useCallback(
    (theme: string) => {
      lastApplied.current = theme
      setInstantThemeState(theme)
      applyThemeClass(theme)
      setTheme(theme)
    },
    [setTheme],
  )

  useEffect(() => {
    if (!lastApplied.current && resolvedTheme) {
      applyThemeClass(resolvedTheme)
    }
  }, [resolvedTheme])

  return { setTheme: setInstant, resolvedTheme: instantTheme ?? resolvedTheme }
}

export function ThemeProvider({
  children,
  forcedTheme,
  ...props
}: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (forcedTheme) {
      applyThemeClass(forcedTheme)
    }
  }, [forcedTheme])

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      forcedTheme={forcedTheme}
      {...props}
    >
      {mounted ? children : null}
    </NextThemesProvider>
  )
}
