"use client";

import type { MentionNodeAttrs } from "@tiptap/extension-mention";
import type { SuggestionOptions, SuggestionProps } from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n";
import {
  DEFAULT_FOLDER_GROUP_ORDER,
  DEFAULT_MENTION_TYPE_ORDER,
  MENTION_FOLDER_GROUPS,
  MENTION_TYPE_METADATA,
  type MentionEntity,
  type MentionEntityType,
  type MentionFolderCategory,
  type MentionSuggestionConfig,
} from "./mention-data";

type MentionItemMeta = {
  isRecent: boolean;
  score: number;
};

type DropdownSection = {
  key: string;
  title: string;
  accentClass: string;
  items: MentionEntity[];
  badgeClass?: string;
  chipClass?: string;
  icon?: string;
  description?: string | null;
  folderName?: string;
};

const RECENT_STORAGE_KEY = "aevon/mention-recents";
const mentionMeta = new Map<string, MentionItemMeta>();

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(value: string) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function highlightText(text: string, query: string) {
  const safeText = escapeHtml(text);
  if (!query) {
    return safeText;
  }
  const pattern = new RegExp(`(${escapeRegExp(query)})`, "ig");
  return safeText.replace(pattern, '<mark class="bg-transparent text-[var(--accent-primary)]">$1</mark>');
}

function readRecents(limit: number) {
  if (typeof window === "undefined") {
    return [] as string[];
  }
  const raw = window.localStorage.getItem(RECENT_STORAGE_KEY);
  if (!raw) {
    return [] as string[];
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.slice(0, limit).filter((entry) => typeof entry === "string");
    }
  } catch (error) {
    console.warn("Failed to parse mention recents", error);
  }
  return [] as string[];
}

function writeRecents(ids: string[]) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(ids));
}

function trackMentionUsage(id: string, limit: number) {
  const current = readRecents(limit);
  const next = [id, ...current.filter((entry) => entry !== id)].slice(0, limit);
  writeRecents(next);
}

function computeScore(entity: MentionEntity, query: string, recencyBoost: number, typePriority: number) {
  if (!query) {
    return 100 + recencyBoost + typePriority;
  }
  const needle = query.toLowerCase();
  const label = entity.label.toLowerCase();
  const description = (entity.description ?? "").toLowerCase();
  let score = recencyBoost + typePriority;
  if (label.startsWith(needle)) {
    score += 120;
  } else if (label.includes(needle)) {
    score += 80 - label.indexOf(needle);
  }
  if (description.includes(needle)) {
    score += 40 - description.indexOf(needle);
  }
  if (entity.type.includes(needle)) {
    score += 20;
  }
  // loose matching using individual characters
  let lastIndex = -1;
  for (const char of needle) {
    const nextIndex = label.indexOf(char, lastIndex + 1);
    if (nextIndex === -1) {
      score -= 2;
    } else {
      score += 3;
      lastIndex = nextIndex;
    }
  }
  return score;
}

function rankMentions(
  items: MentionEntity[],
  query: string,
  config: Required<MentionSuggestionConfig>,
) {
  mentionMeta.clear();
  const normalizedQuery = query.trim().toLowerCase();
  const recents = readRecents(config.recentLimit);
  const recentsSet = new Set(recents);
  const typeRanking = new Map((config.typeOrder ?? []).map((type, index) => [type, (config.typeOrder ?? []).length - index]));
  const unique = new Map<string, MentionEntity>();
  (items ?? []).forEach((entity) => {
    unique.set(entity.id, entity);
  });

  const scored = Array.from(unique.values())
    .map((entity) => {
      const recencyBoost = recentsSet.has(entity.id)
        ? 50 + (recents.length - recents.indexOf(entity.id)) * 5
        : 0;
      const typePriority = typeRanking.get(entity.type) ?? 1;
      const score = computeScore(entity, normalizedQuery, recencyBoost, typePriority);
      mentionMeta.set(entity.id, { isRecent: recentsSet.has(entity.id) && !normalizedQuery, score });
      return { entity, score };
    })
    .filter(({ score }) => normalizedQuery ? score > 0 : true)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.entity.label.localeCompare(b.entity.label);
    })
    .slice(0, config.maxResults)
    .map(({ entity }) => entity);

  return scored;
}

interface FolderBucket {
  key: string;
  category: MentionFolderCategory;
  section: DropdownSection;
  items: MentionEntity[];
}

function normalizeFolderCategory(value?: MentionFolderCategory | null): MentionFolderCategory {
  return value && value in MENTION_FOLDER_GROUPS ? value : "other";
}

function buildSections(
  items: MentionEntity[],
  query: string,
  config: Required<MentionSuggestionConfig>,
): DropdownSection[] {
  const normalizedQuery = query.trim().toLowerCase();
  const sections: DropdownSection[] = [];
  const used = new Set<string>();
  const folderBuckets = new Map<string, FolderBucket>();

  const ensureFolderBucket = (entity: MentionEntity): FolderBucket => {
    const category = normalizeFolderCategory(entity.folderCategory);
    const folderKey = entity.folderId ?? `${category}-${entity.folderName ?? "unknown"}`;
    const existing = folderBuckets.get(folderKey);
    if (existing) {
      return existing;
    }
    const groupMeta = MENTION_FOLDER_GROUPS[category];
    const section: DropdownSection = {
      key: folderKey,
      title: entity.folderName ?? groupMeta.label,
      accentClass: groupMeta.accentClass,
      badgeClass: groupMeta.badgeClass,
      chipClass: groupMeta.chipClass,
      icon: entity.folderIcon ?? groupMeta.icon,
      description: entity.folderDescription,
      folderName: entity.folderName,
      items: [],
    };
    const bucket: FolderBucket = {
      key: folderKey,
      category,
      section,
      items: section.items,
    };
    folderBuckets.set(folderKey, bucket);
    return bucket;
  };

  for (const item of items) {
    ensureFolderBucket(item).items.push(item);
  }

  const recents = config.includeRecents ? items.filter((item) => mentionMeta.get(item.id)?.isRecent) : [];
  if (!normalizedQuery && recents.length) {
    sections.push({
      key: "recent",
      title: "Recently referenced",
      accentClass: "text-[var(--foreground-muted)]",
      items: recents,
    });
    recents.forEach((item) => used.add(item.id));
  }

  const folderOrder = config.folderOrder ?? DEFAULT_FOLDER_GROUP_ORDER;
  const sortedBuckets = Array.from(folderBuckets.values()).sort((left, right) => {
    const leftWeight = (folderOrder ?? []).indexOf(left.category);
    const rightWeight = (folderOrder ?? []).indexOf(right.category);
    if (leftWeight !== rightWeight) {
      return (leftWeight === -1 ? (folderOrder ?? []).length : leftWeight) -
        (rightWeight === -1 ? (folderOrder ?? []).length : rightWeight);
    }
    return (left.section.folderName ?? left.section.title).localeCompare(right.section.folderName ?? right.section.title);
  });

  sortedBuckets.forEach((bucket) => {
    const itemsForSection = bucket.items.filter((item) => !used.has(item.id));
    if (!itemsForSection.length) {
      return;
    }
    sections.push({
      ...bucket.section,
      items: itemsForSection,
    });
    itemsForSection.forEach((item) => used.add(item.id));
  });

  const remaining = items.filter((item) => !used.has(item.id));
  if (remaining.length) {
    sections.push({
      key: "more",
      title: normalizedQuery ? "Additional matches" : "Other entries",
      accentClass: "text-[var(--foreground-muted)]",
      items: remaining,
    });
  }

  return sections;
}

export function createMentionSuggestion(
  getItems: () => MentionEntity[],
  configOverrides?: MentionSuggestionConfig,
): Omit<SuggestionOptions, "editor"> {
  let groupedItems: MentionEntity[] = [];
  let activeIndex = 0;
  let cachedItems: MentionEntity[] = [];
  let renderer: ReactRenderer<MentionDropdownProps> | null = null;
  let mountElement: HTMLElement | null = null;
  let latestProps: SuggestionProps<MentionEntity, MentionNodeAttrs> | null = null;
  const config: Required<MentionSuggestionConfig> = {
    maxResults: 12,
    recentLimit: 10,
    typeOrder: DEFAULT_MENTION_TYPE_ORDER,
    folderOrder: DEFAULT_FOLDER_GROUP_ORDER,
    includeRecents: true,
    ...configOverrides,
  };

  const buildDropdownProps = (): MentionDropdownProps | null => {
    if (!latestProps) {
      return null;
    }
    return {
      clientRect: latestProps.clientRect as (() => DOMRect | null) | undefined,
      query: latestProps.query,
      sections: buildSections(groupedItems.length ? groupedItems : cachedItems, latestProps.query, config),
      activeIndex,
      totalResults: cachedItems.length,
      onHighlight: (index) => {
        activeIndex = index;
        updateRenderer();
      },
      onSelect: (item, index) => {
        activeIndex = index;
        latestProps?.command?.(item as MentionNodeAttrs);
      },
    };
  };

  const updateRenderer = () => {
    if (!renderer) {
      return;
    }
    const nextProps = buildDropdownProps();
    if (nextProps) {
      renderer.updateProps(nextProps);
    }
  };

  const destroyRenderer = () => {
    renderer?.destroy();
    renderer = null;
    if (mountElement?.parentNode) {
      mountElement.parentNode.removeChild(mountElement);
    }
    mountElement = null;
    latestProps = null;
  };

  return {
    char: "@",
    allowSpaces: true,
     items: ({ query }) => {
       groupedItems = getItems();
       const ranked = rankMentions(groupedItems, query, config);
       cachedItems = ranked;
       return ranked;
     },
    command: ({ editor, range, props }) => {
      trackMentionUsage(props.id, config.recentLimit);
      editor
        .chain()
        .focus()
        .insertContentAt(range, [
          {
            type: "mention",
            attrs: { id: props.id, label: props.label, type: props.type, description: props.description, folderCategory: props.folderCategory },
          },
          {
            type: "text",
            text: " ",
          },
        ])
        .run();
    },
    render() {
      return {
        onStart: (props) => {
          latestProps = props;
          cachedItems = props.items as MentionEntity[];
          activeIndex = 0;
          renderer = new ReactRenderer(MentionDropdown, {
            editor: props.editor,
            props: buildDropdownProps() ?? undefined,
          });
          mountElement = renderer.element;
          document.body.appendChild(mountElement);
        },
        onUpdate: (props) => {
          latestProps = props;
          cachedItems = props.items as MentionEntity[];
          activeIndex = Math.min(activeIndex, Math.max((cachedItems?.length ?? 0) - 1, 0));
          updateRenderer();
        },
        onKeyDown: (props) => {
          if (!(cachedItems?.length ?? 0)) {
            return false;
          }
          const event = props.event;
          if (event.key === "Escape") {
            destroyRenderer();
            return true;
          }
          if (["ArrowDown", "Tab"].includes(event.key)) {
            event.preventDefault();
            activeIndex = (activeIndex + 1) % (cachedItems?.length ?? 1);
            updateRenderer();
            return true;
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            activeIndex = (activeIndex - 1 + (cachedItems?.length ?? 1)) % (cachedItems?.length ?? 1);
            updateRenderer();
            return true;
          }
          if (["Enter", "Return"].includes(event.key)) {
            event.preventDefault();
            const item = cachedItems[activeIndex];
            if (item) {
              latestProps?.command?.(item as MentionNodeAttrs);
            }
            return true;
          }
          return false;
        },
        onExit: () => {
          destroyRenderer();
        },
      };
    },
  };
}

interface MentionDropdownProps {
  clientRect?: () => DOMRect | null;
  query: string;
  sections: DropdownSection[];
  activeIndex: number;
  totalResults: number;
  onHighlight: (index: number) => void;
  onSelect: (item: MentionEntity, index: number) => void;
}

function MentionDropdown({ clientRect, query, sections, activeIndex, totalResults, onHighlight, onSelect }: MentionDropdownProps) {
  const { t } = useLanguage();
  const [referenceRect, setReferenceRect] = useState<DOMRect | null>(clientRect ? clientRect() : null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateRect = () => {
      if (clientRect) {
        const rect = clientRect();
        if (rect) {
          setReferenceRect(rect);
        }
      }
    };
    updateRect();
    window.addEventListener("scroll", updateRect, true);
    window.addEventListener("resize", updateRect);
    return () => {
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
    };
  }, [clientRect]);

  useEffect(() => {
    const target = listRef.current?.querySelector<HTMLButtonElement>(`[data-index="${activeIndex}"]`);
    target?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, sections]);

  const hasResults = sections.length > 0;
  const style: React.CSSProperties = referenceRect
    ? {
        position: "absolute",
        top: referenceRect.bottom + window.scrollY + 8,
        left: referenceRect.left + window.scrollX,
        width: Math.max(referenceRect.width, 320),
      }
    : { position: "absolute", opacity: 0 };

  let runningIndex = 0;

  const content = hasResults ? (
    <div ref={listRef} className="max-h-[360px] overflow-y-auto custom-scrollbar px-1">
      {sections.map((section) => (
        <motion.div
          key={section.key}
          layout
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ type: "spring", stiffness: 340, damping: 30 }}
          className="pb-3"
        >
          <div className="sticky top-0 z-10 flex items-center gap-3 rounded-2xl bg-[var(--surface-raised)]/90 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--text-tertiary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_24px_rgba(15,23,42,0.12)] backdrop-blur">
            {section.icon ? (
              <span className="text-base" aria-hidden>
                {section.icon}
              </span>
            ) : null}
            <span className={section.accentClass}>{section.title}</span>
            {section.badgeClass ? (
              <span className={`ml-auto rounded-full border px-2 py-0.5 text-[9px] tracking-[0.18em] ${section.badgeClass}`}>
                {section.folderName ?? section.title}
              </span>
            ) : (
              <div className="h-px flex-1 bg-[var(--border-ui)]/60" />
            )}
          </div>
          {section.description ? (
            <p className="px-3 pb-1 text-[11px] text-[var(--text-secondary)]/80">
              {section.description}
            </p>
          ) : null}
          <div className="flex flex-col gap-1 pt-1">
            {section.items.map((item) => {
              const itemIndex = runningIndex;
              runningIndex += 1;
              const isActive = itemIndex === activeIndex;
              const highlightedLabel = highlightText(item.label, query);
              const highlightedDescription = item.description ? highlightText(item.description, query) : "";
              const typeMeta = MENTION_TYPE_METADATA[item.type];
              return (
                <button
                  key={item.id}
                  type="button"
                  data-index={itemIndex}
                  onMouseEnter={() => onHighlight(itemIndex)}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    onSelect(item, itemIndex);
                  }}
                  className={`group relative flex w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left transition-colors focus-visible:outline-none ${
                    isActive
                      ? "border-[var(--border-ui)] bg-[var(--surface-state-active)] shadow-sm"
                      : "border-transparent hover:bg-[var(--surface-state-hover)]"
                  }`}
                  aria-selected={isActive}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-ui)] bg-[var(--background-app)] text-[var(--text-secondary)] shadow-inner">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="h-full w-full rounded-2xl object-cover" />
                    ) : (
                      <span>{section.icon ?? typeMeta.icon}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-semibold text-[var(--text-primary)] truncate"
                        dangerouslySetInnerHTML={{ __html: highlightedLabel }}
                      />
                      <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${typeMeta.badgeClass}`}>
                        {typeMeta.label}
                      </span>
                      {section.chipClass ? (
                        <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${section.chipClass}`}>
                          {section.folderName ?? section.title}
                        </span>
                      ) : null}
                    </div>
                    {highlightedDescription ? (
                      <p className="text-xs text-[var(--text-secondary)]" dangerouslySetInnerHTML={{ __html: highlightedDescription }} />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  ) : (
    <div className="px-4 py-8 text-center text-sm text-[var(--text-secondary)]">
      {query ? t("mention.dropdown.noResults") || `No matches for @${query}` : t("mention.dropdown.start") || "Start typing to discover entries"}
    </div>
  );

  return (
    <AnimatePresence>
      {referenceRect ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.94 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={style}
          className="z-[9999] min-w-[320px] max-w-[480px] rounded-3xl border border-[var(--border-ui)] bg-[var(--surface-raised)]/95 backdrop-blur-2xl shadow-[0_25px_80px_rgba(15,23,42,0.18)]"
        >
          <div className="flex items-center gap-3 border-b border-[var(--border-ui)]/60 px-4 pt-3 pb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--surface-state-hover)] text-base font-semibold text-[var(--text-primary)]">
              @
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[var(--text-tertiary)]">{t("mention.dropdown.title") || "Mentions"}</p>
              <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{query || t("mention.dropdown.search") || "Search entries"}</p>
            </div>
          </div>
          {content}
          <div className="flex items-center justify-between border-t border-[var(--border-ui)]/60 px-4 py-2 text-[11px] text-[var(--text-tertiary)]">
            <span>{t("mention.dropdown.results") || `${totalResults} results`}</span>
            <span className="flex items-center gap-2">
              <kbd className="rounded-md border border-[var(--border-ui)] px-1.5 py-0.5 text-[10px]">↑↓</kbd>
              {t("mention.dropdown.navigate") || "Navigate"}
            </span>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
