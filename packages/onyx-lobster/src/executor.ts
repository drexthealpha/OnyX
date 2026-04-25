import type { Pipeline } from './pipeline.js';
import type { PipelineResult, StepResult } from './context.js';

const KERNEL_URL = process.env.KERNEL_URL ?? 'http://localhost:3000';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

async function phaseLog(stepName: string, status: 'start' | 'end' | 'error', ms?: number): Promise<void> {
  try {
    await fetch(`${KERNEL_URL}/phase-table`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phase: 'lobster', stepName, status, ms }),
    });
  } catch {
    // kernel logging is best-effort; never block the pipeline
  }
}

async function registerAbort(stepName: string, reason: string): Promise<void> {
  try {
    await fetch(`${KERNEL_URL}/alarm-and-abort`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stepName, reason }),
    });
  } catch {
    // best-effort
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function execute(pipeline: Pipeline, input: unknown): Promise<PipelineResult> {
  const startAll = Date.now();
  const stepResults: StepResult[] = [];
  let current = input;

  for (const def of pipeline.steps) {
    if (def.kind === 'branch') {
      if (def.condition(current)) {
        const branchResult = await execute(def.pipeline, current);
        if (!branchResult.success) {
          return {
            success: false,
            output: branchResult.output,
            steps: [...stepResults, ...branchResult.steps],
            totalMs: Date.now() - startAll,
          };
        }
        stepResults.push(...branchResult.steps);
        current = branchResult.output;
      }
      // else: pass through unchanged
      continue;
    }

    if (def.kind === 'approve') {
      const stepStart = Date.now();
      const name = `approve:${def.prompt.slice(0, 40)}`;
      await phaseLog(name, 'start');
      try {
        const gateway = await import('@onyx/gateway');
        await gateway.sendMessage('approval', def.prompt);
        const reply = await gateway.waitForReply('approval');
        if (!/^y(es)?$/i.test(String(reply).trim())) {
          throw new Error('Not approved');
        }
        const ms = Date.now() - stepStart;
        await phaseLog(name, 'end', ms);
        stepResults.push({ name, success: true, output: current, durationMs: ms });
      } catch (err: unknown) {
        const ms = Date.now() - stepStart;
        await phaseLog(name, 'error', ms);
        stepResults.push({ name, success: false, output: null, durationMs: ms, error: String(err) });
        return { success: false, output: null, steps: stepResults, totalMs: Date.now() - startAll };
      }
      continue;
    }

    // kind === 'step'
    const { name, fn } = def;
    await phaseLog(name, 'start');
    const stepStart = Date.now();
    let lastErr: unknown;
    let succeeded = false;
    let result: unknown;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        result = await fn(current);
        succeeded = true;
        break;
      } catch (err: unknown) {
        lastErr = err;
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS);
        }
      }
    }

    const durationMs = Date.now() - stepStart;

    if (!succeeded) {
      await phaseLog(name, 'error', durationMs);
      await registerAbort(name, String(lastErr));
      stepResults.push({ name, success: false, output: null, durationMs, error: String(lastErr) });
      throw new Error(`Step "${name}" failed after ${MAX_RETRIES} attempts: ${String(lastErr)}`);
    }

    await phaseLog(name, 'end', durationMs);
    stepResults.push({ name, success: true, output: result, durationMs });
    current = result;
  }

  return {
    success: true,
    output: current,
    steps: stepResults,
    totalMs: Date.now() - startAll,
  };
}