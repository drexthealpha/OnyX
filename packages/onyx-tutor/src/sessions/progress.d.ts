import type { ProgressRecord } from '../types.ts';
export declare class ProgressTracker {
    private db;
    constructor(dbPath?: string);
    private init;
    recordSession(record: Omit<ProgressRecord, 'sessionDate'>): void;
    getHistory(userId: string, limit?: number): ProgressRecord[];
    getStats(userId: string): {
        totalSessions: number;
        averageScore: number;
        domainsStudied: string[];
    };
    close(): void;
}
//# sourceMappingURL=progress.d.ts.map