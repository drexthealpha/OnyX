export interface Source {
    platform: string;
    title: string;
    url: string;
    score: number;
    snippet: string;
    engagement?: number;
    publishedAt?: number;
}
export interface IntelBrief {
    topic: string;
    brief: string;
    sources: Source[];
    timestamp: number;
    confidence: number;
}
export interface CacheRow {
    topic: string;
    brief_json: string;
    created_at: number;
}
//# sourceMappingURL=types.d.ts.map