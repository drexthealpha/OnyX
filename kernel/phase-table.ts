/**
 * kernel/phase-table.ts
 *
 * Structured phase-event logger — the ONYX Phase Table.
 *
 * Inspired by PHASE_TABLE_MAINTENANCE.agc (Comanche055):
 *   PHASCHNG and NEWPHASE wrote phase information into fixed-memory phase spots
 *   so that after any restart, GOPROG3 could read the table and re-schedule
 *   exactly the right jobs.
 *
 * ONYX replaces the bit-packed OCT XXXXX phase words with structured JSON log
 * records (PhaseEvent). Events are written to:
 *   1. stdout (JSON lines — picked up by any log aggregator)
 *   2. ./logs/phase.ndjson (append-only NDJSON file for local crash analysis)
 */

import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { type PhaseEvent } from "./types.ts";

const LOG_DIR  = "./logs";
const LOG_FILE = join(LOG_DIR, "phase.ndjson");

/**
 * Ensure the log directory exists.
 * Called lazily on first phaseLog() and eagerly during boot.
 */
export function ensureLogDir(): void {
  mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * phaseLog — record a phase transition event.
 * Writes a single-line JSON record to stdout AND appends to the NDJSON log file.
 */
export function phaseLog(event: PhaseEvent): void {
  ensureLogDir();

  const record = JSON.stringify({
    level:     "info",
    time:      event.timestamp,
    service:   event.service,
    from:      event.from,
    to:        event.to,
    metadata:  event.metadata ?? {},
  });

  process.stdout.write(record + "\n");

  try {
    appendFileSync(LOG_FILE, record + "\n", "utf8");
  } catch (err) {
    process.stderr.write(
      JSON.stringify({
        level:   "warn",
        time:    Date.now(),
        msg:     "[phase-table] Failed to append to log file",
        logFile: LOG_FILE,
        error:   String(err),
      }) + "\n",
    );
  }
}