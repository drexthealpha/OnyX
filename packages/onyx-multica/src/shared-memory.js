/**
 * shared-memory.ts
 * Shared in-process state store for agents in the same ONYX council.
 *
 * All agents in a Council share one SharedMemory instance.
 * Entries are typed key→value pairs with optional TTL expiration.
 * The store publishes change events on the Herald so agents can react
 * to state mutations without polling.
 */
import { globalHerald } from "./herald.js";
const TOPIC_SET = "shared-memory.entry.set";
const TOPIC_DELETE = "shared-memory.entry.deleted";
export class SharedMemory {
    store = new Map();
    herald;
    constructor(herald = globalHerald) {
        this.herald = herald;
    }
    /**
     * Write a value for `key`.
     * Pass `ttlMs` to automatically expire the entry after that many milliseconds.
     */
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
    /**
     * Read the current value for `key`.
     * Returns undefined if the key does not exist or has expired.
     * Expired entries are lazily deleted on access.
     */
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
    /**
     * Delete an entry by key. No-op if the key does not exist.
     */
    delete(key) {
        if (!this.store.has(key))
            return;
        this.store.delete(key);
        this.herald.publish(TOPIC_DELETE, { key });
    }
    /**
     * Return a snapshot of all live (non-expired) entries.
     */
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
    /**
     * Subscribe to set events. Returns unsubscribe function.
     */
    onSet(handler) {
        return this.herald.subscribe(TOPIC_SET, handler);
    }
    /**
     * Subscribe to delete events. Returns unsubscribe function.
     */
    onDelete(handler) {
        return this.herald.subscribe(TOPIC_DELETE, handler);
    }
    /**
     * Remove all entries and publish delete events for each.
     */
    clear() {
        const keys = [...this.store.keys()];
        this.store.clear();
        for (const key of keys) {
            this.herald.publish(TOPIC_DELETE, { key });
        }
    }
    /**
     * Number of live entries in the store.
     */
    get size() {
        return this.store.size;
    }
}
export function createSharedMemory(herald) {
    return new SharedMemory(herald);
}
//# sourceMappingURL=shared-memory.js.map