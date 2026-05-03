/**
 * Collection: onyx_documents
 * Stores ingested documents — PDFs, web pages, pastes, files.
 *
 * Vector size: 384 (all-MiniLM-L6-v2)
 */
import { type SearchResult } from '../search.js';
export interface DocumentPoint {
    id: string;
    text: string;
    payload: {
        timestamp: number;
        title: string;
        url?: string;
        mimeType?: string;
        chunkIndex?: number;
        totalChunks?: number;
        [key: string]: unknown;
    };
}
export interface DocumentResult extends SearchResult {
    payload: DocumentPoint['payload'];
}
declare function upsert(points: DocumentPoint[]): Promise<void>;
declare function searchDocuments(query: string, topK?: number): Promise<DocumentResult[]>;
declare function deleteDocuments(ids: string[]): Promise<void>;
declare function get(id: string): Promise<DocumentPoint['payload'] | null>;
export declare const documents: {
    upsert: typeof upsert;
    search: typeof searchDocuments;
    delete: typeof deleteDocuments;
    get: typeof get;
};
export {};
//# sourceMappingURL=documents.d.ts.map