// packages/onyx-nomad/src/sync.ts
import { isOnline } from './detect';
import { flush } from './fallback/queue';
import type { SyncResult } from './types';

const POLL_INTERVAL_MS = 30_000; // 30 seconds

let _daemonTimer: ReturnType<typeof setInterval> | null = null;
let _wasOnline: boolean | null = null;

/**
 * performSync — executed when the device reconnects.
 *
 * Steps:
 *   1. Flush the offline operations queue
 *   2. Sync @onyx/mem crystals to remote Qdrant
 *   3. Re-embed any documents added while offline via @onyx/semantic
 */
async function performSync(): Promise<SyncResult> {
  const result: SyncResult = {
    flushedOps: 0,
    crystalsSynced: 0,
    docsReEmbedded: 0,
    completedAt: Date.now(),
    errors: [],
  };

  // Step 1: Flush offline queue
  try {
    const { pendingCount } = await import('./fallback/queue');
    const before = pendingCount();
    await flush();
    const after = pendingCount();
    result.flushedOps = Math.max(0, before - after);
  } catch (err) {
    result.errors.push(`queue flush: ${String(err)}`);
  }

  // Step 2: Sync @onyx/mem crystals to remote Qdrant
  try {
    // Dynamically import to avoid hard dep at startup
    const mem = await import('@onyx/mem');
    if (typeof (mem as Record<string, unknown>).syncCrystals === 'function') {
      const synced = await (mem as { syncCrystals: () => Promise<number> }).syncCrystals();
      result.crystalsSynced = synced;
    }
  } catch (err) {
    result.errors.push(`mem sync: ${String(err)}`);
  }

  // Step 3: Re-embed documents via @onyx/semantic
  try {
    const semantic = await import('@onyx/semantic');
    if (typeof (semantic as Record<string, unknown>).reEmbedPending === 'function') {
      const reEmbedded = await (semantic as { reEmbedPending: () => Promise<number> }).reEmbedPending();
      result.docsReEmbedded = reEmbedded;
    }
  } catch (err) {
    result.errors.push(`semantic re-embed: ${String(err)}`);
  }

  result.completedAt = Date.now();

  console.log(
    `[nomad:sync] Sync complete — flushed=${result.flushedOps} crystals=${result.crystalsSynced} docs=${result.docsReEmbedded}`
  );

  return result;
}

/**
 * startSyncDaemon — polls isOnline() every 30 seconds.
 *
 * When the device transitions offline→online, performSync() is triggered.
 * Idempotent: calling startSyncDaemon() more than once is safe.
 */
export function startSyncDaemon(): void {
  if (_daemonTimer) return; // Already running

  console.log('[nomad:sync] Sync daemon started (interval: 30s)');

  _daemonTimer = setInterval(async () => {
    try {
      const online = await isOnline();

      if (_wasOnline === false && online) {
        // Just came back online
        console.log('[nomad:sync] Reconnected — starting sync...');
        await performSync();
      }

      _wasOnline = online;
    } catch (err) {
      console.error('[nomad:sync] Daemon poll error:', err);
    }
  }, POLL_INTERVAL_MS);

  // Unref so the interval doesn't prevent process exit
  if (_daemonTimer.unref) {
    _daemonTimer.unref();
  }
}

/** Stop the sync daemon (useful in tests). */
export function stopSyncDaemon(): void {
  if (_daemonTimer) {
    clearInterval(_daemonTimer);
    _daemonTimer = null;
  }
  _wasOnline = null;
}