import type { User } from "@supabase/supabase-js";
import { hasSupabaseEnv, supabase, supabaseAnonKey, supabaseUrl } from "@/lib/supabase";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | { [key: string]: JsonValue } | JsonValue[];
type JsonObject = { [key: string]: JsonValue };

const STORAGE_BUCKET = "user-uploads";
const CHARACTER_IMAGE_SIGNED_URL_TTL_SECONDS = 60 * 60;
const DEFAULT_STORAGE_LIMIT_BYTES = 34_359_738_368;

export interface ProfileRecord {
  id: string;
  name: string | null;
  language: string | null;
  experience_level: string | null;
  genre: string | null;
  project_name: string | null;
  avatar_url: string | null;
  storage_used: number | null;
  storage_limit: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectRecord {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  genre: string | null;
  scratchpad: string | null;
  settings: JsonValue | null;
  created_at: string;
  updated_at: string;
}

export interface ChapterRecord {
  id: string;
  project_id: string;
  title: string;
  content: JsonValue;
  word_count: number;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export type WorldElementType = "character" | "location" | "lore" | "item" | "lore_diagram" | "idea" | "map";

export interface WorldElementRecord {
  id: string;
  project_id: string;
  type: WorldElementType;
  name: string;
  description: string | null;
  attributes: JsonValue;
  created_at: string;
  updated_at: string;
}

export interface FileRecord {
  id: string;
  user_id: string;
  project_id: string | null;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string | null;
  created_at: string;
}

export interface CharacterAttributes {
  role: string;
  summary: string;
  appearance: string;
  personality: string;
  motivation: string;
  conflict: string;
  arc: string;
  notes: string;
  status: string;
  nationality: string;
  age: string;
  occupation: string;
  image_path?: string;
  image_updated_at?: string;
  [key: string]: JsonValue | undefined;
}

export type ExportFormat = "pdf" | "epub" | "docx" | "md";

export interface ManuscriptExportOptions {
  standardManuscriptFormat: boolean;
  includeTableOfContents: boolean;
  includeTitlePage: boolean;
  includeCharacters?: boolean;
  includeLocations?: boolean;
  includeLore?: boolean;
  includeItems?: boolean;
  includeIdeas?: boolean;
  includeManuscript?: boolean | string[];
}

export interface RequestedExport {
  blob: Blob;
  contentType: string;
  fileName: string;
}

export interface WorkspaceSnapshot {
  user: User;
  profile: ProfileRecord | null;
  projects: ProjectRecord[];
  activeProject: ProjectRecord | null;
  chapters: ChapterRecord[];
  worldElements: WorldElementRecord[];
  files: FileRecord[];
}

interface BootstrapMetadata {
  name: string | null;
  language: string | null;
  experienceLevel: string | null;
  genre: string | null;
  projectName: string | null;
}

interface UploadManagedFileOptions {
  displayName?: string;
  file: File;
  folderSegments: string[];
  projectId: string | null;
}

function requireSupabase() {
  if (!supabase || !hasSupabaseEnv) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return supabase;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function readAttributeString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function getBootstrapMetadata(user: User): BootstrapMetadata {
  const metadata = user.user_metadata ?? {};

  return {
    name: readString(metadata.name),
    language: readString(metadata.language) ?? "en",
    experienceLevel: readString(metadata.experience_level),
    genre: readString(metadata.genre),
    projectName: readString(metadata.project_name),
  };
}

function getDefaultWorldName(type: WorldElementType, total: number) {
  const label =
    type === "character"
      ? "Character"
      : type === "location"
        ? "Location"
        : type === "lore"
          ? "Lore Entry"
          : type === "lore_diagram"
            ? "Diagram"
            : type === "idea"
              ? "Idea"
              : "Item";

  return `New ${label} ${total + 1}`;
}

function sortFiles(files: FileRecord[]) {
  return [...files].sort(
    (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
  );
}

function computeWordCount(content: string) {
  return content.trim().split(/\s+/).filter(Boolean).length;
}

function sanitizeFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getStorageUsageSnapshot(profile: Pick<ProfileRecord, "storage_limit" | "storage_used"> | null) {
  return {
    storageLimit: profile?.storage_limit ?? DEFAULT_STORAGE_LIMIT_BYTES,
    storageUsed: profile?.storage_used ?? 0,
  };
}

function getExportFileNameFromDisposition(disposition: string | null, fallback: string) {
  if (!disposition) {
    return fallback;
  }

  const encodedMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (encodedMatch?.[1]) {
    return decodeURIComponent(encodedMatch[1]);
  }

  const fileNameMatch = disposition.match(/filename="?([^"]+)"?/i);
  return fileNameMatch?.[1] ?? fallback;
}

async function getProfileStorageRecord(userId: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("profiles")
    .select("storage_used, storage_limit")
    .eq("id", userId)
    .maybeSingle<Pick<ProfileRecord, "storage_limit" | "storage_used">>();

  if (error) {
    throw error;
  }

  return data;
}

async function removeStorageObject(filePath: string) {
  if (!filePath) {
    return;
  }

  const client = requireSupabase();
  const { error } = await client.storage.from(STORAGE_BUCKET).remove([filePath]);

  if (error) {
    throw error;
  }
}

async function uploadManagedFile({
  displayName,
  file,
  folderSegments,
  projectId,
}: UploadManagedFileOptions) {
  const client = requireSupabase();
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("You need to be signed in to upload files.");
  }

  const profileStorage = await getProfileStorageRecord(user.id);
  const { storageLimit, storageUsed } = getStorageUsageSnapshot(profileStorage);

  if (storageUsed + file.size > storageLimit) {
    throw new Error("This upload would exceed your available Supabase storage quota.");
  }

  const safeName = sanitizeFileName(file.name || displayName || "upload");
  const storagePath = `${user.id}/${folderSegments.join("/")}/${Date.now()}-${safeName}`;
  const { error: uploadError } = await client.storage.from(STORAGE_BUCKET).upload(storagePath, file, {
    cacheControl: "3600",
    contentType: file.type || undefined,
    upsert: false,
  });

  if (uploadError) {
    throw uploadError;
  }

  try {
    const { data, error } = await client
      .from("files")
      .insert({
        user_id: user.id,
        project_id: projectId,
        file_name: displayName ?? file.name ?? safeName,
        file_path: storagePath,
        file_size: file.size,
        mime_type: file.type || null,
      })
      .select("*")
      .single<FileRecord>();

    if (error) {
      throw error;
    }

    return data;
  } catch (metadataError) {
    await removeStorageObject(storagePath).catch(() => undefined);
    throw metadataError;
  }
}

export function getAttributesObject(attributes: WorldElementRecord["attributes"]): JsonObject {
  return attributes && typeof attributes === "object" && !Array.isArray(attributes)
    ? (attributes as JsonObject)
    : {};
}

export function getAttributeText(attributes: WorldElementRecord["attributes"], key: string) {
  return readAttributeString(getAttributesObject(attributes)[key]);
}

export function getDefaultCharacterAttributes(): CharacterAttributes {
  return {
    role: "Supporting",
    summary: "",
    appearance: "",
    personality: "",
    motivation: "",
    conflict: "",
    arc: "",
    notes: "",
    status: "Active",
    nationality: "",
    age: "",
    occupation: "",
    image_path: "",
    image_updated_at: "",
  };
}

export function getCharacterAttributes(attributes: WorldElementRecord["attributes"]): CharacterAttributes {
  const attributeObject = getAttributesObject(attributes);
  const defaults = getDefaultCharacterAttributes();

  return {
    ...attributeObject,
    role: readAttributeString(attributeObject.role, defaults.role),
    summary: readAttributeString(attributeObject.summary, defaults.summary),
    appearance: readAttributeString(attributeObject.appearance, defaults.appearance),
    personality: readAttributeString(attributeObject.personality, defaults.personality),
    motivation: readAttributeString(attributeObject.motivation, defaults.motivation),
    conflict: readAttributeString(attributeObject.conflict, defaults.conflict),
    arc: readAttributeString(attributeObject.arc, defaults.arc),
    notes: readAttributeString(attributeObject.notes, defaults.notes),
    status: readAttributeString(attributeObject.status, defaults.status),
    nationality: readAttributeString(attributeObject.nationality, defaults.nationality),
    age: readAttributeString(attributeObject.age, defaults.age),
    occupation: readAttributeString(attributeObject.occupation, defaults.occupation),
    image_path: readAttributeString(attributeObject.image_path, defaults.image_path),
    image_updated_at: readAttributeString(attributeObject.image_updated_at, defaults.image_updated_at),
  };
}

export function getCharacterImagePath(attributes: WorldElementRecord["attributes"]) {
  return getCharacterAttributes(attributes).image_path ?? "";
}

export function buildCharacterAttributes(
  currentAttributes: WorldElementRecord["attributes"],
  updates: Partial<CharacterAttributes>,
) {
  const nextAttributes: JsonObject = {
    ...getAttributesObject(currentAttributes),
  };

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      nextAttributes[key] = value;
    }
  }

  return nextAttributes;
}

export function getChapterSynopsis(content: JsonValue | null | undefined) {
  if (content && typeof content === "object" && !Array.isArray(content)) {
    const maybeSynopsis = (content as { synopsis?: unknown }).synopsis;
    return typeof maybeSynopsis === "string" ? maybeSynopsis : "";
  }
  return "";
}

export function getChapterText(content: JsonValue | null | undefined) {
  if (typeof content === "string") {
    return content;
  }

  if (content && typeof content === "object" && !Array.isArray(content)) {
    const maybeText = (content as { text?: unknown }).text;
    return typeof maybeText === "string" ? maybeText : "";
  }

  return "";
}

export async function getCurrentUser() {
  const client = requireSupabase();
  
  // First try to get the user from the local session (offline-friendly)
  const { data: { session } } = await client.auth.getSession();
  if (session?.user) {
    return session.user;
  }

  // Fallback to fetching the user from the server
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error) {
    throw error;
  }

  return user;
}

export async function getCurrentSession() {
  const client = requireSupabase();
  const {
    data: { session },
    error,
  } = await client.auth.getSession();

  if (error) {
    throw error;
  }

  return session;
}

export async function signOutWorkspaceUser() {
  const client = requireSupabase();
  const { error } = await client.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function bootstrapWorkspaceForUser(
  user: User,
  options?: { projectName?: string; chapterTitle?: string },
) {
  const client = requireSupabase();
  const metadata = getBootstrapMetadata(user);

  const profilePayload = {
    id: user.id,
    name: metadata.name,
    language: metadata.language,
    experience_level: metadata.experienceLevel,
    genre: metadata.genre,
    project_name: options?.projectName ?? metadata.projectName,
  };

  const { error: profileError } = await client.from("profiles").upsert(profilePayload, { onConflict: "id" });

  if (profileError) {
    throw profileError;
  }

  const { data: existingProjects, error: projectsLookupError } = await client
    .from("projects")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  if (projectsLookupError) {
    throw projectsLookupError;
  }

  let project: ProjectRecord | null = null;

  if (existingProjects && existingProjects.length > 0) {
    const { data: fullProject, error: fullProjectError } = await client
      .from("projects")
      .select("*")
      .eq("id", existingProjects[0].id)
      .single<ProjectRecord>();
    
    if (fullProjectError) throw fullProjectError;
    project = fullProject;
  }

  if (!project) {
    // Try one last check for current projects list to avoid race condition in parallel calls
    const { data: retryProjects } = await client
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .limit(1);
    
    if (retryProjects && retryProjects.length > 0) {
      project = retryProjects[0] as ProjectRecord;
    } else {
      const { data: insertedProject, error: insertProjectError } = await client
        .from("projects")
        .insert({
          user_id: user.id,
          title: options?.projectName ?? metadata.projectName ?? "Untitled Project",
          genre: metadata.genre,
        })
        .select("*")
        .single<ProjectRecord>();

      if (insertProjectError) {
        throw insertProjectError;
      }

      project = insertedProject;
    }
  }

  const { count, error: chapterCountError } = await client
    .from("chapters")
    .select("*", { count: "exact", head: true })
    .eq("project_id", project.id);

  if (chapterCountError) {
    throw chapterCountError;
  }

  if ((count ?? 0) === 0) {
    const { error: chapterInsertError } = await client.from("chapters").insert({
      project_id: project.id,
      title: options?.chapterTitle ?? "Chapter 1",
      content: { text: "" },
      word_count: 0,
      order_index: 0,
    });

    if (chapterInsertError) {
      throw chapterInsertError;
    }
  }

  return project;
}

export async function bootstrapWorkspaceForCurrentUser(options?: {
  projectName?: string;
  chapterTitle?: string;
}) {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const project = await bootstrapWorkspaceForUser(user, options);
  return { user, project };
}

export async function getWorkspaceSnapshot(projectId?: string): Promise<WorkspaceSnapshot | null> {
  const client = requireSupabase();
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  await bootstrapWorkspaceForUser(user);

  const [profileResult, projectsResult, filesResult] = await Promise.all([
    client.from("profiles").select("*").eq("id", user.id).maybeSingle<ProfileRecord>(),
    client
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .returns<ProjectRecord[]>(),
    client
      .from("files")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .returns<FileRecord[]>(),
  ]);

  if (profileResult.error) {
    throw profileResult.error;
  }

  if (projectsResult.error) {
    throw projectsResult.error;
  }

  if (filesResult.error) {
    throw filesResult.error;
  }

  const projects = projectsResult.data ?? [];
  const files = sortFiles(filesResult.data ?? []);
  let activeProject = projects[0] ?? null;
  
  if (projectId) {
    activeProject = projects.find(p => p.id === projectId) ?? activeProject;
  }

  if (!activeProject) {
    return {
      user,
      profile: profileResult.data,
      projects,
      activeProject: null,
      chapters: [],
      worldElements: [],
      files,
    };
  }

  const [chaptersResult, worldElementsResult] = await Promise.all([
    client
      .from("chapters")
      .select("*")
      .eq("project_id", activeProject.id)
      .order("order_index", { ascending: true })
      .returns<ChapterRecord[]>(),
    client
      .from("world_elements")
      .select("*")
      .eq("project_id", activeProject.id)
      .order("updated_at", { ascending: false })
      .returns<WorldElementRecord[]>(),
  ]);

  if (chaptersResult.error) {
    throw chaptersResult.error;
  }

  if (worldElementsResult.error) {
    throw worldElementsResult.error;
  }

  return {
    user,
    profile: profileResult.data,
    projects,
    activeProject,
    chapters: chaptersResult.data ?? [],
    worldElements: worldElementsResult.data ?? [],
    files,
  };
}

export async function createChapter(projectId: string, title?: string) {
  const client = requireSupabase();
  const { count, error: countError } = await client
    .from("chapters")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId);

  if (countError) {
    throw countError;
  }

  const nextIndex = count ?? 0;
  const { data, error } = await client
    .from("chapters")
    .insert({
      project_id: projectId,
      title: title ?? `Chapter ${nextIndex + 1}`,
      content: { text: "" },
      word_count: 0,
      order_index: nextIndex,
    })
    .select("*")
    .single<ChapterRecord>();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateChapterContent(chapterId: string, content: string, title?: string, synopsis?: string) {
  const client = requireSupabase();
  const words = computeWordCount(content);

  const { data: existing } = await client.from("chapters").select("content").eq("id", chapterId).single();
  const currentContent = existing?.content && typeof existing.content === "object" && !Array.isArray(existing.content)
    ? existing.content
    : {};

  const { data, error } = await client
    .from("chapters")
    .update({
      content: { ...currentContent, text: content, ...(synopsis !== undefined ? { synopsis } : {}) },
      word_count: words,
      ...(title !== undefined ? { title } : {})
    })
    .eq("id", chapterId)
    .select("*")
    .single<ChapterRecord>();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteChapter(chapterId: string) {
  const client = requireSupabase();
  const { error } = await client
    .from("chapters")
    .delete()
    .eq("id", chapterId);
  if (error) {
    throw error;
  }
}

export async function uploadWorkspaceFile(projectId: string | null, file: File) {
  return uploadManagedFile({
    file,
    folderSegments: ["files"],
    projectId,
  });
}

export async function uploadCharacterImage(projectId: string, characterId: string, file: File) {
  return uploadManagedFile({
    displayName: file.name || `character-${characterId}`,
    file,
    folderSegments: ["characters", projectId, characterId],
    projectId,
  });
}

export async function deleteWorkspaceFile(fileId: string) {
  const client = requireSupabase();
  const { data: existingFile, error: lookupError } = await client
    .from("files")
    .select("*")
    .eq("id", fileId)
    .maybeSingle<FileRecord>();

  if (lookupError) {
    throw lookupError;
  }

  if (!existingFile) {
    throw new Error("The selected file no longer exists.");
  }

  await removeStorageObject(existingFile.file_path);

  const { error: deleteError } = await client.from("files").delete().eq("id", fileId);

  if (deleteError) {
    throw deleteError;
  }

  return existingFile;
}

export async function deleteWorkspaceFileByPath(filePath: string) {
  if (!filePath) {
    return null;
  }

  const client = requireSupabase();
  const { data: existingFile, error: lookupError } = await client
    .from("files")
    .select("*")
    .eq("file_path", filePath)
    .maybeSingle<FileRecord>();

  if (lookupError) {
    throw lookupError;
  }

  if (!existingFile) {
    await removeStorageObject(filePath);
    return null;
  }

  await deleteWorkspaceFile(existingFile.id);
  return existingFile;
}

export async function downloadWorkspaceFile(file: FileRecord) {
  const client = requireSupabase();
  const { data, error } = await client.storage.from(STORAGE_BUCKET).download(file.file_path);

  if (error) {
    throw error;
  }

  return data;
}

export async function createCharacterImageSignedUrl(storagePath: string) {
  if (!storagePath) {
    return null;
  }

  const client = requireSupabase();
  const { data, error } = await client.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, CHARACTER_IMAGE_SIGNED_URL_TTL_SECONDS);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

export async function createWorldElement(
  projectId: string,
  type: WorldElementType,
  options?: { name?: string; category?: string; description?: string },
) {
  const client = requireSupabase();
  const { count, error: countError } = await client
    .from("world_elements")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId)
    .eq("type", type);

  if (countError) {
    throw countError;
  }

  const defaults =
    type === "character"
      ? getDefaultCharacterAttributes()
      : type === "location"
        ? { category: options?.category ?? "Place" }
        : { category: options?.category ?? "Lore" };

  const { data, error } = await client
    .from("world_elements")
    .insert({
      project_id: projectId,
      type,
      name: options?.name ?? getDefaultWorldName(type, count ?? 0),
      description: options?.description ?? "",
      attributes: defaults,
    })
    .select("*")
    .single<WorldElementRecord>();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateWorldElement(
  id: string,
  updates: Partial<Pick<WorldElementRecord, "name" | "description" | "attributes">>,
) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("world_elements")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single<WorldElementRecord>();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteWorldElement(id: string) {
  const client = requireSupabase();
  const { error } = await client.from("world_elements").delete().eq("id", id);

  if (error) {
    throw error;
  }
}

export async function requestProjectExport(
  projectId: string,
  format: ExportFormat,
  options: ManuscriptExportOptions,
): Promise<RequestedExport> {
  const session = await getCurrentSession();

  if (!session?.access_token) {
    throw new Error("You need an active session before exporting.");
  }

  const client = requireSupabase();
  const { data: project } = await client.from("projects").select("*").eq("id", projectId).single();
  
  if (!project) {
    throw new Error("Project not found.");
  }

  let content = "";
  if (options.includeTitlePage) {
    content += `# ${project.title}\n\n`;
    if (project.description) {
      content += `${project.description}\n\n`;
    }
    content += `***\n\n`;
  }

  // Manuscript
  if (options.includeManuscript !== false) {
    let chapters = null;
    let chaptersQuery = client
      .from("chapters")
      .select("*")
      .eq("project_id", projectId)
      .order("order_index", { ascending: true });

    if (Array.isArray(options.includeManuscript)) {
      if (options.includeManuscript.length === 0) {
        chapters = [];
      } else {
        chaptersQuery = chaptersQuery.in("id", options.includeManuscript);
        const { data } = await chaptersQuery;
        chapters = data;
      }
    } else {
      const { data } = await chaptersQuery;
      chapters = data;
    }

    if (chapters && chapters.length > 0) {
      if (options.includeTableOfContents) {
        content += `## Table of Contents\n\n`;
        chapters.forEach((chapter, index) => {
          content += `${index + 1}. ${chapter.title}\n`;
        });
        content += `\n***\n\n`;
      }

      chapters.forEach((chapter) => {
        content += `## ${chapter.title}\n\n`;
        content += `${getChapterText(chapter.content)}\n\n`;
      });
    }
  }

  // World Elements
  const worldSections = [
    { key: "includeCharacters", type: "character", title: "Characters" },
    { key: "includeLocations", type: "location", title: "Locations" },
    { key: "includeLore", type: "lore", title: "World Lore" },
    { key: "includeItems", type: "item", title: "Items & Relics" },
    { key: "includeIdeas", type: "idea", title: "Ideas & Snippets" },
  ];

  for (const section of worldSections) {
    if (options[section.key as keyof ManuscriptExportOptions]) {
      const { data: elements } = await client
        .from("world_elements")
        .select("*")
        .eq("project_id", projectId)
        .eq("type", section.type)
        .order("name", { ascending: true });

      if (elements && elements.length > 0) {
        content += `\n***\n\n# ${section.title}\n\n`;
        elements.forEach((el) => {
          content += `## ${el.name}\n\n`;
          if (el.description) {
            content += `${el.description}\n\n`;
          }
          
          if (section.type === "character") {
            const attrs = getCharacterAttributes(el.attributes);
            content += `**Role:** ${attrs.role}\n`;
            content += `**Status:** ${attrs.status}\n`;
            if (attrs.nationality) content += `**Nationality:** ${attrs.nationality}\n`;
            if (attrs.age) content += `**Age:** ${attrs.age}\n`;
            if (attrs.occupation) content += `**Occupation:** ${attrs.occupation}\n`;
            content += `\n`;
            if (attrs.summary) content += `### Summary\n${attrs.summary}\n\n`;
            if (attrs.personality) content += `### Personality\n${attrs.personality}\n\n`;
            if (attrs.motivation) content += `### Motivation\n${attrs.motivation}\n\n`;
          } else {
            // Generic attributes for other types if any
            const attrs = getAttributesObject(el.attributes);
            Object.entries(attrs).forEach(([k, v]) => {
              if (k !== "image_path" && k !== "image_updated_at" && v) {
                content += `**${k.charAt(0).toUpperCase() + k.slice(1)}:** ${v}\n`;
              }
            });
            content += `\n`;
          }
        });
      }
    }
  }

  const fallbackFileName = `${sanitizeFileName(project.title)}.${format}`;

  if (format === "pdf") {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    
    // Very basic markdown to PDF conversion for now
    // In a real app we might want a more sophisticated parser
    const lines = content.split('\n');
    let cursorY = 20;
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxLineWidth = pageWidth - margin * 2;

    doc.setFontSize(18);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('# ')) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(26);
        cursorY += 15;
      } else if (line.startsWith('## ')) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        cursorY += 12;
      } else if (line.startsWith('### ')) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        cursorY += 8;
      } else if (line.startsWith('**')) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
      } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
      }

      const text = line.replace(/^#+ /, '');
      const wrappedText = doc.splitTextToSize(text, maxLineWidth);
      
      if (cursorY + (wrappedText.length * 7) > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        // Add page number
        const pageNum = doc.getNumberOfPages();
        doc.setFontSize(10);
        doc.text(`Page ${pageNum}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
        doc.setFontSize(12);
        cursorY = margin;
      }

      doc.text(wrappedText, margin, cursorY);
      cursorY += wrappedText.length * 7;
      
      if (line === "***") {
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, cursorY - 2, pageWidth - margin, cursorY - 2);
        cursorY += 8;
      }
      
      if (line.trim() === "") {
        cursorY += 3;
      }
    }

    return {
      blob: doc.output("blob"),
      contentType: "application/pdf",
      fileName: fallbackFileName,
    };
  }

  const blob = new Blob([content], { type: "text/plain" });

  return {
    blob,
    contentType: "text/plain",
    fileName: fallbackFileName,
  };
}

export async function updateWorkspaceProfile(
  updates: Partial<Pick<ProfileRecord, "name" | "language" | "experience_level" | "genre" | "project_name">>
) {
  const client = requireSupabase();
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("You must be logged in to update your profile.");
  }

  const { data, error } = await client
    .from("profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select("*")
    .single<ProfileRecord>();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateProject(
  id: string,
  updates: Partial<Pick<ProjectRecord, "title" | "description" | "genre" | "scratchpad" | "settings">>
) {
  const client = requireSupabase();
  
  const { data, error } = await client
    .from("projects")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single<ProjectRecord>();

  if (error) {
    throw error;
  }

  return data;
}

export async function reorderChapters(chapterIds: string[]) {
  const client = requireSupabase();
  const updates = chapterIds.map((id, index) => ({
    id,
    order_index: index,
  }));

  const { error } = await client.from("chapters").upsert(updates);
  if (error) {
    throw error;
  }
}

export async function reorderWorldElements(elementIds: string[]) {
  const client = requireSupabase();
  
  // First fetch the elements to get their existing attributes and other fields
  const { data: elements, error: fetchError } = await client
    .from("world_elements")
    .select("*")
    .in("id", elementIds);
    
  if (fetchError || !elements) {
    throw fetchError || new Error("Failed to fetch world elements for reordering");
  }

  // Create updates by taking existing element data and updating the position attribute
  const updates = elementIds.map((id, index) => {
    const existing = elements.find(e => e.id === id);
    if (!existing) throw new Error(`Element ${id} not found`);
    
    // We update the updated_at to satisfy the schema, and modify attributes to store the order
    return {
      id: existing.id,
      project_id: existing.project_id,
      type: existing.type,
      name: existing.name,
      description: existing.description,
      attributes: {
        ...getAttributesObject(existing.attributes),
        order_index: index
      },
      updated_at: new Date().toISOString()
    };
  });

  const { error } = await client.from("world_elements").upsert(updates);
  if (error) {
    throw error;
  }
}

export async function createProject(title: string, genre?: string | null) {
  const client = requireSupabase();
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("You must be logged in to create a project.");
  }

  const { data, error } = await client
    .from("projects")
    .insert({
      user_id: user.id,
      title: title || "New Project",
      genre: genre || null,
    })
    .select("*")
    .single<ProjectRecord>();

  if (error) {
    throw error;
  }

  // Auto-create chapter 1 for new projects
  await createChapter(data.id, "Chapter 1");

  return data;
}
