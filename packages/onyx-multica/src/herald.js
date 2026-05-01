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
export class Herald {
    subscribers = new Map();
    debugLabel;
    constructor(debugLabel = "Herald") {
        this.debugLabel = debugLabel;
    }
    /**
     * Publish data to all subscribers of `topic`.
     * Delivery is synchronous and in registration order.
     * A handler that throws does NOT prevent subsequent handlers from running.
     */
    publish(topic, data) {
        const handlers = this.subscribers.get(topic);
        if (handlers === undefined || handlers.size === 0)
            return;
        for (const handler of handlers) {
            try {
                handler(data);
            }
            catch (err) {
                console.error(`[${this.debugLabel}] Handler error on topic "${topic}":`, err);
            }
        }
    }
    /**
     * Subscribe to `topic`. Returns a zero-argument unsubscribe function.
     * Calling unsubscribe() is idempotent.
     */
    subscribe(topic, handler) {
        if (!this.subscribers.has(topic)) {
            this.subscribers.set(topic, new Set());
        }
        // Cast: the internal map is untyped; callers provide the type param.
        const typedHandler = handler;
        // Non-null assertion safe: we just ensured the key exists above.
        this.subscribers.get(topic).add(typedHandler);
        let unsubscribed = false;
        return () => {
            if (unsubscribed)
                return;
            unsubscribed = true;
            this.subscribers.get(topic)?.delete(typedHandler);
        };
    }
    /**
     * Return the number of active subscribers for a topic (useful for testing).
     */
    subscriberCount(topic) {
        return this.subscribers.get(topic)?.size ?? 0;
    }
    /**
     * Remove all subscribers for all topics.
     */
    clear() {
        this.subscribers.clear();
    }
}
/**
 * Factory — creates a fresh Herald instance.
 * Most packages should import the singleton exported below,
 * but tests and isolated layers can create their own.
 */
export function createHerald(label) {
    return new Herald(label);
}
/** Package-level singleton — the global ONYX event bus. */
export const globalHerald = createHerald("ONYX");
//# sourceMappingURL=herald.js.map