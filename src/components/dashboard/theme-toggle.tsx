"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const themes = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
] as const;

export function DashboardThemeToggle() {
  const { resolvedTheme, setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="rounded-[16px] border border-[var(--border-ui)] bg-[var(--background-app)] p-1 h-[42px]" />
    );
  }

  const activeTheme = theme === "system" ? resolvedTheme ?? "light" : theme ?? "light";

  return (
    <div className="rounded-[16px] border border-[var(--border-ui)] bg-[var(--background-app)] p-1">
      <div className="relative grid grid-cols-2 gap-1">
        {themes.map((option) => {
          const isActive = activeTheme === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setTheme(option.id)}
              className={cn(
                "relative z-10 inline-flex items-center justify-center gap-1.5 rounded-xl px-2 py-1.5 text-[12px] font-medium transition-colors duration-200",
                isActive
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="theme-active"
                  className="absolute inset-0 rounded-xl bg-[var(--background-surface)] shadow-sm border border-[var(--border-ui)]"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <option.icon className={cn("h-4 w-4", isActive ? "text-brand-500" : "")} />
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
