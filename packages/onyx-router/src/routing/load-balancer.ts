/**
 * @onyx/router — Round-Robin Load Balancer
 *
 * Rotates across providers in the same tier.
 * Tracks failures and removes a provider after 3 consecutive failures.
 * Auto-restores after 5 minutes.
 */

const FAILURE_THRESHOLD = 3;
const RESTORE_AFTER_MS = 5 * 60 * 1000; // 5 minutes

interface ProviderState {
  consecutiveFailures: number;
  removedAt: number | null;       // timestamp when removed, null if healthy
  roundRobinIndex: number;
}

// Module-level state — persists for the lifetime of the process
const state = new Map<string, ProviderState>();
const roundRobinCounters = new Map<string, number>(); // tier → index

function getOrCreateState(providerName: string): ProviderState {
  if (!state.has(providerName)) {
    state.set(providerName, {
      consecutiveFailures: 0,
      removedAt: null,
      roundRobinIndex: 0,
    });
  }
  return state.get(providerName)!;
}

/**
 * Check if a provider is currently available (not circuit-broken).
 * Auto-restores providers whose removal window has expired.
 */
export function isProviderAvailable(providerName: string): boolean {
  const s = getOrCreateState(providerName);
  if (s.removedAt === null) return true;

  // Auto-restore after 5 minutes
  if (Date.now() - s.removedAt >= RESTORE_AFTER_MS) {
    s.consecutiveFailures = 0;
    s.removedAt = null;
    return true;
  }

  return false;
}

/**
 * Record a successful request to a provider.
 * Resets the failure counter.
 */
export function recordSuccess(providerName: string): void {
  const s = getOrCreateState(providerName);
  s.consecutiveFailures = 0;
  s.removedAt = null;
}

/**
 * Record a failed request to a provider.
 * Removes the provider from rotation after FAILURE_THRESHOLD consecutive failures.
 */
export function recordFailure(providerName: string): void {
  const s = getOrCreateState(providerName);
  s.consecutiveFailures += 1;

  if (s.consecutiveFailures >= FAILURE_THRESHOLD && s.removedAt === null) {
    s.removedAt = Date.now();
    console.warn(
      `[onyx-router] Provider ${providerName} removed from rotation after ` +
        `${FAILURE_THRESHOLD} consecutive failures. Auto-restores in 5 minutes.`,
    );
  }
}

/**
 * Pick a provider from a list using round-robin rotation.
 * Skips unavailable (circuit-broken) providers.
 * Returns null if all providers are unavailable.
 *
 * @param tierKey      Unique key for this tier group (e.g., "SIMPLE-budget")
 * @param providerNames  Ordered list of provider names in this tier
 */
export function pickProvider(tierKey: string, providerNames: string[]): string | null {
  if (providerNames.length === 0) return null;

  // Filter to available providers
  const available = providerNames.filter(isProviderAvailable);
  if (available.length === 0) return null;

  // Round-robin within available providers
  const current = roundRobinCounters.get(tierKey) ?? 0;
  const next = current % available.length;
  roundRobinCounters.set(tierKey, next + 1);

  return available[next];
}

/**
 * Get current status of all tracked providers (for diagnostics).
 */
export function getProviderStatus(): Array<{
  name: string;
  available: boolean;
  consecutiveFailures: number;
  removedAt: number | null;
  restoresInMs: number | null;
}> {
  return [...state.entries()].map(([name, s]) => {
    const available = isProviderAvailable(name);
    const restoresInMs =
      s.removedAt !== null
        ? Math.max(0, RESTORE_AFTER_MS - (Date.now() - s.removedAt))
        : null;
    return { name, available, consecutiveFailures: s.consecutiveFailures, removedAt: s.removedAt, restoresInMs };
  });
}

/**
 * Reset all provider state (for testing).
 */
export function resetAllProviderState(): void {
  state.clear();
  roundRobinCounters.clear();
}