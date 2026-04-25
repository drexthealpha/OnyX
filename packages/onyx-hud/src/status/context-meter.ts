// ─────────────────────────────────────────────
//  @onyx/hud — status/context-meter.ts
//  getTokenUsage(): polls GET http://localhost:${GATEWAY_PORT}/metrics
//  Returns { used, total, percent } where percent ∈ [0, 100]
// ─────────────────────────────────────────────

import type { TokenUsage } from "../types.js";

const GATEWAY_PORT = process.env["GATEWAY_PORT"] ?? "3000";
const METRICS_URL = `http://localhost:${GATEWAY_PORT}/metrics`;

export const POLL_INTERVAL_MS = 300;

/**
 * Fetches token usage from the ONYX gateway /metrics endpoint.
 * Gateway /metrics response: { "context": { "used": number, "total": number } }
 *
 * @returns TokenUsage — { used, total, percent } where percent ∈ [0, 100]
 */
export async function getTokenUsage(): Promise<TokenUsage> {
  try {
    const res = await fetch(METRICS_URL, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) return { used: 0, total: 200_000, percent: 0 };

    const data = (await res.json()) as Record<string, unknown>;
    const context = (data["context"] ?? {}) as Record<string, unknown>;
    const used = Number(context["used"] ?? 0);
    const total = Number(context["total"] ?? 200_000);
    const percent = total > 0 ? Math.min(100, Math.max(0, (used / total) * 100)) : 0;

    return { used, total, percent };
  } catch {
    // Gateway not running — safe zero state
    return { used: 0, total: 200_000, percent: 0 };
  }
}

/**
 * Starts a 300ms polling loop. Returns a stop() function.
 */
export function startPolling(
  onUpdate: (usage: TokenUsage) => void,
  intervalMs: number = POLL_INTERVAL_MS
): () => void {
  let active = true;
  async function loop() {
    while (active) {
      const usage = await getTokenUsage();
      if (active) onUpdate(usage);
      await new Promise<void>((r) => setTimeout(r, intervalMs));
    }
  }
  loop().catch(console.error);
  return () => { active = false; };
}