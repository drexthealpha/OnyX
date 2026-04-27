// packages/onyx-nomad/src/index.ts — barrel + startNomad()
export type {
  ComputeBackend,
  OfflineOperation,
  SyncResult,
  NomadState,
  SearchResult,
  IntelBrief,
} from './types';

export { isOnline } from './detect';
export { getAvailableBackend } from './fallback/compute';
export { indexDocument, searchOffline, closeStorageDb } from './fallback/storage';
export { enqueue, flush, pendingCount } from './fallback/queue';
export { preload, getOfflineKnowledge, closeKnowledgeDb } from './knowledge/preload';
export { searchKnowledge } from './knowledge/offline-search';
export { startSyncDaemon, stopSyncDaemon } from './sync';

import { isOnline } from './detect';
import { getAvailableBackend } from './fallback/compute';
import { startSyncDaemon } from './sync';
import type { NomadState } from './types';
import { pendingCount } from './fallback/queue';

/**
 * startNomad — bootstraps the offline sovereignty layer.
 *
 * 1. Detects current connectivity state
 * 2. Probes for available compute backend
 * 3. Starts the 30s sync daemon
 * 4. Returns current NomadState snapshot
 */
export async function startNomad(): Promise<NomadState> {
  const online = await isOnline();

  let activeBackend: NomadState['activeBackend'] = null;
  if (!online) {
    try {
      activeBackend = await getAvailableBackend();
      console.log(`[nomad] Offline — using backend: ${activeBackend}`);
    } catch (err) {
      console.warn('[nomad] No compute backend available:', err);
    }
  }

  startSyncDaemon();

  const state: NomadState = {
    isOnline: online,
    activeBackend,
    pendingOps: pendingCount(),
    lastSyncAt: null,
    daemonRunning: true,
  };

  console.log(`[nomad] Started — online=${online} backend=${activeBackend ?? 'n/a'} pending=${state.pendingOps}`);

  return state;
}