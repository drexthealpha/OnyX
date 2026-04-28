import type { Herald } from "./herald.js";
export interface MemoryEntry<T = unknown> {
    key: string;
    value: T;
    expiresAt?: number;
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
    set<T = unknown>(key: string, value: T, ttlMs?: number): void;
    get<T = unknown>(key: string): T | undefined;
    delete(key: string): void;
    snapshot(): MemorySnapshot;
    onSet(handler: (event: MemorySetEvent) => void): () => void;
    onDelete(handler: (event: MemoryDeleteEvent) => void): () => void;
    clear(): void;
    get size(): number;
}
export declare function createSharedMemory(herald?: Herald): SharedMemory;
//# sourceMappingURL=shared-memory.d.ts.map