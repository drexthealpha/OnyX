import { execute } from './executor.js';
import type { PipelineResult, StepFn, BranchCondition } from './context.js';

type StepDef =
  | { kind: 'step'; name: string; fn: StepFn }
  | { kind: 'branch'; condition: BranchCondition; pipeline: Pipeline }
  | { kind: 'approve'; prompt: string };

export class Pipeline {
  readonly steps: StepDef[] = [];

  step(name: string, fn: StepFn): this {
    this.steps.push({ kind: 'step', name, fn });
    return this;
  }

  branch(condition: BranchCondition, pipeline: Pipeline): this {
    this.steps.push({ kind: 'branch', condition, pipeline });
    return this;
  }

  approve(prompt: string): this {
    this.steps.push({ kind: 'approve', prompt });
    return this;
  }

  run(input: unknown): Promise<PipelineResult> {
    return execute(this, input);
  }
}