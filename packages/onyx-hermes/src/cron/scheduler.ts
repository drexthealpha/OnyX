/**
 * Cron scheduler — wraps node-cron with typed job registration.
 * All jobs are registered at startup and run unattended.
 */

import cron, { ScheduledTask } from 'node-cron';

export interface CronJob {
  name: string;
  schedule: string; // cron expression
  handler: () => Promise<void> | void;
  runImmediately?: boolean;
}

export class CronScheduler {
  private readonly tasks = new Map<string, ScheduledTask>();

  /** Register and start a cron job. */
  register(job: CronJob): void {
    if (this.tasks.has(job.name)) {
      console.warn(`[cron] Job "${job.name}" already registered — skipping duplicate`);
      return;
    }

    if (!cron.validate(job.schedule)) {
      throw new Error(`[cron] Invalid schedule for job "${job.name}": "${job.schedule}"`);
    }

    const task = cron.schedule(job.schedule, async () => {
      try {
        console.log(`[cron] Running job: ${job.name}`);
        await job.handler();
        console.log(`[cron] Job complete: ${job.name}`);
      } catch (err) {
        console.error(`[cron] Job "${job.name}" failed:`, err);
      }
    });

    this.tasks.set(job.name, task);

    if (job.runImmediately) {
      void Promise.resolve().then(() => job.handler()).catch((err) => {
        console.error(`[cron] Immediate run of "${job.name}" failed:`, err);
      });
    }
  }

  /** Stop and remove a job. */
  unregister(name: string): void {
    const task = this.tasks.get(name);
    if (task) {
      task.stop();
      this.tasks.delete(name);
    }
  }

  /** Stop all jobs. */
  stopAll(): void {
    for (const [, task] of this.tasks) {
      task.stop();
    }
    this.tasks.clear();
  }

  /** List registered job names. */
  listJobs(): string[] {
    return Array.from(this.tasks.keys());
  }
}