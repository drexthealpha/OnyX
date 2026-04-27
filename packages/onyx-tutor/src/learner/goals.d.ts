import type { LearnerProfile } from '../types.ts';
export declare class GoalTracker {
    inferGoals(profile: LearnerProfile): string[];
    matchGoals(topic: string, goals: string[]): string[];
    suggestNextSteps(profile: LearnerProfile): string[];
}
//# sourceMappingURL=goals.d.ts.map