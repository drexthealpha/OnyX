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
/**
 * register — associate an AbortHandler with an operation ID.
 */
export declare function register(operationId: string, handler: AbortHandler): void;
/**
 * abort — trigger the abort sequence for a registered operation.
 * Sequence: look up → remove → refund() → phaseLog
 */
export declare function abort(operationId: string, code: AlarmCode): Promise<void>;
/**
 * clear — remove a handler without triggering the abort sequence.
 * Mirrors clearing a phase spot to G.0 (inactive) after ENDOFJOB.
 * Does NOT throw if the operationId is unknown (idempotent cleanup).
 */
export declare function clear(operationId: string): void;
//# sourceMappingURL=alarm-and-abort.d.ts.map