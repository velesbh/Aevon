"use client";

import { useMemo, useState } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const typeAccentMap: Record<string, string> = {
  character: "text-rose-500 dark:text-rose-300",
  location: "text-sky-500 dark:text-sky-300",
  item: "text-amber-500 dark:text-amber-300",
  lore: "text-emerald-500 dark:text-emerald-300",
};

export const MentionNodeView: React.FC<NodeViewProps> = ({ node }) => {
  const { label, type, id, description } = node.attrs;
  const [showHover, setShowHover] = useState(false);
  const accentClass = useMemo(() => typeAccentMap[type as string] ?? "text-[var(--accent-primary)]", [type]);

  const handleNavigate = () => {
    if (typeof window === "undefined") {
      return;
    }
    const resource = `${String(type)}s`;
    const url = `/dashboard/${resource}/${id}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <NodeViewWrapper as="span" className="inline-flex relative">
      <span
        role="button"
        tabIndex={0}
        onClick={(event) => {
          event.preventDefault();
          handleNavigate();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleNavigate();
          }
        }}
        onMouseEnter={() => setShowHover(true)}
        onMouseLeave={() => setShowHover(false)}
        className={cn(
          "mention inline-flex items-center gap-1 rounded-full border border-transparent px-2 py-0.5 text-sm font-semibold",
          "bg-[var(--surface-sunken)] text-[var(--foreground-default)]",
          "shadow-sm transition-colors hover:bg-[var(--surface-sunken)]/80",
        )}
      >
        <span className={cn("text-xs font-mono uppercase tracking-wide", accentClass)}>@{type}</span>
        <span>{label}</span>
        <ExternalLink className="h-3.5 w-3.5 text-[var(--foreground-muted)]" />
      </span>

      {showHover && (
        <div className="absolute z-40 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-xl border border-[var(--border-ui)] bg-[var(--background-app)] p-3 text-sm shadow-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-ui)] bg-[var(--surface-sunken)] text-base font-bold">
              {label.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold">@{label}</p>
              <p className={cn("text-[11px] uppercase tracking-wide", accentClass)}>Referenced {type}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-[var(--foreground-muted)] line-clamp-3">
            {description || "Click to open contextual details in a new dashboard tab."}
          </p>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-3 w-3 rotate-45 border-r border-b border-[var(--border-ui)] bg-[var(--background-app)]" />
        </div>
      )}
    </NodeViewWrapper>
  );
};
