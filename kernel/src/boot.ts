/**
 * kernel/boot.ts
 *
 * ONYX kernel boot sequence.
 *
 * Mirrors the AGC STARTSUB → STARTSB2 → DOFSTART → GOPROG3 sequence:
 *   STARTSUB  → validate hardware / constants
 *   STARTSB2  → replace all waitlisted tasks with ENDTASK, zero VAC areas
 *   DOFSTART  → clear phase table, initialize flags, jump to DUMMYJOB idle
 *   GOPROG3   → on warm restart, test phase tables and re-schedule groups
 *
 * Boot order:
 *   1. Validate constants
 *   2. Initialise waitlist database
 *   3. Initialise restart-tables
 *   4. Initialise phase-table log directory
 *   5. Emit BOOT_COMPLETE phase event
 */

import {
  GATEWAY_PORT,
  NERVE_PORT,
  RL_PORT,
  TUTOR_PORT,
  INTEL_PORT,
  SEO_PORT,
  EDITOR_PORT,
  MAX_DAILY_SPEND_LAMPORTS,
  QUEUE_FLUSH_INTERVAL_MS,
  RESTART_DEBOUNCE_MS,
  MEMORY_CRYSTAL_MAX_TOKENS,
  MAX_RESTART_ATTEMPTS,
} from "./constants.js";

import { size as waitlistSize } from "./waitlist.js";
import { register } from "./restart-tables.js";
import { ensureLogDir, phaseLog } from "./phase-table.js";
import { RestartState } from "./types.js";

function validateConstants(): void {
  const portConstants: [string, number][] = [
    ["GATEWAY_PORT",  GATEWAY_PORT],
    ["NERVE_PORT",    NERVE_PORT],
    ["RL_PORT",       RL_PORT],
    ["TUTOR_PORT",    TUTOR_PORT],
    ["INTEL_PORT",    INTEL_PORT],
    ["SEO_PORT",      SEO_PORT],
    ["EDITOR_PORT",   EDITOR_PORT],
  ];

  for (const [name, value] of portConstants) {
    if (!Number.isInteger(value) || value <= 0 || value > 65535) {
      throw new Error(
        `[boot] Invalid constant ${name}=${value}. Expected integer in range 1–65535.`,
      );
    }
  }

  if (MAX_DAILY_SPEND_LAMPORTS <= 0n) {
    throw new Error(
      `[boot] MAX_DAILY_SPEND_LAMPORTS must be > 0, got ${MAX_DAILY_SPEND_LAMPORTS}`,
    );
  }

  const numericConstants: [string, number][] = [
    ["QUEUE_FLUSH_INTERVAL_MS",   QUEUE_FLUSH_INTERVAL_MS],
    ["RESTART_DEBOUNCE_MS",       RESTART_DEBOUNCE_MS],
    ["MEMORY_CRYSTAL_MAX_TOKENS", MEMORY_CRYSTAL_MAX_TOKENS],
    ["MAX_RESTART_ATTEMPTS",      MAX_RESTART_ATTEMPTS],
  ];

  for (const [name, value] of numericConstants) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error(
        `[boot] Invalid constant ${name}=${value}. Expected positive finite number.`,
      );
    }
  }
}

function initWaitlist(): void {
  const n = waitlistSize();
  phaseLog({
    service:   "kernel/waitlist",
    from:      "uninitialised",
    to:        "ready",
    timestamp: Date.now(),
    metadata:  { pendingTasks: n },
  });
}

function initRestartTables(): void {
  const kernelServices = [
    "kernel/executive",
    "kernel/waitlist",
    "kernel/alarm-and-abort",
    "kernel/phase-table",
    "kernel/fresh-start",
  ] as const;

  for (const svc of kernelServices) {
    register(svc, RestartState.COLD);
  }

  phaseLog({
    service:   "kernel/restart-tables",
    from:      "uninitialised",
    to:        "ready",
    timestamp: Date.now(),
    metadata:  { registeredServices: kernelServices.length },
  });
}

function initPhaseTableLogDir(): void {
  ensureLogDir();
  phaseLog({
    service:   "kernel/phase-table",
    from:      "uninitialised",
    to:        "ready",
    timestamp: Date.now(),
  });
}

function emitBootComplete(): void {
  phaseLog({
    service:   "kernel",
    from:      "booting",
    to:        "BOOT_COMPLETE",
    timestamp: Date.now(),
    metadata:  {
      gatewayPort:           GATEWAY_PORT,
      nervePort:             NERVE_PORT,
      maxDailySpendLamports: MAX_DAILY_SPEND_LAMPORTS.toString(),
      maxRestartAttempts:    MAX_RESTART_ATTEMPTS,
    },
  });
}

export async function boot(): Promise<void> {
  validateConstants();
  initWaitlist();
  initRestartTables();
  initPhaseTableLogDir();
  emitBootComplete();
}