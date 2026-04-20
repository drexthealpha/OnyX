/**
 * kernel/types.ts
 *
 * Core type definitions for the ONYX kernel.
 * Derived from Apollo-11 AGC Comanche055 architecture:
 *   - Priority enum mirrors the EXECUTIVE's job priority ordering
 *     (lower number = higher urgency, dispatched first — same as AGC's
 *     positive-priority-wins-CCS scan in EJSCAN)
 *   - RestartState mirrors FRESH_START_AND_RESTART's COLD (SLAP1/DOFSTART),
 *     WARM (GOPROG hardware restart) and HOT (ENEMA software restart) modes
 *   - AlarmCode mirrors ALARM_AND_ABORT's FAILREG alarm types
 *   - OnyxTask mirrors the AGC core-set job record (LOC, PRIORITY, PUSHLOC)
 *   - PhaseEvent mirrors PHASE_TABLE_MAINTENANCE's phase-change logging
 *   - AbortHandler mirrors the BAILOUT/POODOO refund obligation
 */

// ---------------------------------------------------------------------------
// Priority — maps directly to AGC EXECUTIVE job priorities.
// VAULT=0 is the highest urgency (like AGC's ISR-level tasks).
// BACKGROUND=7 is idle-level (like AGC's DUMMYJOB).
// ---------------------------------------------------------------------------
export enum Priority {
  VAULT      = 0,
  VOICE      = 1,
  CHANNEL    = 2,
  RESEARCH   = 3,
  RL         = 4,
  CONTENT    = 5,
  HEALTH     = 6,
  BACKGROUND = 7,
}

// ---------------------------------------------------------------------------
// RestartState — mirrors the three restart modes in FRESH_START_AND_RESTART:
//   COLD  → SLAP1 / DOFSTART  (full erasable clear, like power-on)
//   WARM  → GOPROG            (hardware restart, phase tables checked)
//   HOT   → ENEMA             (software restart, integration killed, re-run)
// ---------------------------------------------------------------------------
export enum RestartState {
  COLD = "COLD",
  WARM = "WARM",
  HOT  = "HOT",
}

// ---------------------------------------------------------------------------
// AlarmCode — mirrors ALARM_AND_ABORT FAILREG categories adapted for ONYX.
// BUDGET_CAP  → financial ceiling breached (analogous to BAILOUT/OCT 1201)
// POLICY_VIOLATION → safety rule broken (analogous to POODOO)
// SLIPPAGE    → execution drift beyond deadline (analogous to WAITLIST OCT 1203)
// TIMEOUT     → watchdog max-restart exhausted (analogous to AGC's CCSHOLE)
// ---------------------------------------------------------------------------
export enum AlarmCode {
  BUDGET_CAP       = "BUDGET_CAP",
  POLICY_VIOLATION = "POLICY_VIOLATION",
  SLIPPAGE         = "SLIPPAGE",
  TIMEOUT          = "TIMEOUT",
}

// ---------------------------------------------------------------------------
// OnyxTask — a schedulable unit of work, analogous to an AGC core-set entry.
// id         → unique task identifier (AGC: LOC register)
// priority   → dispatching urgency (AGC: PRIORITY register)
// fn         → the work to perform when dispatched (AGC: job 2CADR)
// createdAt  → FIFO tiebreaker within same priority (AGC: implicit entry order)
// ---------------------------------------------------------------------------
export interface OnyxTask {
  id:        string;
  priority:  Priority;
  fn:        () => Promise<void> | void;
  createdAt: number;   // Date.now() epoch ms — used as FIFO tiebreaker
}

// ---------------------------------------------------------------------------
// PhaseEvent — structured log record for phase-table changes, analogous to
// PHASCHNG's OCT XXXXX phase encoding but expressed as typed JSON.
// service   → which ONYX service changed state
// from / to → old and new state labels
// timestamp → wall-clock of the transition
// metadata  → arbitrary key-value pairs (alarm codes, restart counts, etc.)
// ---------------------------------------------------------------------------
export interface PhaseEvent {
  service:   string;
  from:      string;
  to:        string;
  timestamp: number;   // Date.now() epoch ms
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// AbortHandler — registered per-operation; called by alarm-and-abort.
// Mirrors the POODOO / BAILOUT contract: every abort MUST call refund() so
// any reserved lamports are returned before the operation is terminated.
// code   → the AlarmCode that will trigger this handler
// refund → async cleanup / token-return function (must not throw)
// ---------------------------------------------------------------------------
export interface AbortHandler {
  code:   AlarmCode;
  refund: () => Promise<void> | void;
}