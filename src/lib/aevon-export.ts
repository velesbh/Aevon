/**
 * Core logic for .aevon export/import functionality.
 */

// Helper to check if running inside Tauri
export const isTauriEnvironment = () => {
  return typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
};

export async function exportAevonProject(projectId: string): Promise<boolean> {
  if (!isTauriEnvironment()) {
    console.warn("Not in a Tauri environment. Export aborted.");
    return false;
  }

  try {
    const { save } = await import('@tauri-apps/plugin-dialog');
    const { writeFile } = await import('@tauri-apps/plugin-fs');

    const filePath = await save({
      title: 'Export Aevon Project',
      defaultPath: `project-${projectId}.aevon`,
      filters: [{ name: 'Aevon Project', extensions: ['aevon'] }]
    });

    if (!filePath) {
      return false;
    }

    const data = JSON.stringify({ projectId, exportedAt: new Date().toISOString() });
    const buffer = new TextEncoder().encode(data);
    await writeFile(filePath, new Uint8Array(buffer));

    return true;
  } catch (error) {
    console.error("Failed to export .aevon file:", error);
    throw error;
  }
}

export async function importAevonProject(): Promise<string | null> {
  if (!isTauriEnvironment()) {
    console.warn("Not in a Tauri environment. Import aborted.");
    return null;
  }

  try {
    const { open } = await import('@tauri-apps/plugin-dialog');
    const { readFile } = await import('@tauri-apps/plugin-fs');

    const filePath = await open({
      title: 'Import Aevon Project',
      filters: [{ name: 'Aevon Project', extensions: ['aevon'] }],
      multiple: false
    });

    if (!filePath || Array.isArray(filePath)) {
      return null;
    }

    const buffer = await readFile(filePath);
    const data = new TextDecoder().decode(buffer);
    return data;
  } catch (error) {
    console.error("Failed to import .aevon file:", error);
    throw error;
  }
}