// ─────────────────────────────────────────────
// onyx-mem · lifecycle.ts
// Session start/end hooks — the primary integration point.
// Called by @onyx/gateway or @onyx/agent at session boundaries.
// ─────────────────────────────────────────────

import type { MemoryCrystal, MemoryMode } from './types.js';
import { getSessionBuffer, clearSessionBuffer } from './capture.js';
import { compress } from './compress.js';
import { saveCrystal } from './store.js';
import { inject } from './inject.js';

/**
 * Called at the START of a new session.
 *
 * Retrieves relevant memories for the given topic and returns them as a
 * context string to be injected into the system prompt.
 *
 * @param sessionId - The new session's gateway sessionId
 * @param topic     - The user's opening prompt / topic
 * @returns Formatted "From previous sessions:\n..." string for injection
 */
export async function onSessionStart(
  sessionId: string,
  topic: string,
): Promise<string> {
  console.info(`[onyx-mem:lifecycle] Session START — ${sessionId}`);

  try {
    const context = await inject(topic);
    console.info(`[onyx-mem:lifecycle] Injected context (${context.length} chars) for session ${sessionId}`);
    return context;
  } catch (err) {
    console.warn('[onyx-mem:lifecycle] onSessionStart inject failed:', err);
    return 'From previous sessions:\n(memory unavailable)';
  }
}

/**
 * Called at the END of a session.
 *
 * Compresses the session's conversation buffer into a MemoryCrystal and
 * persists it (SQLite + Qdrant). Clears the in-memory buffer afterwards.
 *
 * @param sessionId - The ending session's gateway sessionId
 * @param mode      - Domain mode for compression hints
 * @returns The persisted MemoryCrystal
 */
export async function onSessionEnd(
  sessionId: string,
  mode: MemoryMode,
): Promise<MemoryCrystal> {
  console.info(`[onyx-mem:lifecycle] Session END — ${sessionId} (mode: ${mode})`);

  const buffer = getSessionBuffer(sessionId);

  console.info(
    `[onyx-mem:lifecycle] Compressing ${buffer.length} turns for session ${sessionId}`,
  );

  const crystal = await compress(sessionId, buffer, mode);

  await saveCrystal(crystal);
  clearSessionBuffer(sessionId);

  console.info(
    `[onyx-mem:lifecycle] Crystal ${crystal.id} saved — ` +
    `raw:${crystal.rawTokenCount}t → compressed:${crystal.compressedTokenCount}t`,
  );

  return crystal;
}