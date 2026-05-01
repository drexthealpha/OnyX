/**
 * onyx-hermes — Self-evolving skill improvement engine
 * Starts ACP HTTP server on port 5001 and exports all modules.
 */

export const NAME = 'onyx-hermes';

import { createAcpServer } from './acp/adapter';

const PORT = parseInt(process.env.HERMES_PORT ?? '5001', 10);

async function main(): Promise<void> {
  const app = createAcpServer();

  app.listen(PORT, () => {
    console.log(`[onyx-hermes] ACP server running on port ${PORT}`);
    console.log(`[onyx-hermes] POST /skill/:name — execute named skill`);
    console.log(`[onyx-hermes] GET  /skills     — list all skills`);
  });
}

main().catch((err) => {
  console.error('[onyx-hermes] Fatal startup error:', err);
  process.exit(1);
});

// Re-export all public modules
export { createAcpServer } from './acp/adapter';
export { authMiddleware } from './acp/auth';
export { skillEvents, SkillEventType } from './acp/events';
export { canExecuteSkill, grantSkillAccess, revokeSkillAccess } from './acp/permissions';
export { SessionManager } from './acp/session';
export { ToolRegistry } from './acp/tools';
export { ContextEngine } from './context/engine';
export { compress } from './context/compressor';
export { ReferenceTracker } from './context/references';
export { SkillMemoryManager } from './memory/manager';
export { MemoryProvider } from './memory/provider';
export { SmartRouter } from './routing/smart';
export { SkillMetadataStore } from './routing/metadata';
export { DspyOptimizer } from './evolution/dspy-optimizer';
export { GepaEvolution } from './evolution/gepa';
export { SkillImprover } from './evolution/skill-improver';
export { BenchmarkRunner } from './evolution/benchmark-runner';
export { PromptBuilder } from './prompt/builder';
export { PromptCache } from './prompt/caching';
export { CronScheduler } from './cron/scheduler';
export { registerCronJobs } from './cron/jobs';
export { recordTrajectory } from './trajectory';
export { extractInsights } from './insights';
export { PricingCalculator } from './usage/pricing';
export { RateLimiter } from './usage/rate-limit';