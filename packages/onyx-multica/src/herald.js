export class Herald {
    subscribers = new Map();
    debugLabel;
    constructor(debugLabel = "Herald") {
        this.debugLabel = debugLabel;
    }
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
    subscribe(topic, handler) {
        if (!this.subscribers.has(topic)) {
            this.subscribers.set(topic, new Set());
        }
        const typedHandler = handler;
        this.subscribers.get(topic).add(typedHandler);
        let unsubscribed = false;
        return () => {
            if (unsubscribed)
                return;
            unsubscribed = true;
            this.subscribers.get(topic)?.delete(typedHandler);
        };
    }
    subscriberCount(topic) {
        return this.subscribers.get(topic)?.size ?? 0;
    }
    clear() {
        this.subscribers.clear();
    }
}
export function createHerald(label) {
    return new Herald(label);
}
export const globalHerald = createHerald("ONYX");
//# sourceMappingURL=herald.js.map