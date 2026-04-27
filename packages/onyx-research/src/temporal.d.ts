import type { ScheduledJob } from "./types.js";
export declare function scheduleResearch(topic: string, deliverAt: Date): Promise<string>;
export declare function getScheduledJob(id: string): ScheduledJob | null;
export declare function listScheduledJobs(status?: ScheduledJob["status"]): ScheduledJob[];
export declare function runScheduledJobs(): Promise<void>;
export declare function startSchedulerWorker(): ReturnType<typeof setInterval>;
//# sourceMappingURL=temporal.d.ts.map