/**
 * shared-memory.ts
 * Shared in-process state store for agents in the same ONYX council.
 *
 * All agents in a Council share one SharedMemory instance.
 * Entries are typed key→value pairs with optional TTL expiration.
 * The store publishes change events on the Herald so agents can react
 * to state mutations without polling.
 */
import type { Herald } from "./herald.js";
export interface MemoryEntry<T = unknown> {
    key: string;
    value: T;
    /** Unix timestamp (ms) when this entry expires; undefined = never. */
    expiresAt?: number;
    /** When the entry was last written. */
    updatedAt: number;
}
export type MemorySnapshot = ReadonlyMap<string, MemoryEntry>;
export type MemorySetEvent = {
    key: string;
    entry: MemoryEntry;
};
export type MemoryDeleteEvent = {
    key: string;
};
export declare class SharedMemory {
    private readonly store;
    private readonly herald;
    constructor(herald?: Herald);
    /**
     * Write a value for `key`.
     * Pass `ttlMs` to automatically expire the entry after that many milliseconds.
     */
    set<T = unknown>(key: string, value: T, ttlMs?: number): void;
    /**
     * Read the current value for `key`.
     * Returns undefined if the key does not exist or has expired.
     * Expired entries are lazily deleted on access.
     */
    get<T = unknown>(key: string): T | undefined;
    /**
     * Delete an entry by key. No-op if the key does not exist.
     */
    delete(key: string): void;
    /**
     * Return a snapshot of all live (non-expired) entries.
     */
    snapshot(): MemorySnapshot;
    /**
     * Subscribe to set events. Returns unsubscribe function.
     */
    onSet(handler: (event: MemorySetEvent) => void): () => void;
    /**
     * Subscribe to delete events. Returns unsubscribe function.
     */
    onDelete(handler: (event: MemoryDeleteEvent) => void): () => void;
    /**
     * Remove all entries and publish delete events for each.
     */
    clear(): void;
    /**
     * Number of live entries in the store.
     */
    get size(): number;
}
export declare function createSharedMemory(herald?: Herald): SharedMemory;
//# sourceMappingURL=shared-memory.d.ts.map