# Aevon Enzonic Desktop App Architecture

This document outlines the architectural decisions for the new desktop version of the Aevon Enzonic Next.js web application.

## 1. Framework Choice: Tauri

**Decision:** We will use **Tauri** to build the desktop application.

**Rationale:**
* **Integration with Next.js:** Next.js can be easily exported as a static site (`output: 'export'`) and served natively by Tauri without requiring a Node.js runtime to be bundled.
* **Performance & Size:** Tauri utilizes the host OS's native webview (WebView2 on Windows, WebKit on macOS/Linux). This results in a significantly smaller application footprint (often under 10MB) compared to Electron (which bundles Chromium and Node.js) and uses far less RAM.
* **Security:** Tauri's architecture separating the frontend from a Rust core provides a secure-by-default environment with configurable IPC boundaries.
* **Packaging & Installers:** Tauri has robust built-in support for generating native installers across platforms (MSI/NSIS for Windows, DMG/App for macOS, AppImage/DEB for Linux) and allows embedding license agreements (e.g., MIT).

## 2. Folder Structure

The desktop application will reside in a new folder at the project root to keep it cleanly separated while allowing code sharing:

```text
aevon-enzonic-t2/
├── desktop-app/              # New desktop application directory
│   ├── src-tauri/            # Tauri Rust backend and configuration
│   │   ├── tauri.conf.json   # Build and packager configuration (includes MIT license ref)
│   │   └── src/              # Rust source code
│   └── package.json          # Desktop-specific dependencies and build scripts
├── src/                      # Existing Next.js frontend code
└── ...
```

The build process will export the Next.js `src` code statically and copy it into Tauri's web asset directory during the `tauri build` step.

## 3. Offline-First Sync Strategy with Supabase

To provide a seamless offline experience while ensuring data integrity with the Supabase backend:

**Local Data Storage:**
* **Tauri SQLite Plugin:** We will utilize `tauri-plugin-sql` to maintain a local SQLite database on the user's machine. This is ideal for relational data (Workspaces, Characters, Lore, Maps).
* **Secure Storage:** User authentication tokens (Supabase JWTs) will be stored securely using `tauri-plugin-store` combined with native OS credential managers.

**Sync Mechanism:**
* **Local-First Writes:** All database reads and writes from the frontend will immediately interact with the local SQLite database to ensure zero-latency UI updates.
* **Mutation Queue:** When offline, write operations are recorded in a local "sync queue" table.
* **Reconnection Sync:** When the app detects an active internet connection:
  1. It pushes queued local mutations to Supabase.
  2. It fetches new remote changes using a "last synced at" timestamp.
* **Conflict Resolution:** We will implement a Last-Write-Wins (LWW) strategy based on an `updated_at` column for each row.
* **Realtime Updates:** When online, the app will subscribe to Supabase Realtime channels to receive and apply remote changes immediately to the local database.

## 4. The `.aevon` File Format & Import/Export

The `.aevon` file serves as a portable backup or shareable package of an entire workspace.

**File Structure:**
A `.aevon` file is a standard ZIP archive with a custom extension. Its internal structure consists of:
* `manifest.json`: Metadata about the export (app version, export timestamp, workspace ID).
* `database.json`: A structured JSON dump of all workspace-specific relational data (Characters, Items, Lore, etc.) extracted from the local SQLite database.
* `assets/`: A directory containing all physical files, images, and maps associated with the workspace.

**Export Workflow:**
1. The user selects a workspace to export.
2. The Rust backend queries the local SQLite DB for all related records and serializes them to `database.json`.
3. The backend copies associated media from local storage into an `assets/` temp folder.
4. The backend compresses the JSON and assets into a ZIP file, renames it to `.aevon`, and saves it to the user's chosen location.

**Import Workflow:**
1. The user selects an `.aevon` file.
2. The Rust backend unzips the archive into a temporary directory.
3. It validates the `manifest.json`.
4. It parses `database.json` and inserts the records into the local SQLite database. If UUID collisions occur, it will either create a cloned workspace or prompt the user for merge conflict resolution.
5. Assets are moved to the local app data directory.
6. The app triggers a sync event to upload the newly imported workspace data and assets to Supabase.
