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
export declare const GATEWAY_PORT = 18789;
export declare const NERVE_PORT = 3080;
export declare const RL_PORT = 30000;
export declare const TUTOR_PORT = 7001;
export declare const INTEL_PORT = 7002;
export declare const SEO_PORT = 7003;
export declare const EDITOR_PORT = 7004;
export declare const MAX_DAILY_SPEND_LAMPORTS: bigint;
export declare const QUEUE_FLUSH_INTERVAL_MS = 5000;
export declare const RESTART_DEBOUNCE_MS = 2000;
export declare const MEMORY_CRYSTAL_MAX_TOKENS = 800;
export declare const MAX_RESTART_ATTEMPTS = 5;
//# sourceMappingURL=constants.d.ts.map