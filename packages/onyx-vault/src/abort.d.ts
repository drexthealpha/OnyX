/**
 * @onyx/vault — Abort + Refund wrapper
 *
 * Registers an abort handler BEFORE running any irreversible operation.
 * Clears on success. Fires refund on failure.
 *
 * Apollo-11 law: any irreversible action must be abortable.
 */
/**
 * Wrap an irreversible async operation with abort + refund handling.
 */
export declare function withAbort<T>(operationId: string, operation: () => Promise<T>, refundFn: () => Promise<void>): Promise<T>;
//# sourceMappingURL=abort.d.ts.map