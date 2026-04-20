/**
 * kernel/restart-tables.ts
 *
 * Service state machine — the ONYX Restart Tables.
 *
 * Inspired by RESTART_TABLES.agc (Comanche055): the AGC used PRDTTAB/CADRTAB
 * phase-spot entries (1.2SPOT, 4.6SPOT, etc.) to record which group was active
 * and what job/task to re-schedule if a restart occurred.  Each "group" had a
 * phase value that encoded the restart action.
 *
 * ONYX replaces the fixed octal spots with a typed state machine per service:
 *   - register()    — declare a service with its initial RestartState
 *   - getState()    — read current state (mirrors reading PRDTTAB)
 *   - transition()  — move to a new state (mirrors PHASCHNG / NEWPHASE)
 *   - checkpoint()  — persist arbitrary data to disk (mirrors storing 2CADR)
 *   - restore()     — reload persisted data from disk after a restart
 *
 * Checkpoint files are written to ./data/checkpoints/{service}.json.
 * On a WARM or HOT restart the kernel calls restore() for each registered
 * service before resuming, exactly as GOPROG3 tests phase tables before
 * restarting groups.
 */

import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { type RestartState } from "./types.ts";

// ---------------------------------------------------------------------------
// In-memory state table — mirrors AGC's PHASE1/TBASE1 erasable registers
// ---------------------------------------------------------------------------
interface ServiceEntry {
  state: RestartState;
}

const _table = new Map<string, ServiceEntry>();

// ---------------------------------------------------------------------------
// Checkpoint directory
// ---------------------------------------------------------------------------
const CHECKPOINT_DIR = "./data/checkpoints";

function checkpointPath(service: string): string {
  return join(CHECKPOINT_DIR, `${service}.json`);
}

function ensureDir(): void {
  mkdirSync(CHECKPOINT_DIR, { recursive: true });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * register — declare a service with an initial state.
 * Idempotent: calling again with the same service name is a no-op if already
 * registered, which mirrors the AGC phase-table initialisation in DOFSTART
 * (only clears phases on COLD start, not WARM/HOT).
 */
export function register(service: string, state: RestartState): void {
  if (!_table.has(service)) {
    _table.set(service, { state });
  }
}

/**
 * getState — return the current RestartState of a service.
 * Throws if the service has not been registered (mirrors reading an
 * uninitialised PRDTTAB entry — the AGC would BAILOUT OCT 1107).
 */
export function getState(service: string): RestartState {
  const entry = _table.get(service);
  if (!entry) {
    throw new Error(
      `[restart-tables] Service "${service}" not registered. ` +
      `Call register() before getState().`,
    );
  }
  return entry.state;
}

/**
 * transition — move a service to a new RestartState and persist the change.
 * Mirrors PHASCHNG writing both -PHASE and PHASE into the phase table so a
 * restart can verify consistency.
 */
export function transition(service: string, to: RestartState): void {
  const entry = _table.get(service);
  if (!entry) {
    throw new Error(
      `[restart-tables] Cannot transition unknown service "${service}".`,
    );
  }
  entry.state = to;

  ensureDir();
  const existing = existsSync(checkpointPath(service))
    ? JSON.parse(readFileSync(checkpointPath(service), "utf8"))
    : {};
  writeFileSync(
    checkpointPath(service),
    JSON.stringify({ ...existing, state: to, updatedAt: Date.now() }, null, 2),
    "utf8",
  );
}

/**
 * checkpoint — persist arbitrary service data to disk.
 * Mirrors storing the 2CADR and PRDTTAB in a restart-table phase spot.
 */
export function checkpoint(service: string, data: Record<string, unknown>): void {
  if (!_table.has(service)) {
    throw new Error(
      `[restart-tables] Cannot checkpoint unknown service "${service}".`,
    );
  }
  ensureDir();
  const existing = existsSync(checkpointPath(service))
    ? JSON.parse(readFileSync(checkpointPath(service), "utf8"))
    : {};
  writeFileSync(
    checkpointPath(service),
    JSON.stringify(
      { ...existing, ...data, service, checkpointAt: Date.now() },
      null,
      2,
    ),
    "utf8",
  );
}

/**
 * restore — reload persisted checkpoint data for a service.
 * Returns the stored data object or null if no checkpoint exists.
 * Mirrors GOPROG3 reading phase tables before restarting groups.
 */
export function restore(service: string): Record<string, unknown> | null {
  const path = checkpointPath(service);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}