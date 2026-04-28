import { globalHerald } from "./herald.js";
const TOPIC_SET = "shared-memory.entry.set";
const TOPIC_DELETE = "shared-memory.entry.deleted";
export class SharedMemory {
    store = new Map();
    herald;
    constructor(herald = globalHerald) {
        this.herald = herald;
    }
    set(key, value, ttlMs) {
        const now = Date.now();
        const entry = {
            key,
            value,
            updatedAt: now,
            ...(ttlMs !== undefined ? { expiresAt: now + ttlMs } : {}),
        };
        this.store.set(key, entry);
        this.herald.publish(TOPIC_SET, { key, entry });
    }
    get(key) {
        const entry = this.store.get(key);
        if (entry === undefined)
            return undefined;
        if (entry.expiresAt !== undefined && Date.now() > entry.expiresAt) {
            this.store.delete(key);
            this.herald.publish(TOPIC_DELETE, { key });
            return undefined;
        }
        return entry.value;
    }
    delete(key) {
        if (!this.store.has(key))
            return;
        this.store.delete(key);
        this.herald.publish(TOPIC_DELETE, { key });
    }
    snapshot() {
        const now = Date.now();
        const live = new Map();
        for (const [key, entry] of this.store) {
            if (entry.expiresAt === undefined || entry.expiresAt > now) {
                live.set(key, entry);
            }
        }
        return live;
    }
    onSet(handler) {
        return this.herald.subscribe(TOPIC_SET, handler);
    }
    onDelete(handler) {
        return this.herald.subscribe(TOPIC_DELETE, handler);
    }
    clear() {
        const keys = [...this.store.keys()];
        this.store.clear();
        for (const key of keys) {
            this.herald.publish(TOPIC_DELETE, { key });
        }
    }
    get size() {
        return this.store.size;
    }
}
export function createSharedMemory(herald) {
    return new SharedMemory(herald);
}
//# sourceMappingURL=shared-memory.js.map