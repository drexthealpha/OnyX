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
import { type PhaseEvent } from "./types.ts";
/**
 * Ensure the log directory exists.
 * Called lazily on first phaseLog() and eagerly during boot.
 */
export declare function ensureLogDir(): void;
/**
 * phaseLog — record a phase transition event.
 * Writes a single-line JSON record to stdout AND appends to the NDJSON log file.
 */
export declare function phaseLog(event: PhaseEvent): void;
//# sourceMappingURL=phase-table.d.ts.map