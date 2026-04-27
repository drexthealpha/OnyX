import type { LearnerProfile } from '../types.ts';
export declare class ProfileStore {
    private db;
    constructor(dbPath?: string);
    private init;
    getProfile(userId: string): LearnerProfile;
    private upsert;
    updateFromQuiz(userId: string, domain: string, score: number): void;
    setGoal(userId: string, goal: string): void;
    setStyle(userId: string, style: LearnerProfile['style']): void;
    setPreference(userId: string, key: string, value: string): void;
    close(): void;
}
//# sourceMappingURL=profile.d.ts.map