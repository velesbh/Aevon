import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Download,
  FolderKanban,
  FolderOpen,
  LayoutDashboard,
  Lightbulb,
  MapPin,
  MapPinned,
  Network,
  Package,
  ScrollText,
  Settings,
  Users,
} from "lucide-react";

export type ModuleId =
  | "dashboard"
  | "manuscript"
  | "characters"
  | "locations"
  | "lore"
  | "items"
  | "ideas"
  | "maps"
  | "projects"
  | "files"
  | "relationships"
  | "settings"
  | "export";

export type ModuleCountKey =
  | "totalEntries"
  | "chapters"
  | "characters"
  | "locations"
  | "lore"
  | "items"
  | "ideas"
  | "maps"
  | "files"
  | "projects";

export type ModuleCreateType =
  | "chapter"
  | "character"
  | "location"
  | "lore"
  | "item"
  | "idea"
  | "map";

export interface ModuleDefinition {
  id: ModuleId;
  labelKey: string;
  href: string;
  icon: LucideIcon;
  countKey?: ModuleCountKey;
  createType?: ModuleCreateType;
  nested?: boolean;
  segment: string;
  descriptionKey?: string;
}

export const moduleSections: { labelKey: string; ids: ModuleId[] }[] = [
  { labelKey: "sidebar.section.workspace", ids: ["dashboard", "manuscript", "characters"] },
  { labelKey: "sidebar.section.world", ids: ["locations", "lore", "items", "ideas", "maps", "relationships"] },
  { labelKey: "sidebar.section.system", ids: ["projects", "files", "settings", "export"] },
];

export const moduleDefinitions: ModuleDefinition[] = [
  {
    id: "dashboard",
    labelKey: "dashboard.nav.dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    countKey: "totalEntries",
    segment: "",
  },
  {
    id: "manuscript",
    labelKey: "dashboard.nav.manuscript",
    href: "/dashboard/manuscript",
    icon: BookOpen,
    countKey: "chapters",
    createType: "chapter",
    nested: true,
    segment: "manuscript",
  },
  {
    id: "characters",
    labelKey: "dashboard.nav.characters",
    href: "/dashboard/characters",
    icon: Users,
    countKey: "characters",
    createType: "character",
    nested: true,
    segment: "characters",
  },
  {
    id: "locations",
    labelKey: "dashboard.nav.locations",
    href: "/dashboard/locations",
    icon: MapPin,
    countKey: "locations",
    createType: "location",
    nested: true,
    segment: "locations",
  },
  {
    id: "lore",
    labelKey: "dashboard.nav.lore",
    href: "/dashboard/lore",
    icon: ScrollText,
    countKey: "lore",
    createType: "lore",
    nested: true,
    segment: "lore",
  },
  {
    id: "items",
    labelKey: "dashboard.nav.items",
    href: "/dashboard/items",
    icon: Package,
    countKey: "items",
    createType: "item",
    nested: true,
    segment: "items",
  },
  {
    id: "ideas",
    labelKey: "dashboard.nav.ideas",
    href: "/dashboard/ideas",
    icon: Lightbulb,
    countKey: "ideas",
    createType: "idea",
    nested: true,
    segment: "ideas",
  },
  {
    id: "maps",
    labelKey: "dashboard.nav.maps",
    href: "/dashboard/maps",
    icon: MapPinned,
    countKey: "maps",
    createType: "map",
    nested: true,
    segment: "maps",
  },
  {
    id: "relationships",
    labelKey: "dashboard.nav.relationships",
    href: "/dashboard/relationships",
    icon: Network,
    segment: "relationships",
  },
  {
    id: "projects",
    labelKey: "dashboard.nav.projects",
    href: "/dashboard/projects",
    icon: FolderKanban,
    countKey: "projects",
    segment: "projects",
  },
  {
    id: "files",
    labelKey: "dashboard.nav.files",
    href: "/dashboard/files",
    icon: FolderOpen,
    countKey: "files",
    segment: "files",
  },
  {
    id: "settings",
    labelKey: "dashboard.settings",
    href: "/dashboard/settings",
    icon: Settings,
    segment: "settings",
  },
  {
    id: "export",
    labelKey: "dashboard.nav.export",
    href: "/dashboard/export",
    icon: Download,
    segment: "export",
  },
];

export const moduleDefinitionById = moduleDefinitions.reduce<Record<ModuleId, ModuleDefinition>>(
  (acc, definition) => {
    acc[definition.id] = definition;
    return acc;
  },
  {} as Record<ModuleId, ModuleDefinition>,
);

export function getModuleDefinitionById(id: ModuleId): ModuleDefinition | undefined {
  return moduleDefinitionById[id];
}

export function getModuleBySegment(segment: string | undefined): ModuleDefinition | undefined {
  const normalized = segment ?? "";
  return moduleDefinitions.find((definition) => definition.segment === normalized);
}

export const worldElementModuleIds: ModuleId[] = [
  "characters",
  "locations",
  "lore",
  "items",
  "ideas",
  "maps",
];
