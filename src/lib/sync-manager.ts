import { getDb, isTauriEnvironment } from './offline-db';

let isSyncing = false;
let isOffline = typeof window !== 'undefined' ? !navigator.onLine : false;

const listeners = new Set<(syncing: boolean, offline: boolean) => void>();

export function onSyncStateChange(listener: (syncing: boolean, offline: boolean) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners() {
  listeners.forEach((l) => l(isSyncing, isOffline));
}

export function setSyncing(state: boolean) {
  if (isSyncing !== state) {
    isSyncing = state;
    notifyListeners();
  }
}

export function setOffline(state: boolean) {
  if (isOffline !== state) {
    isOffline = state;
    notifyListeners();
  }
}

export async function addToQueue(action: string, payload: any) {
  if (!isTauriEnvironment()) {
    console.warn("Skipping sync queue: Not a Tauri environment.");
    return;
  }

  try {
    const db = await getDb();
    const id = crypto.randomUUID();
    const createdAt = Date.now();
    const payloadStr = JSON.stringify(payload);

    await db.execute(
      'INSERT INTO sync_queue (id, action, payload, created_at) VALUES ($1, $2, $3, $4)',
      [id, action, payloadStr, createdAt]
    );
    console.log(`Added action ${action} to sync queue`);
  } catch (error) {
    console.error("Failed to add to sync queue:", error);
  }
}

export async function processQueue() {
  if (!isTauriEnvironment()) {
    return;
  }

  if (!navigator.onLine) {
    console.log("Device is offline, skipping sync queue processing.");
    return;
  }

  try {
    const db = await getDb();
    
    // Get pending items ordered by creation time
    const items = await db.select('SELECT * FROM sync_queue ORDER BY created_at ASC');
    
    if (items.length === 0) {
      return;
    }

    setSyncing(true);
    console.log(`Processing ${items.length} items from sync queue...`);

    for (const item of items) {
      try {
        // Here we simulate sending the data to the backend
        // In a real implementation, this would involve calling your Supabase client or API
        const payload = JSON.parse(item.payload);
        console.log(`Syncing action: ${item.action}`, payload);
        
        // Simulate network request
        await new Promise(resolve => setTimeout(resolve, 500));

        // If successful, remove from queue
        await db.execute('DELETE FROM sync_queue WHERE id = $1', [item.id]);
        console.log(`Successfully synced and removed item ${item.id}`);
      } catch (err) {
        console.error(`Failed to process sync item ${item.id}:`, err);
        // We break on the first failure to maintain ordering
        break;
      }
    }
  } catch (error) {
    console.error("Failed to process sync queue:", error);
  } finally {
    setSyncing(false);
  }
}
