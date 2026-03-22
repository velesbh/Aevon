/**
 * Setup and connection management for Tauri local database
 */

// Global variable to keep the database connection pool
let dbInstance: any = null;

export const isTauriEnvironment = () => {
  return typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
};

/**
 * Initializes and returns the offline database connection pool.
 */
export async function getDb(): Promise<any> {
  if (!isTauriEnvironment()) {
    throw new Error("Offline database is only available in Tauri environments.");
  }

  if (dbInstance) {
    return dbInstance;
  }

  try {
    const { default: Database } = await import('@tauri-apps/plugin-sql');
    const db = await Database.load('sqlite:aevon.db');

    // Initialize database schema
    await db.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT,
        description TEXT,
        content TEXT,
        updated_at TEXT
      );
    `);

    dbInstance = {
      execute: async (query: string, values?: any[]) => {
        return await db.execute(query, values);
      },
      select: async (query: string, values?: any[]) => {
        return await db.select(query, values);
      }
    };

    return dbInstance;
  } catch (error) {
    console.error("Failed to load offline database:", error);
    throw error;
  }
}

/**
 * A stub function for syncing projects with the local database.
 * To be expanded later.
 */
export async function syncProjects(projects: any[]) {
  if (!isTauriEnvironment()) {
    console.warn("Skipping local sync: Not a Tauri environment.");
    return;
  }

  try {
    const db = await getDb();
    console.log("Successfully synced projects to offline database (placeholder).");
  } catch (error) {
    console.error("Failed to sync projects:", error);
  }
}