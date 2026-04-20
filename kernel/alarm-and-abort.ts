/**
 * kernel/alarm-and-abort.ts
 *
 * Financial abort system — the ONYX Alarm and Abort layer.
 *
 * Inspired by ALARM_AND_ABORT.agc (Comanche055):
 *   ALARM   — non-abortive; records the code in FAILREG, returns to caller.
 *   POODOO  — abortive; stores erasables for debugging, invokes ENEMA.
 *   BAILOUT — harder abort; stores VAC area then jumps to hardware restart.
 *
 * ONYX maps these to a registry of per-operation AbortHandlers. Each
 * registered handler MUST provide a refund() function that returns any
 * reserved lamports before the operation is terminated.
 *
 * Invariants:
 *   1. abort(id) always calls handler.refund() exactly once.
 *   2. Aborting an unknown operationId throws (mirrors AGC CCSHOLE OCT 1103).
 *   3. clear(id) removes the handler; subsequent abort(id) throws.
 */

import { type AbortHandler, AlarmCode } from "./types.ts";
import { phaseLog } from "./phase-table.ts";

// ---------------------------------------------------------------------------
// In-memory abort-handler registry — mirrors FAILREG + VAC5STOR in the AGC
// ---------------------------------------------------------------------------
const _registry = new Map<string, AbortHandler>();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * register — associate an AbortHandler with an operation ID.
 */
export function register(operationId: string, handler: AbortHandler): void {
  _registry.set(operationId, handler);
}

/**
 * abort — trigger the abort sequence for a registered operation.
 * Sequence: look up → remove → refund() → phaseLog
 */
export async function abort(operationId: string, code: AlarmCode): Promise<void> {
  const handler = _registry.get(operationId);
  if (!handler) {
    throw new Error(
      `[alarm-and-abort] Cannot abort unknown operation "${operationId}". ` +
      `No handler registered. (AGC analogue: CCSHOLE OCT 1103)`,
    );
  }

  _registry.delete(operationId);
  await handler.refund();

  phaseLog({
    service:   operationId,
    from:      "active",
    to:        "aborted",
    timestamp: Date.now(),
    metadata:  { alarmCode: code, handlerCode: handler.code },
  });
}

/**
 * clear — remove a handler without triggering the abort sequence.
 * Mirrors clearing a phase spot to G.0 (inactive) after ENDOFJOB.
 * Does NOT throw if the operationId is unknown (idempotent cleanup).
 */
export function clear(operationId: string): void {
  _registry.delete(operationId);
}