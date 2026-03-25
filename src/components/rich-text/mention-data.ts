export type MentionEntityType = "character" | "location" | "item" | "lore";

export type MentionFolderCategory = "active" | "shared" | "archived" | "other";

export interface MentionEntity {
  id: string;
  label: string;
  type: MentionEntityType;
  description?: string | null;
  imageUrl?: string | null;
  folderId?: string;
  folderName?: string;
  folderCategory?: MentionFolderCategory;
  folderDescription?: string | null;
  folderIcon?: string | null;
  projectId?: string;
}

export interface MentionSuggestionConfig {
  maxResults?: number;
  recentLimit?: number;
  typeOrder?: MentionEntityType[];
  folderOrder?: MentionFolderCategory[];
  includeRecents?: boolean;
}

export interface MentionTypeMetadata {
  label: string;
  accentClass: string;
  badgeClass: string;
  icon: string;
  chipClass: string;
  avatarRingClass: string;
}

export const DEFAULT_MENTION_TYPE_ORDER: MentionEntityType[] = [
  "character",
  "location",
  "item",
  "lore",
];

export const DEFAULT_FOLDER_GROUP_ORDER: MentionFolderCategory[] = [
  "active",
  "shared",
  "archived",
  "other",
];

export interface MentionFolderGroupMeta {
  label: string;
  accentClass: string;
  badgeClass: string;
  chipClass: string;
  icon: string;
}

export const MENTION_FOLDER_GROUPS: Record<MentionFolderCategory, MentionFolderGroupMeta> = {
  active: {
    label: "Current project",
    accentClass: "text-[var(--accent-primary)]",
    badgeClass: "bg-[color-mix(in_srgb,var(--accent-primary)_12%,transparent)] text-[var(--accent-primary)] border border-[color-mix(in_srgb,var(--accent-primary)_35%,transparent)]",
    chipClass: "border-[var(--accent-primary)]/30 text-[var(--accent-primary)]",
    icon: "📂",
  },
  shared: {
    label: "Other shared projects",
    accentClass: "text-sky-500 dark:text-sky-300",
    badgeClass: "bg-sky-500/10 text-sky-500 border border-sky-500/30 dark:text-sky-200",
    chipClass: "border-sky-500/40 text-sky-500 dark:text-sky-200",
    icon: "🗂️",
  },
  archived: {
    label: "Archived collections",
    accentClass: "text-amber-500 dark:text-amber-300",
    badgeClass: "bg-amber-500/10 text-amber-600 border border-amber-500/30 dark:text-amber-200",
    chipClass: "border-amber-500/40 text-amber-600 dark:text-amber-200",
    icon: "🗄️",
  },
  other: {
    label: "Ungrouped",
    accentClass: "text-[var(--text-tertiary)]",
    badgeClass: "bg-[var(--surface-state-hover)] text-[var(--text-tertiary)] border border-[var(--border-ui)]",
    chipClass: "border-[var(--border-ui)] text-[var(--text-tertiary)]",
    icon: "📁",
  },
};

export const MENTION_TYPE_METADATA: Record<MentionEntityType, MentionTypeMetadata> = {
  character: {
    label: "Characters",
    accentClass: "text-rose-500 dark:text-rose-300",
    badgeClass: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
    icon: "👤",
    chipClass: "border-rose-200/60 bg-rose-500/5 text-rose-600 dark:text-rose-200",
    avatarRingClass: "ring-rose-200/80",
  },
  location: {
    label: "Locations",
    accentClass: "text-sky-500 dark:text-sky-300",
    badgeClass: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200",
    icon: "📍",
    chipClass: "border-sky-200/60 bg-sky-500/5 text-sky-600 dark:text-sky-200",
    avatarRingClass: "ring-sky-200/80",
  },
  item: {
    label: "Artifacts",
    accentClass: "text-amber-500 dark:text-amber-300",
    badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
    icon: "🗝️",
    chipClass: "border-amber-200/60 bg-amber-500/5 text-amber-600 dark:text-amber-200",
    avatarRingClass: "ring-amber-200/80",
  },
  lore: {
    label: "Lore",
    accentClass: "text-emerald-500 dark:text-emerald-300",
    badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
    icon: "📜",
    chipClass: "border-emerald-200/60 bg-emerald-500/5 text-emerald-600 dark:text-emerald-200",
    avatarRingClass: "ring-emerald-200/80",
  },
};
