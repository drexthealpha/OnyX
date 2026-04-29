import type { PipelineResult } from "./types.js";
/**
 * Check if we have reached the batch threshold and, if so, run the pipeline.
 * Called after each successful POST /capture.
 * Non-blocking — fires and forgets.
 */
export declare function maybeRunPipeline(): void;
/**
 * Run the full reward → optimiser pipeline on unprocessed trajectories.
 */
export declare function runPipeline(): Promise<PipelineResult>;
//# sourceMappingURL=pipeline.d.ts.map