/**
 * @onyx/router — Per-User Spend Meter
 *
 * After each request: records spend to SQLite and reports token
 * efficiency metric to the RL module for reward shaping.
 *
 * Token efficiency = outputTokens / actualCostUSD
 * Higher = more output per dollar = better routing decision.
 */

import { recordSpend } from "./tracker.js";
import type { RLOutcome } from "../types.js";

const RL_PORT = process.env.RL_PORT ?? "4000";
const RL_URL = `http://localhost:${RL_PORT}`;

/**
 * Report spend and efficiency to RL module.
 * Fire-and-forget — never blocks the request path.
 */
async function reportToRL(outcome: RLOutcome): Promise<void> {
  try {
    await fetch(`${RL_URL}/outcome`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(outcome),
      signal: AbortSignal.timeout(2000),
    });
  } catch {
    // RL reporting is best-effort
  }
}

/**
 * Called after every completed LLM request.
 *
 * 1. Records actual spend to SQLite budget tracker.
 * 2. Computes token efficiency metric.
 * 3. Reports outcome to RL module (non-blocking).
 */
export function meterRequest(params: {
  userId: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  actualCostUSD: number;
  latencyMs: number;
  success: boolean;
}): void {
  const { userId, provider, model, inputTokens, outputTokens, actualCostUSD, latencyMs, success } =
    params;

  // 1. Record spend in SQLite
  recordSpend(userId, actualCostUSD, provider, model);

  // 2. Compute token efficiency
  // Protect against division by zero for free providers (NVIDIA)
  const tokenEfficiency =
    actualCostUSD > 0
      ? outputTokens / actualCostUSD
      : outputTokens * 1000; // treat free as very efficient

  // 3. Report to RL (fire-and-forget)
  const outcome: RLOutcome = {
    userId,
    provider,
    model,
    inputTokens,
    outputTokens,
    actualCostUSD,
    latencyMs,
    success,
    tokenEfficiency,
  };

  // Non-blocking — void the promise deliberately
  void reportToRL(outcome);
}