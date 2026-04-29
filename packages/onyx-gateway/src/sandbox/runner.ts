import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export type SandboxResult = { stdout: string; stderr: string; exitCode: number };

export async function runInSandbox(command: string, opts: { timeoutMs?: number } = {}): Promise<SandboxResult> {
  const timeoutMs = opts.timeoutMs ?? 30_000;
  const containerName = `onyx-sandbox-${crypto.randomUUID().slice(0, 8)}`;
  try {
    const result = await Promise.race([
      execAsync(`docker run --rm --name ${containerName} --network none onyx-sandbox bash -c "${command}"`),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`Sandbox timeout after ${timeoutMs}ms`)), timeoutMs)),
    ]);
    return { stdout: result.stdout, stderr: result.stderr, exitCode: 0 };
  } catch (err: any) {
    return { stdout: "", stderr: String(err), exitCode: 1 };
  }
}