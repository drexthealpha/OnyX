/**
 * herald.ts
 * In-process pub/sub event bus.
 *
 * publish(topic, data)  — fire-and-forget delivery to all subscribers on that topic.
 * subscribe(topic, handler) — register a handler; returns an unsubscribe function.
 *
 * Topics support exact matches only (no glob). Use dot-separated convention:
 *   "agent.status.changed"
 *   "council.proposal.submitted"
 *   "layer.compute.task.queued"
 *
 * Multiple subscribers per topic are all called synchronously in registration order.
 * Errors thrown by individual handlers are caught and logged; other handlers still run.
 */
export type HeraldHandler<T = unknown> = (data: T) => void;
export type HeraldUnsubscribe = () => void;
export declare class Herald {
    private readonly subscribers;
    private readonly debugLabel;
    constructor(debugLabel?: string);
    /**
     * Publish data to all subscribers of `topic`.
     * Delivery is synchronous and in registration order.
     * A handler that throws does NOT prevent subsequent handlers from running.
     */
    publish(topic: string, data: unknown): void;
    /**
     * Subscribe to `topic`. Returns a zero-argument unsubscribe function.
     * Calling unsubscribe() is idempotent.
     */
    subscribe<T = unknown>(topic: string, handler: HeraldHandler<T>): HeraldUnsubscribe;
    /**
     * Return the number of active subscribers for a topic (useful for testing).
     */
    subscriberCount(topic: string): number;
    /**
     * Remove all subscribers for all topics.
     */
    clear(): void;
}
/**
 * Factory — creates a fresh Herald instance.
 * Most packages should import the singleton exported below,
 * but tests and isolated layers can create their own.
 */
export declare function createHerald(label?: string): Herald;
/** Package-level singleton — the global ONYX event bus. */
export declare const globalHerald: Herald;
//# sourceMappingURL=herald.d.ts.map