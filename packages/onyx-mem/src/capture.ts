// ─────────────────────────────────────────────
// onyx-mem · capture.ts
// Buffers conversation telemetry turns per sessionId.
// Integrates with @onyx/gateway via HTTP calls to the capture endpoint.
// ─────────────────────────────────────────────

import type { ConversationTelemetry } from './types.js';

// ── Internal buffer ──────────────────────────────────────────────────────────
// Map<sessionId → ordered array of turns>
const sessionBuffers = new Map<string, ConversationTelemetry[]>();

// ── Gateway integration ─────────────────────────────────────────────────
// For now, we record locally and expose for gateway to push into.
// The gateway should call pushTelemetry() for each conversation turn.

let captureInitialized = false;

/**
 * Initialize the capture system.
 * Called once at process start.
 */
export async function initCapture(): Promise<void> {
  if (captureInitialized) return;
  captureInitialized = true;
  console.info('[onyx-mem:capture] Initialized');
}

/**
 * Manually push a telemetry turn into the buffer.
 * Used by gateway integration or tests to record conversation turns.
 * @param telemetry - A telemetry turn (user or assistant)
 */
export function pushTelemetry(telemetry: ConversationTelemetry): void {
  const { sessionId } = telemetry;
  if (!sessionId) return;
  const existing = sessionBuffers.get(sessionId) ?? [];
  existing.push(telemetry);
  sessionBuffers.set(sessionId, existing);
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Return a copy of all buffered turns for a given session.
 * Returns an empty array if the session has no buffered data.
 */
export function getSessionBuffer(sessionId: string): ConversationTelemetry[] {
  return [...(sessionBuffers.get(sessionId) ?? [])];
}

/**
 * Clear the buffer for a given session (called after compression).
 */
export function clearSessionBuffer(sessionId: string): void {
  sessionBuffers.delete(sessionId);
}

/**
 * Return the count of active (buffered) sessions.
 * Useful for diagnostics.
 */
export function getActiveSessionCount(): number {
  return sessionBuffers.size;
}