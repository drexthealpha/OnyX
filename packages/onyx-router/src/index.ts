/**
 * @onyx/router — Barrel Export
 */

export * from "./types.js";
export * from "./x402.js";
export * from "./routing/providers.js";
export * from "./routing/strategy.js";
export * from "./routing/load-balancer.js";
export * from "./budget/tracker.js";
export * from "./budget/cap.js";
export * from "./budget/per-user-meter.js";
export { routeRequest } from "./routing/strategy.js";

export async function listProviders() {
  const { PROVIDERS } = await import("./routing/providers.js");
  return PROVIDERS;
}

/**
 * Returns real SQLite-backed spend totals for a user, or a global summary.
 * Reads from the spend_events table written by recordSpend().
 */
export async function getBudgetStatus(userId?: string) {
  if (userId) {
    const { getSpendBreakdown } = await import("./budget/tracker.js");
    return getSpendBreakdown(userId);
  }
  const { getSummary } = await import("./budget/tracker.js");
  return getSummary();
}

/**
 * Enforces ONYX_DAILY_LIMIT_USD and ONYX_MONTHLY_LIMIT_USD env caps.
 * Throws if either limit is exceeded. Triggers kernel alarm-and-abort.
 */
export async function checkBudget(userId: string): Promise<void> {
  const { checkBudget: enforce } = await import("./budget/cap.js");
  return enforce(userId);
}