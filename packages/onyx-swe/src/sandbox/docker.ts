import Docker from 'dockerode';
import { Writable } from 'node:stream';
import type { Sandbox, SandboxResult } from '../types';

export class DockerSandbox implements Sandbox {
  private container!: Docker.Container;
  private docker: Docker;

  constructor() {
    this.docker = new Docker();
  }

  async run(code: string): Promise<SandboxResult> {
    const startTime = Date.now();
    try {
      this.container = await this.docker.createContainer({
        Image: 'node:20-slim',
        Cmd: ['node', '-e', code],
        Tty: false,
        HostConfig: {
          Memory: 128 * 1024 * 1024,
          CpuQuota: 50000,
          NetworkMode: 'none',
        },
      });

      await this.container.start();

      return new Promise((resolve, reject) => {
        const timeoutHandle = setTimeout(async () => {
          try {
            await this.container.stop();
            await this.container.remove();
          } catch (e) {
            console.warn('[onyx-swe] Cleanup error:', e);
          }
          resolve({
            id: this.container.id,
            output: '',
            error: 'Timeout: process exceeded 30s',
            exitCode: 124,
            duration: 30000,
          });
        }, 30000);

        this.container.attach({ stream: true, stdout: true, stderr: true }, (err, stream) => {
          if (err || !stream) {
            clearTimeout(timeoutHandle);
            return reject(err || new Error('[onyx-swe] Failed to attach'));
          }

          const stdoutBuffer: Buffer[] = [];
          const stderrBuffer: Buffer[] = [];

          const stdoutStream = new Writable({
            write(chunk, _enc, cb) {
              stdoutBuffer.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
              cb();
            }
          });
          const stderrStream = new Writable({
            write(chunk, _enc, cb) {
              stderrBuffer.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
              cb();
            }
          });

          this.docker.modem.demuxStream(stream, stdoutStream, stderrStream);

          stream.on('end', async () => {
            clearTimeout(timeoutHandle);
            const duration = Date.now() - startTime;
            const state = await this.container.inspect();
            try {
              await this.container.remove();
            } catch (e) {
              console.warn('[onyx-swe] Post-run cleanup error:', e);
            }
            resolve({
              id: this.container.id,
              output: Buffer.concat(stdoutBuffer).toString('utf8'),
              error: Buffer.concat(stderrBuffer).toString('utf8'),
              exitCode: state.State.ExitCode,
              duration,
            });
          });

          stream.on('error', (e) => {
            clearTimeout(timeoutHandle);
            reject(e);
          });
        });
      });
    } catch (error) {
      return {
        id: 'error',
        output: '',
        error: String(error),
        exitCode: 1,
        duration: Date.now() - startTime,
      };
    }
  }

  async exec(cmd: string, timeoutMs = 30000): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    if (!this.container) {
      // Lazy init if needed, but usually we'd expect it to be created via a factory
      throw new Error('[onyx-swe] Sandbox not initialized. Call run() or use a factory.');
    }

    const exec = await this.container.exec({
      Cmd: ['sh', '-c', cmd],
      AttachStdout: true,
      AttachStderr: true,
    });

    const stream = await exec.start({});
    const stdoutBuffer: Buffer[] = [];
    const stderrBuffer: Buffer[] = [];

    const stdoutStream = new Writable({ write(chunk, _enc, cb) { stdoutBuffer.push(chunk); cb(); } });
    const stderrStream = new Writable({ write(chunk, _enc, cb) { stderrBuffer.push(chunk); cb(); } });

    this.docker.modem.demuxStream(stream, stdoutStream, stderrStream);

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Exec timeout')), timeoutMs);
      stream.on('end', async () => {
        clearTimeout(timer);
        const inspect = await exec.inspect();
        resolve({
          stdout: Buffer.concat(stdoutBuffer).toString('utf8'),
          stderr: Buffer.concat(stderrBuffer).toString('utf8'),
          exitCode: inspect.ExitCode ?? 0,
        });
      });
      stream.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  async writeFile(path: string, content: string): Promise<void> {
    // Basic implementation using sh -c "printf ... > path"
    const escaped = content.replace(/'/g, "'\\''");
    await this.exec(`printf '%s' '${escaped}' > "${path}"`);
  }

  async readFile(path: string): Promise<string> {
    const res = await this.exec(`cat "${path}"`);
    if (res.exitCode !== 0) throw new Error(`Failed to read file: ${res.stderr}`);
    return res.stdout;
  }

  async destroy(): Promise<void> {
    if (this.container) {
      try {
        await this.container.stop();
        await this.container.remove();
      } catch (e) {
        // Ignore if already gone
      }
    }
  }
}

export function createSandbox(): Sandbox {
  return new DockerSandbox();
}