export type StepFn = (input: unknown) => Promise<unknown>;
export type BranchCondition = (input: unknown) => boolean;

export interface StepResult {
  name: string;
  success: boolean;
  output: unknown;
  durationMs: number;
  error?: string;
}

export interface PipelineResult {
  success: boolean;
  output: unknown;
  steps: StepResult[];
  totalMs: number;
}

export interface PipelineContext {
  pipelineId: string;
  startedAt: number;
  env: Record<string, string | undefined>;
}