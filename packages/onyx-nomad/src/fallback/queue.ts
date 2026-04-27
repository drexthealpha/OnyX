// packages/onyx-nomad/src/fallback/queue.ts
import { appendFileSync, readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import type { OfflineOperation } from '../types';

const QUEUE_PATH = path.resolve('./data/offline-queue.ndjson');

/** Ensure the data directory exists */
function ensureDir(): void {
  mkdirSync(path.dirname(QUEUE_PATH), { recursive: true });
}

/**
 * enqueue — appends a single OfflineOperation to the NDJSON queue file.
 * Each line is a complete, self-contained JSON object.
 */
export function enqueue(op: OfflineOperation): void {
  ensureDir();
  appendFileSync(QUEUE_PATH, JSON.stringify(op) + '\n', 'utf8');
}

/**
 * readQueue — reads all pending operations from the NDJSON file.
 * Skips malformed lines silently.
 */
function readQueue(): OfflineOperation[] {
  if (!existsSync(QUEUE_PATH)) return [];
  const raw = readFileSync(QUEUE_PATH, 'utf8');
  return raw
    .split('\n')
    .filter(Boolean)
    .flatMap((line) => {
      try {
        return [JSON.parse(line) as OfflineOperation];
      } catch {
        return [];
      }
    });
}

/**
 * executeOperation — routes a single operation by its type.
 * Extend this switch as new operation types are added to ONYX.
 */
async function executeOperation(op: OfflineOperation): Promise<void> {
  switch (op.type) {
    case 'intel': {
      const { runIntel } = await import('@onyx/intel');
      await runIntel((op.params as { topic: string }).topic);
      break;
    }
    case 'embed': {
      // Re-embedding deferred until online — no-op here; sync.ts handles it
      break;
    }
    case 'mem-store': {
      // Mem crystal storage — handled by sync daemon on reconnect
      break;
    }
    default: {
      console.warn(`[nomad:queue] Unknown op type: ${op.type} — skipping`);
    }
  }
}

/**
 * flush — reads all queued operations, executes each, then:
 * - On complete success: deletes the queue file.
 * - On partial failure: rewrites the file with only the failed entries.
 */
export async function flush(): Promise<void> {
  const ops = readQueue();
  if (ops.length === 0) return;

  const failed: OfflineOperation[] = [];

  for (const op of ops) {
    try {
      await executeOperation(op);
    } catch (err) {
      console.error(`[nomad:queue] Failed to execute op ${op.id}:`, err);
      failed.push(op);
    }
  }

  if (failed.length === 0) {
    // All succeeded — clear the queue file entirely
    try {
      unlinkSync(QUEUE_PATH);
    } catch {
      // File may already be gone
    }
  } else {
    // Rewrite with only the failures for next retry
    writeFileSync(
      QUEUE_PATH,
      failed.map((op) => JSON.stringify(op)).join('\n') + '\n',
      'utf8'
    );
  }
}

/** Return the number of pending operations without executing them. */
export function pendingCount(): number {
  return readQueue().length;
}