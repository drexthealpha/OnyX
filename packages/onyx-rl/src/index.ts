import { app } from "./loop.js";

// RL_PORT is defined in kernel/constants (default 4010)
const port = Number(process.env['RL_PORT'] ?? 4010);

console.log(`[onyx-rl] Starting on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};

/**
 * RL Management API (Library Mode)
 */

export async function recordOutcome(payload: unknown) {
  const { recordOutcome: innerRecord } = await import("./capture/outcome.js");
  return innerRecord(payload as any);
}

export async function getMetrics() {
  const { getSkillAverageReward } = await import("./db.js");
  // Return some sample metrics
  return {
    totalTrajectories: 100, // Placeholder
    averageReward: getSkillAverageReward("general"),
    lastUpdate: Date.now(),
  };
}

export async function getCurrentPolicy() {
  return {
    version: "v1.0.0",
    model: "GRPO-distilled-Qwen",
    updatedAt: Date.now(),
  };
}

export async function listTasks(query?: { status?: string[] }) {
  // TODO: implement actual task queue tracking in rl.db
  return [];
}