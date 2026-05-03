/**
 * kernel/fresh-start.ts
 *
 * Self-healing watchdog — the ONYX Fresh Start and Restart layer.
 *
 * Inspired by FRESH_START_AND_RESTART.agc (Comanche055):
 *   SLAP1   — operator-initiated fresh start (COLD)
 *   GOPROG  — hardware restart (WARM): check phase tables, re-schedule groups
 *   ENEMA   — software restart (HOT): kill stale integrations, re-run from phase
 *   GOPROG3 — common tail: validate tables, restart active groups
 *
 * After MAX_RESTART_ATTEMPTS consecutive failures, fires AlarmCode.TIMEOUT
 * (mirrors GOPROG3 jumping to DOFSTART after phase-table failure).
 */

import { RESTART_DEBOUNCE_MS, MAX_RESTART_ATTEMPTS } from "./constants.js";
import { AlarmCode } from "./types.js";
import { phaseLog } from "./phase-table.js";
import { abort, register } from "./alarm-and-abort.js";

function sleep(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/**
 * watchdog — run a service function with automatic restart on failure.
 *
 * @param serviceName  Human-readable service identifier (e.g. "onyx-gateway")
 * @param startFn      Async factory that resolves on clean exit, rejects on crash.
 */
export async function watchdog(
  serviceName: string,
  startFn: () => Promise<void>,
): Promise<void> {
  const abortId = `watchdog:${serviceName}`;
  register(abortId, {
    code:   AlarmCode.TIMEOUT,
    refund: async () => {},
  });

  let attempts = 0;

  while (attempts < MAX_RESTART_ATTEMPTS) {
    const isFirstAttempt = attempts === 0;

    phaseLog({
      service:   serviceName,
      from:      isFirstAttempt ? "stopped" : "crashed",
      to:        "starting",
      timestamp: Date.now(),
      metadata:  {
        attempt:            attempts + 1,
        maxRestartAttempts: MAX_RESTART_ATTEMPTS,
        restartType:        isFirstAttempt ? "COLD" : "WARM",
      },
    });

    try {
      await startFn();

      phaseLog({
        service:   serviceName,
        from:      "running",
        to:        "stopped",
        timestamp: Date.now(),
        metadata:  { reason: "clean_exit", attempts },
      });

      const { clear } = await import("./alarm-and-abort.js");
      clear(abortId);
      return;

    } catch (err) {
      attempts++;

      phaseLog({
        service:   serviceName,
        from:      "running",
        to:        "crashed",
        timestamp: Date.now(),
        metadata:  {
          error:       String(err),
          attempt:     attempts,
          maxAttempts: MAX_RESTART_ATTEMPTS,
        },
      });

      if (attempts >= MAX_RESTART_ATTEMPTS) {
        phaseLog({
          service:   serviceName,
          from:      "crashed",
          to:        "abandoned",
          timestamp: Date.now(),
          metadata:  {
            reason:    "max_restart_attempts_exceeded",
            alarmCode: AlarmCode.TIMEOUT,
          },
        });

        await abort(abortId, AlarmCode.TIMEOUT);
        return;
      }

      await sleep(RESTART_DEBOUNCE_MS);
    }
  }
}