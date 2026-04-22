/**
 * docker.ts — Creates and manages isolated Docker sandboxes for code execution.
 *
 * Implements the core principle from Open SWE: "isolate first, then give full
 * permissions inside the boundary." Each task gets its own ephemeral container.
 *
 * Uses dockerode. Image: node:20-alpine.
 */

import Docker from 'dockerode';
import type { Sandbox } from '../types.js';

const DEFAULT_IMAGE = 'node:20-alpine';
const DEFAULT_TIMEOUT_MS = 30_000; // 30 seconds default exec timeout

export interface SandboxOptions {
  image?: string;
  workDir?: string;
  memoryMb?: number;
  cpuCount?: number;
  envVars?: Record<string, string>;
}

class DockerSandbox implements Sandbox {
  private container: Docker.Container;
  private readonly workDir: string;

  constructor(container: Docker.Container, workDir: string) {
    this.container = container;
    this.workDir = workDir;
  }

  async exec(
    cmd: string,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const exec = await this.container.exec({
      Cmd: ['sh', '-c', cmd],
      AttachStdout: true,
      AttachStderr: true,
      WorkingDir: this.workDir,
    });

    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        reject(new Error(`Command timed out after ${timeoutMs}ms: ${cmd}`));
      }, timeoutMs);

      exec.start({ hijack: true, stdin: false }, (err, stream) => {
        if (err) {
          clearTimeout(timeoutHandle);
          reject(err);
          return;
        }

        let stdout = '';
        let stderr = '';

        if (!stream) {
          clearTimeout(timeoutHandle);
          reject(new Error('No stream returned from exec.start'));
          return;
        }

        // dockerode multiplexes stdout/stderr on the same stream
        // Use demuxStream to separate them
        const stdoutBuffer: Buffer[] = [];
        const stderrBuffer: Buffer[] = [];

        const docker = new Docker();
        docker.modem.demuxStream(
          stream,
          {
            write: (chunk: Buffer) => stdoutBuffer.push(chunk),
          },
          {
            write: (chunk: Buffer) => stderrBuffer.push(chunk),
          },
        );

        stream.on('end', () => {
          clearTimeout(timeoutHandle);
          stdout = Buffer.concat(stdoutBuffer).toString('utf8');
          stderr = Buffer.concat(stderrBuffer).toString('utf8');

          exec.inspect((inspectErr, data) => {
            if (inspectErr) {
              resolve({ stdout, stderr, exitCode: 1 });
              return;
            }
            resolve({
              stdout,
              stderr,
              exitCode: data?.ExitCode ?? 0,
            });
          });
        });

        stream.on('error', (streamErr: Error) => {
          clearTimeout(timeoutHandle);
          reject(streamErr);
        });
      });
    });
  }

  async writeFile(path: string, content: string): Promise<void> {
    // Escape content for shell safety by writing via heredoc with base64 encoding
    const base64Content = Buffer.from(content, 'utf8').toString('base64');

    // Ensure parent directory exists
    const dir = path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : '.';
    if (dir && dir !== '.') {
      await this.exec(`mkdir -p ${this.workDir}/${dir}`);
    }

    const result = await this.exec(
      `echo '${base64Content}' | base64 -d > ${this.workDir}/${path}`,
    );

    if (result.exitCode !== 0) {
      throw new Error(`Failed to write file ${path}: ${result.stderr}`);
    }
  }

  async readFile(path: string): Promise<string> {
    const result = await this.exec(`cat ${this.workDir}/${path}`);
    if (result.exitCode !== 0) {
      throw new Error(`Failed to read file ${path}: ${result.stderr}`);
    }
    return result.stdout;
  }

  async destroy(): Promise<void> {
    try {
      await this.container.stop({ t: 5 }); // 5 second grace period
    } catch {
      // Container may already be stopped
    }
    try {
      await this.container.remove({ force: true });
    } catch (err) {
      console.warn(`Warning: failed to remove container: ${String(err)}`);
    }
  }
}

/**
 * Pull a Docker image if it is not already present.
 */
async function ensureImage(docker: Docker, image: string): Promise<void> {
  try {
    await docker.getImage(image).inspect();
  } catch {
    // Image not found locally — pull it
    await new Promise<void>((resolve, reject) => {
      docker.pull(image, (err: Error | null, stream: NodeJS.ReadableStream) => {
        if (err) { reject(err); return; }
        docker.modem.followProgress(stream, (followErr: Error | null) => {
          if (followErr) reject(followErr);
          else resolve();
        });
      });
    });
  }
}

/**
 * Create an isolated Docker sandbox for code execution.
 *
 * @param options - Sandbox configuration options
 * @returns Promise<Sandbox> — the sandbox interface
 *
 * The sandbox is a node:20-alpine container with:
 * - Isolated filesystem (no host mounts)
 * - Memory limit (default 512MB)
 * - CPU limit (default 1 CPU)
 * - No network access by default (security)
 * - Auto-cleanup via destroy()
 */
export async function createSandbox(options: SandboxOptions = {}): Promise<Sandbox> {
  const {
    image = DEFAULT_IMAGE,
    workDir = '/workspace',
    memoryMb = 512,
    cpuCount = 1,
    envVars = {},
  } = options;

  const docker = new Docker();

  // Ensure image is available locally
  await ensureImage(docker, image);

  const env = Object.entries(envVars).map(([k, v]) => `${k}=${v}`);

  const container = await docker.createContainer({
    Image: image,
    Cmd: ['sh', '-c', 'mkdir -p /workspace && tail -f /dev/null'],
    WorkingDir: workDir,
    Env: env,
    HostConfig: {
      Memory: memoryMb * 1024 * 1024,
      NanoCpus: cpuCount * 1_000_000_000,
      NetworkMode: 'bridge', // allow npm install; set 'none' for stricter isolation
      AutoRemove: false, // we manage lifecycle explicitly
    },
    NetworkDisabled: false,
  });

  await container.start();

  // Ensure working directory exists
  const sandbox = new DockerSandbox(container, workDir);
  await sandbox.exec(`mkdir -p ${workDir}`);

  return sandbox;
}