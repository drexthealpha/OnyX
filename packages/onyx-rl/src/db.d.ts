import Database from "better-sqlite3";
import type { Trajectory, OutcomeRecord, FeedbackRecord, PolicyUpdate } from "./types.js";
export declare const db: Database;
export declare function insertTrajectory(t: Trajectory): void;
export declare function getTrajectory(id: string): Trajectory | null;
export declare function loadUnprocessedTrajectories(): Trajectory[];
export declare function markTrajectoryProcessed(id: string): void;
export declare function countUnprocessedTrajectories(): number;
export declare function insertOutcome(o: OutcomeRecord): void;
export declare function getOutcome(trajectoryId: string): OutcomeRecord | null;
export declare function insertFeedback(f: FeedbackRecord): void;
export declare function getFeedback(trajectoryId: string): FeedbackRecord | null;
export declare function savePolicyUpdate(u: PolicyUpdate): void;
export declare function getSkillAverageReward(_skillName: string): number;
//# sourceMappingURL=db.d.ts.map