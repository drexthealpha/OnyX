/**
 * kernel/constants.ts
 *
 * Named constants for the ONYX kernel. Zero magic numbers anywhere else.
 *
 * Port mapping philosophy (mirrors AGC fixed-fixed bank addresses):
 *   GATEWAY_PORT  — primary inbound API surface, analogous to AGC's fixed-fixed
 *   NERVE_PORT    — control plane UI
 *   RL/TUTOR/etc  — each service has its own isolated port, like AGC EBANK separation
 *
 * Financial ceiling (MAX_DAILY_SPEND_LAMPORTS) mirrors AGC's budget abort
 *   threshold — exceeding it triggers BAILOUT with AlarmCode.BUDGET_CAP.
 *
 * MEMORY_CRYSTAL_MAX_TOKENS mirrors AGC's erasable memory word limit — the
 *   maximum token window kept in working memory before spilling to semantic store.
 */
// ---------------------------------------------------------------------------
// Network ports
// ---------------------------------------------------------------------------
export const GATEWAY_PORT = 18789;
export const NERVE_PORT = 3080;
export const RL_PORT = 30000;
export const TUTOR_PORT = 7001;
export const INTEL_PORT = 7002;
export const SEO_PORT = 7003;
export const EDITOR_PORT = 7004;
// ---------------------------------------------------------------------------
// Financial safety ceiling
// 1_000_000_000 lamports = 1 SOL
// Mirrors ALARM_AND_ABORT's FAILREG financial gate.
// ---------------------------------------------------------------------------
export const MAX_DAILY_SPEND_LAMPORTS = 1000000000n;
// ---------------------------------------------------------------------------
// Timing constants (milliseconds)
// QUEUE_FLUSH_INTERVAL_MS  — how often the waitlist persistent queue is flushed
//   Analogous to AGC's T3RUPT 10ms tick interval scaled to software timers.
// RESTART_DEBOUNCE_MS      — cooldown between watchdog restart attempts
//   Mirrors FRESH_START_AND_RESTART's deliberate pause between restart passes.
// ---------------------------------------------------------------------------
export const QUEUE_FLUSH_INTERVAL_MS = 5_000;
export const RESTART_DEBOUNCE_MS = 2_000;
// ---------------------------------------------------------------------------
// Memory & retry limits
// MEMORY_CRYSTAL_MAX_TOKENS — rolling context window cap for semantic memory
//   Mirrors AGC erasable limit (2K words × ~15-bit word ≈ 800 modern tokens).
// MAX_RESTART_ATTEMPTS      — watchdog gives up after this many consecutive failures
//   Mirrors AGC's phase-table exhaustion limit before DOFSTART cold boot.
// ---------------------------------------------------------------------------
export const MEMORY_CRYSTAL_MAX_TOKENS = 800;
export const MAX_RESTART_ATTEMPTS = 5;
//# sourceMappingURL=constants.js.map