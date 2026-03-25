"use client";

import { useMemo, useState } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { MENTION_FOLDER_GROUPS, type MentionFolderCategory } from "./mention-data";

const typeAccentMap: Record<string, string> = {
  character: "text-rose-500 dark:text-rose-300",
  location: "text-sky-500 dark:text-sky-300",
  item: "text-amber-500 dark:text-amber-300",
  lore: "text-emerald-500 dark:text-emerald-300",
};

export const MentionNodeView: React.FC<NodeViewProps> = ({ node }) => {
  const { label, type, id, description, folderCategory } = node.attrs;
  const [showHover, setShowHover] = useState(false);
  const accentClass = useMemo(() => typeAccentMap[type as string] ?? "text-[var(--accent-primary)]", [type]);
  const folderMeta = MENTION_FOLDER_GROUPS[(folderCategory as MentionFolderCategory) ?? "other"];

  const handleNavigate = () => {
    if (typeof window === "undefined") {
      return;
    }
    const resource = `${String(type)}s`;
    const url = `/dashboard/${resource}/${id}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <NodeViewWrapper as="span" className="inline-flex relative group">
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
          "mention inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-sm font-semibold cursor-pointer",
          folderMeta.chipClass ?? "border-[var(--border-ui)] text-[var(--foreground-default)] bg-[var(--surface-sunken)]",
          "shadow-sm transition-all hover:shadow-md hover:bg-[var(--surface-sunken)]/80",
        )}
      >
        <span className={cn("text-[11px] font-mono uppercase tracking-wide opacity-80", accentClass)}>@{type}</span>
        <span className="font-medium">{label}</span>
        {folderCategory && folderCategory !== "other" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-raised)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide shadow-sm border border-[var(--border-ui)]/50">
            <span>{folderMeta.icon}</span>
            <span className="opacity-80">{folderMeta.label}</span>
          </span>
        )}
      </span>

      {showHover && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-2xl border border-[var(--border-ui)] bg-[var(--surface-raised)]/95 backdrop-blur-xl p-3 text-sm shadow-[0_12px_32px_rgba(15,23,42,0.16)] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="flex items-center gap-3">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-full border shadow-inner text-base font-bold", folderMeta.badgeClass ?? "border-[var(--border-ui)] bg-[var(--surface-sunken)]")}>
              {label.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-[var(--text-primary)]">@{label}</p>
              <div className="flex items-center gap-1.5">
                <p className={cn("text-[10px] uppercase tracking-wider font-bold", accentClass)}>{type}</p>
                {folderCategory && folderCategory !== "other" && (
                  <>
                    <span className="text-[var(--text-tertiary)] text-[10px]">•</span>
                    <span className="text-[10px] font-medium text-[var(--text-secondary)]">{folderMeta.label}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <p className="mt-2.5 text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-3">
            {description || "Click to open contextual details in a new dashboard tab."}
          </p>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rotate-45 border-r border-b border-[var(--border-ui)] bg-[var(--surface-raised)]" />
        </div>
      )}
    </NodeViewWrapper>
  );
};
