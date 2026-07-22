import { useState, useEffect } from 'react';
import { syncStatus as initialStatus, syncListeners } from './db';
import { isSupabaseConfigured } from './supabaseClient';


/**
 * Returns the current Supabase sync status:
 * 'idle'    — Supabase not configured, running on local storage
 * 'loading' — sync in progress
 * 'done'    — sync succeeded
 * 'error'   — one or more sync steps failed
 */
export function useSyncStatus() {
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    const handler = (s) => setStatus(s);
    syncListeners.add(handler);
    return () => syncListeners.delete(handler);
  }, []);

  return status;
}
