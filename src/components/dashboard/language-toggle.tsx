"use client";

import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function DashboardLanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="rounded-[16px] border border-[var(--border-ui)] bg-[var(--background-app)] p-1 h-12" />
    );
  }

  const options = [
    { id: "en", label: "EN" },
    { id: "es", label: "ES" },
  ] as const;

  return (
    <div className="rounded-[16px] border border-[var(--border-ui)] bg-[var(--background-app)] p-1">
      <div className="relative grid grid-cols-2 gap-1">
        {options.map((option) => {
          const isActive = language === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setLanguage(option.id)}
              className={cn(
                "relative z-10 inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors duration-200",
                isActive
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="language-active"
                  className="absolute inset-0 rounded-xl bg-[var(--background-surface)] shadow-sm border border-[var(--border-ui)]"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
