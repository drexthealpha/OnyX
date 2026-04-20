import { $ } from "bun";

export type SandboxResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
};

export async function runInSandbox(
  command: string,
  opts: { timeoutMs?: number } = {},
): Promise<SandboxResult> {
  const timeoutMs = opts.timeoutMs ?? 30_000;
  const containerName = `onyx-sandbox-${crypto.randomUUID().slice(0, 8)}`;
  try {
    const result = await Promise.race([
      $`docker run --rm --name ${containerName} --network none onyx-sandbox bash -c ${command}`.quiet(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Sandbox timeout after ${timeoutMs}ms`)), timeoutMs),
      ),
    ]);
    return {
      stdout: result.stdout.toString(),
      stderr: result.stderr.toString(),
      exitCode: result.exitCode,
    };
  } catch (err) {
    return {
      stdout: "",
      stderr: String(err),
      exitCode: 1,
    };
  }
}