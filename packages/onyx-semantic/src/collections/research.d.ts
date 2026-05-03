/**
 * Collection: onyx_research
 * Stores research artefacts — summaries, citations, findings.
 *
 * Vector size: 384 (all-MiniLM-L6-v2)
 */
import { type SearchResult } from '../search.js';
export interface ResearchPoint {
    id: string;
    text: string;
    payload: {
        timestamp: number;
        query: string;
        source: string;
        confidence?: number;
        citations?: string[];
        [key: string]: unknown;
    };
}
export interface ResearchResult extends SearchResult {
    payload: ResearchPoint['payload'];
}
declare function upsert(points: ResearchPoint[]): Promise<void>;
declare function searchResearch(query: string, topK?: number): Promise<ResearchResult[]>;
declare function deleteResearch(ids: string[]): Promise<void>;
declare function get(id: string): Promise<ResearchPoint['payload'] | null>;
export declare const research: {
    upsert: typeof upsert;
    search: typeof searchResearch;
    delete: typeof deleteResearch;
    get: typeof get;
};
export {};
//# sourceMappingURL=research.d.ts.map