/**
 * @onyx/router — Budget Cap Enforcer
 *
 * Reads ONYX_DAILY_LIMIT_USD and ONYX_MONTHLY_LIMIT_USD from env.
 * All limits are user-set — operator cost: $0.
 *
 * Calls kernel/alarm-and-abort when budget is exceeded.
 */

import { getDailySpend, getMonthlySpend } from "./tracker.js";

// User-set limits via env (operator cost: $0)
const DAILY_LIMIT_USD = parseFloat(process.env.ONYX_DAILY_LIMIT_USD ?? "0") || null;
const MONTHLY_LIMIT_USD = parseFloat(process.env.ONYX_MONTHLY_LIMIT_USD ?? "0") || null;
const KERNEL_PORT = process.env.KERNEL_PORT ?? "3000";
const KERNEL_URL = process.env.KERNEL_URL ?? `http://localhost:${KERNEL_PORT}`;

/**
 * Trigger kernel alarm-and-abort when a budget cap is exceeded.
 * Fire-and-forget — does not block the calling code.
 */
async function triggerKernelAlarm(
  userId: string,
  limitType: "daily" | "monthly",
  spent: number,
  limit: number,
): Promise<void> {
  try {
    const payload = {
      event: "BUDGET_CAP_EXCEEDED",
      userId,
      limitType,
      spentUSD: spent,
      limitUSD: limit,
      timestamp: Date.now(),
      action: "abort",
    };
    await fetch(`${KERNEL_URL}/alarm-and-abort`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // Kernel alarm is best-effort — don't let network failures unblock spend
    console.error(`[onyx-router] Failed to reach kernel alarm endpoint at ${KERNEL_URL}`);
  }
}

/**
 * Check whether a user is within their daily and monthly budget limits.
 *
 * @throws Error if either limit is exceeded — caller should abort the request.
 */
export async function checkBudget(userId: string): Promise<void> {
  const checks: Array<Promise<void>> = [];

  if (DAILY_LIMIT_USD !== null) {
    const daily = getDailySpend(userId);
    if (daily >= DAILY_LIMIT_USD) {
      // Trigger kernel alarm (non-blocking)
      checks.push(triggerKernelAlarm(userId, "daily", daily, DAILY_LIMIT_USD));
      throw new Error(
        `Daily budget cap exceeded for user ${userId}: ` +
          `$${daily.toFixed(4)} spent of $${DAILY_LIMIT_USD.toFixed(2)} limit`,
      );
    }
  }

  if (MONTHLY_LIMIT_USD !== null) {
    const monthly = getMonthlySpend(userId);
    if (monthly >= MONTHLY_LIMIT_USD) {
      checks.push(triggerKernelAlarm(userId, "monthly", monthly, MONTHLY_LIMIT_USD));
      throw new Error(
        `Monthly budget cap exceeded for user ${userId}: ` +
          `$${monthly.toFixed(4)} spent of $${MONTHLY_LIMIT_USD.toFixed(2)} limit`,
      );
    }
  }

  // Await any triggered alarms (best-effort, don't rethrow)
  await Promise.allSettled(checks);
}

/**
 * Get remaining budget for a user (for display/diagnostics).
 */
export function getRemainingBudget(userId: string): {
  dailyRemainingUSD: number | null;
  monthlyRemainingUSD: number | null;
} {
  return {
    dailyRemainingUSD:
      DAILY_LIMIT_USD !== null
        ? Math.max(0, DAILY_LIMIT_USD - getDailySpend(userId))
        : null,
    monthlyRemainingUSD:
      MONTHLY_LIMIT_USD !== null
        ? Math.max(0, MONTHLY_LIMIT_USD - getMonthlySpend(userId))
        : null,
  };
}