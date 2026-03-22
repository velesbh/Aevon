"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/lib/i18n";
import { processQueue, setSyncing } from "@/lib/sync-manager";
import {
  buildCharacterAttributes,
  createChapter,
  deleteChapter,
  createProject,
  createWorldElement,
  deleteWorldElement,
  deleteWorkspaceFile,
  deleteWorkspaceFileByPath,
  getCharacterAttributes,
  getCharacterImagePath,
  getWorkspaceSnapshot,
  updateChapterContent,
  updateProject,
  updateWorldElement,
  updateWorkspaceProfile,
  uploadCharacterImage,
  uploadWorkspaceFile,
  type ChapterRecord,
  type FileRecord,
  type ProfileRecord,
  type ProjectRecord,
  type WorkspaceSnapshot,
  type WorldElementRecord,
  type WorldElementType,
} from "@/lib/workspace";

const ACTIVE_PROJECT_STORAGE_KEY = "aevon.activeProjectId";

function getStoredProjectId() {
  if (typeof window === "undefined") return null;
  // Try cookie first, then fallback to local storage
  const match = document.cookie.match(new RegExp('(^| )' + ACTIVE_PROJECT_STORAGE_KEY + '=([^;]+)'));
  if (match) return match[2];
  return window.localStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY);
}

function setStoredProjectId(id: string) {
  if (typeof window === "undefined") return;
  document.cookie = `${ACTIVE_PROJECT_STORAGE_KEY}=${id}; path=/; max-age=31536000`; // 1 year
  window.localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, id);
}

interface DashboardWorkspaceContextValue {
  workspace: WorkspaceSnapshot | null;
  loading: boolean;
  error: string | null;
  refreshWorkspace: (projectId?: string, options?: { silent?: boolean }) => Promise<void>;
  switchProject: (projectId: string) => Promise<void>;
  projects: ProjectRecord[];
  activeProjectId: string | null;
  activeProjectTitle: string | null;
  profile: ProfileRecord | null;
  chapters: ChapterRecord[];
  worldElements: WorldElementRecord[];
  files: FileRecord[];
  characters: WorldElementRecord[];
  setSelectedCharacterId: (id: string | null) => void;
  selectedCharacterId: string | null;
  createChapterRecord: (title?: string) => Promise<ChapterRecord>;
  saveChapterRecord: (chapterId: string, content: string, title?: string, synopsis?: string) => Promise<ChapterRecord>;
  deleteChapterRecord: (chapterId: string) => Promise<void>;
  uploadFileRecord: (file: File) => Promise<FileRecord>;
  deleteFileRecord: (id: string) => Promise<void>;
  createWorldElementRecord: (type: WorldElementType) => Promise<WorldElementRecord>;
  saveWorldElementRecord: (
    id: string,
    updates: Partial<Pick<WorldElementRecord, "name" | "description" | "attributes">>,
  ) => Promise<WorldElementRecord>;
  deleteWorldElementRecord: (id: string) => Promise<void>;
  uploadCharacterImageRecord: (id: string, file: File) => Promise<WorldElementRecord>;
  removeCharacterImageRecord: (id: string) => Promise<WorldElementRecord>;
  createProjectRecord: (title: string, genre?: string | null) => Promise<ProjectRecord>;
  saveActiveProjectRecord: (
    updates: Partial<Pick<ProjectRecord, "title" | "description" | "genre">>,
  ) => Promise<ProjectRecord>;
  saveProfileRecord: (
    updates: Partial<Pick<ProfileRecord, "name" | "language" | "experience_level" | "genre" | "project_name">>,
  ) => Promise<ProfileRecord>;
}

const DashboardWorkspaceContext = createContext<DashboardWorkspaceContextValue | null>(null);

function sortChapters(chapters: ChapterRecord[]) {
  return [...chapters].sort((left, right) => left.order_index - right.order_index);
}

function sortFiles(files: FileRecord[]) {
  return [...files].sort(
    (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
  );
}

function sortProjects(projects: ProjectRecord[]) {
  return [...projects].sort(
    (left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime(),
  );
}

function applyStorageDelta(profile: ProfileRecord | null, delta: number) {
  if (!profile) {
    return profile;
  }

  return {
    ...profile,
    storage_used: Math.max(0, (profile.storage_used ?? 0) + delta),
  };
}

export function DashboardWorkspaceProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [workspace, setWorkspace] = useState<WorkspaceSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);

  const refreshWorkspace = useCallback(
    async (projectId?: string, options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      try {
        const nextWorkspace = await getWorkspaceSnapshot(projectId);
        setWorkspace(nextWorkspace);
      } catch (refreshError) {
        setError(refreshError instanceof Error ? refreshError.message : "Unable to load workspace.");
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [],
  );

  const switchProject = useCallback(
    async (projectId: string) => {
      setStoredProjectId(projectId);
      await refreshWorkspace(projectId);
    },
    [refreshWorkspace],
  );

  useEffect(() => {
    const storedProjectId = getStoredProjectId();
    void refreshWorkspace(storedProjectId ?? undefined);
  }, [refreshWorkspace]);

  useEffect(() => {
    if (!workspace?.activeProject?.id) {
      return;
    }
    setStoredProjectId(workspace.activeProject.id);
  }, [workspace?.activeProject?.id]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event as string) === 'TOKEN_REFRESH_FAILED') {
        return;
      }
      
      if (!session?.user) {
        setWorkspace(null);
        setSelectedCharacterId(null);
        setLoading(false);
        return;
      }

      const storedProjectId = typeof window !== "undefined" ? window.localStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY) : null;
      void refreshWorkspace(storedProjectId ?? undefined);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshWorkspace]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.addEventListener("online", processQueue);
    
    // Also try processing when component mounts in case we came online while it was unmounted
    if (navigator.onLine) {
      void processQueue();
    }

    return () => {
      window.removeEventListener("online", processQueue);
    };
  }, []);

  const chapters = useMemo(() => workspace?.chapters ?? [], [workspace?.chapters]);
  const worldElements = useMemo(() => workspace?.worldElements ?? [], [workspace?.worldElements]);
  const files = useMemo(() => workspace?.files ?? [], [workspace?.files]);
  const characters = useMemo(
    () => worldElements.filter((element) => element.type === "character"),
    [worldElements],
  );

  useEffect(() => {
    if (characters.length === 0) {
      setSelectedCharacterId(null);
      return;
    }

    if (!selectedCharacterId || !characters.some((character) => character.id === selectedCharacterId)) {
      setSelectedCharacterId(characters[0]?.id ?? null);
    }
  }, [characters, selectedCharacterId]);

  const createChapterRecord = useCallback(
    async (title?: string) => {
      if (!workspace?.activeProject?.id) {
        throw new Error("No active project available.");
      }
      setSyncing(true);
      try {
        const chapter = await createChapter(workspace.activeProject.id, title);
        setWorkspace((current) =>
          current
            ? {
                ...current,
                chapters: sortChapters([...current.chapters, chapter]),
              }
            : current,
        );

        return chapter;
      } finally {
        setSyncing(false);
      }
    },
    [workspace?.activeProject?.id],
  );

  const saveChapterRecord = useCallback(async (chapterId: string, content: string, title?: string, synopsis?: string) => {
    setSyncing(true);
    try {
      const updatedChapter = await updateChapterContent(chapterId, content, title, synopsis);

      setWorkspace((current) =>
        current
          ? {
              ...current,
              chapters: current.chapters.map((chapter) =>
                chapter.id === updatedChapter.id ? updatedChapter : chapter,
              ),
            }
          : current,
      );

      return updatedChapter;
    } finally {
      setSyncing(false);
    }
  }, []);

  const deleteChapterRecord = useCallback(async (chapterId: string) => {
    setSyncing(true);
    try {
      await deleteChapter(chapterId);

      setWorkspace((current) =>
        current
          ? {
              ...current,
              chapters: current.chapters.filter((chapter) => chapter.id !== chapterId),
            }
          : current,
      );
    } finally {
      setSyncing(false);
    }
  }, []);

  const uploadFileRecord = useCallback(
    async (file: File) => {
      setSyncing(true);
      try {
        const uploadedFile = await uploadWorkspaceFile(workspace?.activeProject?.id ?? null, file);

        setWorkspace((current) =>
          current
            ? {
                ...current,
                files: sortFiles([uploadedFile, ...current.files]),
                profile: applyStorageDelta(current.profile, uploadedFile.file_size),
              }
            : current,
        );

        return uploadedFile;
      } finally {
        setSyncing(false);
      }
    },
    [workspace?.activeProject?.id],
  );

  const deleteFileRecord = useCallback(
    async (id: string) => {
      setSyncing(true);
      const existingFile = workspace?.files.find((file) => file.id === id);

      if (!existingFile) {
        throw new Error("File not found.");
      }

      const linkedCharacter = workspace?.worldElements.find(
        (element) =>
          element.type === "character" && getCharacterImagePath(element.attributes) === existingFile.file_path,
      );

      try {
        const existingFile = workspace?.files.find((file) => file.id === id);

        if (!existingFile) {
          throw new Error("File not found.");
        }

        const linkedCharacter = workspace?.worldElements.find(
          (element) =>
            element.type === "character" && getCharacterImagePath(element.attributes) === existingFile.file_path,
        );
        let updatedCharacter: WorldElementRecord | null = null;

        if (linkedCharacter) {
          updatedCharacter = await updateWorldElement(linkedCharacter.id, {
            attributes: buildCharacterAttributes(linkedCharacter.attributes, {
              ...getCharacterAttributes(linkedCharacter.attributes),
              image_path: "",
              image_updated_at: new Date().toISOString(),
            }),
          });
        }

        await deleteWorkspaceFile(existingFile.id);

        setWorkspace((current) =>
          current
            ? {
                ...current,
                files: current.files.filter((file) => file.id !== existingFile.id),
                profile: applyStorageDelta(current.profile, -existingFile.file_size),
                worldElements: updatedCharacter
                  ? current.worldElements.map((element) =>
                      element.id === updatedCharacter.id ? updatedCharacter : element,
                    )
                  : current.worldElements,
              }
            : current,
        );
      } catch (deleteError) {
        await refreshWorkspace(workspace?.activeProject?.id);
        throw deleteError;
      } finally {
        setSyncing(false);
      }
    },
    [refreshWorkspace, workspace],
  );

  const createWorldElementRecord = useCallback(
    async (type: WorldElementType) => {
      if (!workspace?.activeProject?.id) {
        throw new Error("No active project available.");
      }
      setSyncing(true);
      try {
        const nameMap: Record<WorldElementType, string> = {
          character: t("workspace.newElement.character"),
          location: t("workspace.newElement.location"),
          lore: t("workspace.newElement.lore"),
          item: t("workspace.newElement.item"),
          lore_diagram: t("workspace.newElement.diagram"),
        };

        const categoryMap: Partial<Record<WorldElementType, string>> = {
          location: t("workspace.category.place"),
          lore: t("workspace.category.lore"),
        };

        const createdElement = await createWorldElement(workspace.activeProject.id, type, {
          name: nameMap[type],
          category: categoryMap[type],
        });
        setWorkspace((current) =>
          current
            ? {
                ...current,
                worldElements: [createdElement, ...current.worldElements],
              }
            : current,
        );

        if (type === "character") {
          setSelectedCharacterId(createdElement.id);
        }

        return createdElement;
      } finally {
        setSyncing(false);
      }
    },
    [workspace?.activeProject?.id],
  );

  const saveWorldElementRecord = useCallback(
    async (
      id: string,
      updates: Partial<Pick<WorldElementRecord, "name" | "description" | "attributes">>,
    ) => {
      setSyncing(true);
      try {
        const updatedElement = await updateWorldElement(id, updates);

        setWorkspace((current) =>
          current
            ? {
                ...current,
                worldElements: current.worldElements.map((element) =>
                  element.id === updatedElement.id ? updatedElement : element,
                ),
              }
            : current,
        );

        return updatedElement;
      } finally {
        setSyncing(false);
      }
    },
    [],
  );

  const deleteWorldElementRecord = useCallback(
    async (id: string) => {
      setSyncing(true);
      const existingElement = workspace?.worldElements.find((element) => element.id === id) ?? null;
      const imagePath =
        existingElement?.type === "character" ? getCharacterImagePath(existingElement.attributes) : "";

      try {
        const removedFile = imagePath ? await deleteWorkspaceFileByPath(imagePath) : null;
        await deleteWorldElement(id);

        setWorkspace((current) =>
          current
            ? {
                ...current,
                worldElements: current.worldElements.filter((element) => element.id !== id),
                files: removedFile
                  ? current.files.filter((file) => file.id !== removedFile.id)
                  : current.files,
                profile: removedFile
                  ? applyStorageDelta(current.profile, -removedFile.file_size)
                  : current.profile,
              }
            : current,
        );
      } catch (deleteError) {
        await refreshWorkspace(workspace?.activeProject?.id);
        throw deleteError;
      } finally {
        setSyncing(false);
      }
    },
    [refreshWorkspace, workspace],
  );

  const uploadCharacterImageRecord = useCallback(
    async (id: string, file: File) => {
      if (!workspace?.activeProject?.id) {
        throw new Error("No active project available.");
      }

      const existingCharacter = workspace.worldElements.find(
        (element) => element.id === id && element.type === "character",
      );

      if (!existingCharacter) {
        throw new Error("Character not found.");
      }
      setSyncing(true);
      const previousImagePath = getCharacterImagePath(existingCharacter.attributes);

      try {
        const uploadedFile = await uploadCharacterImage(workspace.activeProject.id, id, file);
        let updatedCharacter: WorldElementRecord;

        try {
          updatedCharacter = await updateWorldElement(id, {
            attributes: buildCharacterAttributes(existingCharacter.attributes, {
              ...getCharacterAttributes(existingCharacter.attributes),
              image_path: uploadedFile.file_path,
              image_updated_at: new Date().toISOString(),
            }),
          });
        } catch (updateError) {
          await deleteWorkspaceFile(uploadedFile.id).catch(() => undefined);
          throw updateError;
        }

        const removedPreviousFile =
          previousImagePath && previousImagePath !== uploadedFile.file_path
            ? await deleteWorkspaceFileByPath(previousImagePath).catch(() => null)
            : null;

        setWorkspace((current) =>
          current
            ? {
                ...current,
                worldElements: current.worldElements.map((element) =>
                  element.id === updatedCharacter.id ? updatedCharacter : element,
                ),
                files: sortFiles([
                  uploadedFile,
                  ...current.files.filter(
                    (existingFile) =>
                      existingFile.id !== uploadedFile.id &&
                      (!removedPreviousFile || existingFile.id !== removedPreviousFile.id),
                  ),
                ]),
                profile: applyStorageDelta(
                  applyStorageDelta(current.profile, uploadedFile.file_size),
                  -(removedPreviousFile?.file_size ?? 0),
                ),
              }
            : current,
        );

        return updatedCharacter;
      } catch (uploadError) {
        await refreshWorkspace(workspace?.activeProject?.id);
        throw uploadError;
      }
    },
    [refreshWorkspace, workspace],
  );

  const removeCharacterImageRecord = useCallback(
    async (id: string) => {
      setSyncing(true);
      const existingCharacter = workspace?.worldElements.find(
        (element) => element.id === id && element.type === "character",
      );

      if (!existingCharacter) {
        setSyncing(false);
        throw new Error("Character not found.");
      }

      try {
        const previousImagePath = getCharacterImagePath(existingCharacter.attributes);
        const updatedCharacter = await updateWorldElement(id, {
          attributes: buildCharacterAttributes(existingCharacter.attributes, {
            ...getCharacterAttributes(existingCharacter.attributes),
            image_path: "",
            image_updated_at: new Date().toISOString(),
          }),
        });
        const removedFile = previousImagePath ? await deleteWorkspaceFileByPath(previousImagePath) : null;

        setWorkspace((current) =>
          current
            ? {
                ...current,
                worldElements: current.worldElements.map((element) =>
                  element.id === updatedCharacter.id ? updatedCharacter : element,
                ),
                files: removedFile
                  ? current.files.filter((file) => file.id !== removedFile.id)
                  : current.files,
                profile: removedFile
                  ? applyStorageDelta(current.profile, -removedFile.file_size)
                  : current.profile,
              }
            : current,
        );

        return updatedCharacter;
      } catch (removeError) {
        await refreshWorkspace(workspace?.activeProject?.id);
        throw removeError;
      } finally {
        setSyncing(false);
      }
    },
    [refreshWorkspace, workspace],
  );

  const createProjectRecord = useCallback(
    async (title: string, genre?: string | null) => {
      const project = await createProject(title, genre);

      setWorkspace((current) =>
        current
          ? {
              ...current,
              projects: sortProjects([...current.projects, project]),
            }
          : current,
      );

      return project;
    },
    [],
  );

  const saveActiveProjectRecord = useCallback(
    async (updates: Partial<Pick<ProjectRecord, "title" | "description" | "genre">>) => {
      if (!workspace?.activeProject?.id) {
        throw new Error("No active project available.");
      }

      const updatedProject = await updateProject(workspace.activeProject.id, updates);

      setWorkspace((current) =>
        current
          ? {
              ...current,
              activeProject: updatedProject,
              projects: current.projects.map((project) =>
                project.id === updatedProject.id ? updatedProject : project,
              ),
            }
          : current,
      );

      return updatedProject;
    },
    [workspace?.activeProject?.id],
  );

  const saveProfileRecord = useCallback(
    async (
      updates: Partial<Pick<ProfileRecord, "name" | "language" | "experience_level" | "genre" | "project_name">>,
    ) => {
      const updatedProfile = await updateWorkspaceProfile(updates);

      setWorkspace((current) =>
        current
          ? {
              ...current,
              profile: updatedProfile,
            }
          : current,
      );

      return updatedProfile;
    },
    [],
  );

  const value = useMemo<DashboardWorkspaceContextValue>(
    () => ({
      workspace,
      loading,
      error,
      refreshWorkspace,
      switchProject,
      projects: workspace?.projects ?? [],
      activeProjectId: workspace?.activeProject?.id ?? null,
      activeProjectTitle: workspace?.activeProject?.title ?? null,
      profile: workspace?.profile ?? null,
      chapters,
      worldElements,
      files,
      characters,
      selectedCharacterId,
      setSelectedCharacterId,
      createChapterRecord,
      saveChapterRecord,
      deleteChapterRecord,
      uploadFileRecord,
      deleteFileRecord,
      createWorldElementRecord,
      saveWorldElementRecord,
      deleteWorldElementRecord,
      uploadCharacterImageRecord,
      removeCharacterImageRecord,
      createProjectRecord,
      saveActiveProjectRecord,
      saveProfileRecord,
    }),
    [
      workspace,
      loading,
      error,
      refreshWorkspace,
      switchProject,
      chapters,
      worldElements,
      files,
      characters,
      selectedCharacterId,
      createChapterRecord,
      saveChapterRecord,
      deleteChapterRecord,
      uploadFileRecord,
      deleteFileRecord,
      createWorldElementRecord,
      saveWorldElementRecord,
      deleteWorldElementRecord,
      uploadCharacterImageRecord,
      removeCharacterImageRecord,
      createProjectRecord,
      saveActiveProjectRecord,
      saveProfileRecord,
    ],
  );

  return (
    <DashboardWorkspaceContext.Provider value={value}>{children}</DashboardWorkspaceContext.Provider>
  );
}

export function useDashboardWorkspace() {
  const context = useContext(DashboardWorkspaceContext);

  if (!context) {
    throw new Error("useDashboardWorkspace must be used within DashboardWorkspaceProvider.");
  }

  return context;
}
