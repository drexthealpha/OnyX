/**
 * Collection: onyx_memories
 * Stores agent episodic memories — what happened, when, and why it matters.
 *
 * Vector size: 384 (all-MiniLM-L6-v2)
 */
import { type SearchResult } from '../search.js';
export interface MemoryPoint {
    id: string;
    text: string;
    payload: {
        timestamp: number;
        source: string;
        importance?: number;
        tags?: string[];
        [key: string]: unknown;
    };
}
export interface MemoryResult extends SearchResult {
    payload: MemoryPoint['payload'];
}
declare function upsert(points: MemoryPoint[]): Promise<void>;
declare function searchMemories(query: string, topK?: number): Promise<MemoryResult[]>;
declare function deleteMemories(ids: string[]): Promise<void>;
declare function get(id: string): Promise<MemoryPoint['payload'] | null>;
export declare const memories: {
    upsert: typeof upsert;
    search: typeof searchMemories;
    delete: typeof deleteMemories;
    get: typeof get;
};
export {};
//# sourceMappingURL=memories.d.ts.map