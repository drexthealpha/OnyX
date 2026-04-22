import { compute as computeReward } from "./reward/model.js";
import { optimize as runGRPO } from "./optimizer/grpo.js";
import {
  loadUnprocessedTrajectories,
  markTrajectoryProcessed,
  savePolicyUpdate,
  countUnprocessedTrajectories,
} from "./db.js";
import type { PipelineResult } from "./types.js";

const PIPELINE_BATCH_SIZE = 100;
let _pipelineRunning = false;

/**
 * Check if we have reached the batch threshold and, if so, run the pipeline.
 * Called after each successful POST /capture.
 * Non-blocking — fires and forgets.
 */
export function maybeRunPipeline(): void {
  if (_pipelineRunning) return;
  const count = countUnprocessedTrajectories();
  if (count >= PIPELINE_BATCH_SIZE) {
    // Run asynchronously without blocking the HTTP response
    void runPipeline().catch(err => {
      console.error("[onyx-rl] Pipeline error:", err);
    });
  }
}

/**
 * Run the full reward → optimiser pipeline on unprocessed trajectories.
 */
export async function runPipeline(): Promise<PipelineResult> {
  _pipelineRunning = true;
  const ranAt = Date.now();

  try {
    // 1. Load unprocessed trajectories (up to 200 at a time)
    const trajectories = loadUnprocessedTrajectories();
    console.log(`[onyx-rl] Pipeline: processing ${trajectories.length} trajectories`);

    if (trajectories.length === 0) {
      return { processedCount: 0, rewards: [], update: { timestamp: ranAt, gradientSignal: 0, affectedSkills: [] }, ranAt };
    }

    // 2. Compute rewards
    const rewards = trajectories.map(t => computeReward(t));

    // 3. Run GRPO
    const update = runGRPO(trajectories, rewards);

    // 4. Save policy update
    savePolicyUpdate(update);

    // 5. Mark trajectories as processed
    for (const t of trajectories) {
      markTrajectoryProcessed(t.id);
    }

    console.log(
      `[onyx-rl] Pipeline complete: processed=${trajectories.length} ` +
      `gradientSignal=${update.gradientSignal.toFixed(4)} ` +
      `affectedSkills=${update.affectedSkills.join(",") || "none"}`
    );

    return { processedCount: trajectories.length, rewards, update, ranAt };
  } finally {
    _pipelineRunning = false;
  }
}