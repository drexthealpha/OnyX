/**
 * Registered cron jobs for onyx-hermes.
 * - Weekly GEPA tournament (Sunday 02:00 UTC)
 * - Daily memory purge (01:00 UTC)
 * - Hourly benchmark (if benchmark cases configured)
 */

import { CronScheduler } from './scheduler';
import { GepaEvolution } from '../evolution/gepa';
import { SkillMemoryManager } from '../memory/manager';
import { skillEvents, SkillEventType } from '../acp/events';

const gepa = new GepaEvolution();
const memory = new SkillMemoryManager();

export function registerCronJobs(scheduler: CronScheduler): void {

  // Weekly GEPA tournament — every Sunday at 02:00 UTC
  scheduler.register({
    name: 'gepa-weekly-tournament',
    schedule: '0 2 * * 0',
    handler: async () => {
      const skills = gepa.listSkills();
      console.log(`[gepa] Running weekly tournament for ${skills.length} skills`);

      for (const skillName of skills) {
        try {
          await gepa.runTournament(skillName);
          skillEvents.emit(SkillEventType.GEPA_GENERATION, { skillName });
          console.log(`[gepa] Tournament complete for: ${skillName}`);
        } catch (err) {
          console.error(`[gepa] Tournament failed for ${skillName}:`, err);
        }
      }
    },
  });

  // Daily memory purge — every day at 01:00 UTC (remove scores older than 30 days)
  scheduler.register({
    name: 'memory-daily-purge',
    schedule: '0 1 * * *',
    handler: () => {
      const removed = memory.purgeOld();
      console.log(`[memory] Purged ${removed} old score records`);
    },
  });

  // Monthly GEPA population health check — first day of each month at 03:00 UTC
  scheduler.register({
    name: 'gepa-population-health',
    schedule: '0 3 1 * *',
    handler: async () => {
      const skills = gepa.listSkills();
      for (const skillName of skills) {
        const variants = gepa.getVariants(skillName);
        console.log(`[gepa] ${skillName}: ${variants.length} variants, top score: ${variants[0]?.score.toFixed(3) ?? 'none'}`);
      }
    },
  });
}