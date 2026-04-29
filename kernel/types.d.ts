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
export declare enum Priority {
    VAULT = 0,
    VOICE = 1,
    CHANNEL = 2,
    RESEARCH = 3,
    RL = 4,
    CONTENT = 5,
    HEALTH = 6,
    BACKGROUND = 7
}
export declare enum RestartState {
    COLD = "COLD",
    WARM = "WARM",
    HOT = "HOT"
}
export declare enum AlarmCode {
    BUDGET_CAP = "BUDGET_CAP",
    POLICY_VIOLATION = "POLICY_VIOLATION",
    SLIPPAGE = "SLIPPAGE",
    TIMEOUT = "TIMEOUT"
}
export interface OnyxTask {
    id: string;
    priority: Priority;
    fn: () => Promise<void> | void;
    createdAt: number;
}
export interface PhaseEvent {
    service: string;
    from: string;
    to: string;
    timestamp: number;
    metadata?: Record<string, unknown>;
}
export interface AbortHandler {
    code: AlarmCode;
    refund: () => Promise<void> | void;
}
//# sourceMappingURL=types.d.ts.map