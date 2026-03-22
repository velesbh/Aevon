"use client";

import type { MentionNodeAttrs } from "@tiptap/extension-mention";
import type { SuggestionKeyDownProps, SuggestionOptions, SuggestionProps } from "@tiptap/suggestion";
import tippy, { type Instance as TippyInstance } from "tippy.js";

export type MentionEntityType = "character" | "location" | "item" | "lore";

export interface MentionEntity {
  id: string;
  label: string;
  type: MentionEntityType;
  description?: string | null;
  imageUrl?: string | null;
}

export interface MentionSuggestionConfig {
  maxResults?: number;
  recentLimit?: number;
  typeOrder?: MentionEntityType[];
}

type MentionItemMeta = {
  isRecent: boolean;
  score: number;
};

type DropdownSection = {
  key: string;
  title: string;
  accentClass: string;
  items: MentionEntity[];
};

const TYPE_METADATA: Record<MentionEntityType, { label: string; accentClass: string; badgeClass: string; icon: string }> = {
  character: {
    label: "Characters",
    accentClass: "text-rose-500 dark:text-rose-300",
    badgeClass: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
    icon: "👤",
  },
  location: {
    label: "Locations",
    accentClass: "text-sky-500 dark:text-sky-300",
    badgeClass: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200",
    icon: "📍",
  },
  item: {
    label: "Artifacts",
    accentClass: "text-amber-500 dark:text-amber-300",
    badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
    icon: "🗝️",
  },
  lore: {
    label: "Lore",
    accentClass: "text-emerald-500 dark:text-emerald-300",
    badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
    icon: "📜",
  },
};

const RECENT_STORAGE_KEY = "aevon/mention-recents";
const ACTIVE_CLASSES = [
  "bg-[var(--accent-primary-transparent)]",
  "border",
  "border-[var(--accent-primary)]/60",
  "shadow-sm",
];

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
  const typeRanking = new Map(config.typeOrder.map((type, index) => [type, config.typeOrder.length - index]));
  const unique = new Map<string, MentionEntity>();
  items.forEach((entity) => {
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

function buildSections(
  items: MentionEntity[],
  query: string,
  config: Required<MentionSuggestionConfig>,
): DropdownSection[] {
  const normalizedQuery = query.trim().toLowerCase();
  const sections: DropdownSection[] = [];
  const used = new Set<string>();
  const typeBuckets = new Map<MentionEntityType, MentionEntity[]>();

  for (const item of items) {
    const bucket = typeBuckets.get(item.type) ?? [];
    bucket.push(item);
    typeBuckets.set(item.type, bucket);
  }

  const recents = items.filter((item) => mentionMeta.get(item.id)?.isRecent);
  if (!normalizedQuery && recents.length) {
    sections.push({
      key: "recent",
      title: "Recently referenced",
      accentClass: "text-[var(--foreground-muted)]",
      items: recents,
    });
    recents.forEach((item) => used.add(item.id));
  }

  config.typeOrder.forEach((type) => {
    const bucket = (typeBuckets.get(type) ?? []).filter((item) => !used.has(item.id));
    if (!bucket.length) {
      return;
    }
    sections.push({
      key: type,
      title: TYPE_METADATA[type].label,
      accentClass: TYPE_METADATA[type].accentClass,
      items: bucket,
    });
    bucket.forEach((item) => used.add(item.id));
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

function toggleActiveState(button: HTMLButtonElement, isActive: boolean) {
  if (isActive) {
    button.classList.add(...ACTIVE_CLASSES);
    button.setAttribute("aria-selected", "true");
  } else {
    button.classList.remove(...ACTIVE_CLASSES);
    button.setAttribute("aria-selected", "false");
  }
}

function buildDropdown({
  sections,
  query,
  selectedIndex,
  onSelect,
  onHover,
}: {
  sections: DropdownSection[];
  query: string;
  selectedIndex: number;
  onSelect: (item: MentionEntity, index: number) => void;
  onHover: (index: number) => void;
}) {
  const container = document.createElement("div");
  container.className = "mention-dropdown p-2 bg-[var(--background-app)] border border-[var(--border-ui)] rounded-xl shadow-2xl max-h-[320px] overflow-y-auto flex flex-col min-w-[320px]";
  const buttons: HTMLButtonElement[] = [];

  if (!sections.length) {
    const empty = document.createElement("div");
    empty.className = "px-4 py-6 text-center text-sm text-[var(--foreground-muted)]";
    empty.innerHTML = `No matches for <span class="font-semibold text-[var(--foreground-default)]">@${escapeHtml(query)}</span>`;
    container.appendChild(empty);
    return { container, buttons };
  }

  let globalIndex = 0;
  sections.forEach((section, sectionIndex) => {
    const header = document.createElement("div");
    header.className = "mt-2 first:mt-0 px-3 pb-1 text-[10px] tracking-[0.3em] uppercase font-semibold flex items-center gap-2 text-[var(--foreground-muted)]";
    header.innerHTML = `
      <span class="h-1 w-6 rounded-full bg-[var(--border-ui)]"></span>
      <span class="${section.accentClass}">${section.title}</span>
    `;
    container.appendChild(header);

    section.items.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.index = String(globalIndex);
      button.className = "mention-dropdown__item relative w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 transition-colors focus:outline-none border border-transparent";
      const typeMeta = TYPE_METADATA[item.type];
      const avatar = item.imageUrl
        ? `<img src="${item.imageUrl}" alt="" class="w-10 h-10 rounded-full object-cover border border-[var(--border-ui)]" />`
        : `<div class="w-10 h-10 rounded-full border border-[var(--border-ui)] bg-[var(--surface-sunken)] text-base flex items-center justify-center">${typeMeta.icon}</div>`;
      const highlightedLabel = highlightText(item.label, query);
      const highlightedDescription = item.description ? highlightText(item.description, query) : "";
      button.innerHTML = `
        ${avatar}
        <div class="flex flex-col min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="font-semibold text-sm text-[var(--foreground-default)] truncate">@${highlightedLabel}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded-full ${typeMeta.badgeClass}">${item.type}</span>
          </div>
          ${highlightedDescription ? `<p class="text-xs text-[var(--foreground-muted)] line-clamp-2 leading-snug">${highlightedDescription}</p>` : ""}
        </div>
        <span class="text-[10px] font-mono text-[var(--foreground-muted)]">${String(sectionIndex + 1)}.${globalIndex + 1}</span>
      `;
      button.addEventListener("mouseenter", () => onHover(globalIndex));
      button.addEventListener("click", () => onSelect(item, globalIndex));
      toggleActiveState(button, globalIndex === selectedIndex);
      buttons.push(button);
      container.appendChild(button);
      globalIndex += 1;
    });
  });

  return { container, buttons };
}

export function createMentionSuggestion(
  getItems: () => MentionEntity[],
  configOverrides?: MentionSuggestionConfig,
): Omit<SuggestionOptions, "editor"> {
  let popup: TippyInstance | null = null;
  let buttons: HTMLButtonElement[] = [];
  let activeIndex = 0;
  let cachedItems: MentionEntity[] = [];
  const config: Required<MentionSuggestionConfig> = {
    maxResults: 12,
    recentLimit: 10,
    typeOrder: ["character", "location", "item", "lore"],
    ...configOverrides,
  };

  const syncActiveState = (index: number) => {
    buttons.forEach((button, idx) => {
      toggleActiveState(button, idx === index);
      if (idx === index) {
        button.scrollIntoView({ block: "nearest" });
      }
    });
  };

  const updateDropdown = (props: any) => {
    cachedItems = props.items as MentionEntity[];
    const sections = buildSections(cachedItems, props.query, config);
    const { container, buttons: builtButtons } = buildDropdown({
      sections,
      query: props.query,
      selectedIndex: activeIndex,
      onSelect: (item, index) => {
        activeIndex = index;
        syncActiveState(activeIndex);
        props.command?.(item as MentionNodeAttrs);
      },
      onHover: (index) => {
        activeIndex = index;
        syncActiveState(activeIndex);
      },
    });
    buttons = builtButtons;
    return container;
  };

  return {
    char: "@",
    allowSpaces: true,
    items: ({ query }) => rankMentions(getItems(), query, config),
    command: ({ editor, range, props }) => {
      trackMentionUsage(props.id, config.recentLimit);
      editor
        .chain()
        .focus()
        .insertContentAt(range, [
          {
            type: "mention",
            attrs: { id: props.id, label: props.label, type: props.type, description: props.description },
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
          activeIndex = 0;
          const dropdown = updateDropdown(props);
          popup = tippy("body", {
            getReferenceClientRect: props.clientRect as () => DOMRect,
            content: dropdown,
            showOnCreate: true,
            interactive: true,
            trigger: "manual",
            placement: "bottom-start",
            arrow: false,
            theme: "light-border",
          })[0];
        },
        onUpdate(props) {
          if (!popup) {
            return;
          }
          cachedItems = props.items as MentionEntity[];
          activeIndex = Math.min(activeIndex, Math.max(cachedItems.length - 1, 0));
          popup.setProps({ getReferenceClientRect: props.clientRect as () => DOMRect });
          if (popup.popper.firstChild) {
            popup.popper.firstChild.remove();
          }
          popup.popper.appendChild(updateDropdown(props));
        },
        onKeyDown(props: any) {
          if (!buttons.length) {
            return false;
          }
          const event = props.event;
          if (event.key === "Escape") {
            popup?.hide();
            return true;
          }
          if (["ArrowDown", "Tab"].includes(event.key)) {
            event.preventDefault();
            activeIndex = (activeIndex + 1) % buttons.length;
            syncActiveState(activeIndex);
            return true;
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            activeIndex = (activeIndex - 1 + buttons.length) % buttons.length;
            syncActiveState(activeIndex);
            return true;
          }
          if (["Enter", "Return"].includes(event.key)) {
            event.preventDefault();
            const item = cachedItems[activeIndex];
            if (item) {
              props.command?.(item as MentionNodeAttrs);
            }
            return true;
          }
          return false;
        },
        onExit() {
          popup?.destroy();
          popup = null;
          buttons = [];
        },
      };
    },
  };
}
