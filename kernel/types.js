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
export var Priority;
(function (Priority) {
    Priority[Priority["VAULT"] = 0] = "VAULT";
    Priority[Priority["VOICE"] = 1] = "VOICE";
    Priority[Priority["CHANNEL"] = 2] = "CHANNEL";
    Priority[Priority["RESEARCH"] = 3] = "RESEARCH";
    Priority[Priority["RL"] = 4] = "RL";
    Priority[Priority["CONTENT"] = 5] = "CONTENT";
    Priority[Priority["HEALTH"] = 6] = "HEALTH";
    Priority[Priority["BACKGROUND"] = 7] = "BACKGROUND";
})(Priority || (Priority = {}));
// ---------------------------------------------------------------------------
// RestartState — mirrors the three restart modes in FRESH_START_AND_RESTART:
//   COLD  → SLAP1 / DOFSTART  (full erasable clear, like power-on)
//   WARM  → GOPROG            (hardware restart, phase tables checked)
//   HOT   → ENEMA             (software restart, integration killed, re-run)
// ---------------------------------------------------------------------------
export var RestartState;
(function (RestartState) {
    RestartState["COLD"] = "COLD";
    RestartState["WARM"] = "WARM";
    RestartState["HOT"] = "HOT";
})(RestartState || (RestartState = {}));
// ---------------------------------------------------------------------------
// AlarmCode — mirrors ALARM_AND_ABORT FAILREG categories adapted for ONYX.
// BUDGET_CAP  → financial ceiling breached (analogous to BAILOUT/OCT 1201)
// POLICY_VIOLATION → safety rule broken (analogous to POODOO)
// SLIPPAGE    → execution drift beyond deadline (analogous to WAITLIST OCT 1203)
// TIMEOUT     → watchdog max-restart exhausted (analogous to AGC's CCSHOLE)
// ---------------------------------------------------------------------------
export var AlarmCode;
(function (AlarmCode) {
    AlarmCode["BUDGET_CAP"] = "BUDGET_CAP";
    AlarmCode["POLICY_VIOLATION"] = "POLICY_VIOLATION";
    AlarmCode["SLIPPAGE"] = "SLIPPAGE";
    AlarmCode["TIMEOUT"] = "TIMEOUT";
})(AlarmCode || (AlarmCode = {}));
//# sourceMappingURL=types.js.map