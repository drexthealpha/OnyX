/**
 * quorum.ts
 * Quorum-gated operation wrapper.
 */
export interface QuorumOptions {
    threshold: number;
    operationFn: () => Promise<void>;
    timeoutMs?: number;
    getWeight?: (agentId: string) => number;
}
export interface QuorumHandle {
    checkIn: (agentId: string) => void;
    readonly currentWeight: number;
}
export declare function requireQuorum(options: QuorumOptions): {
    promise: Promise<void>;
    handle: QuorumHandle;
};
//# sourceMappingURL=quorum.d.ts.map