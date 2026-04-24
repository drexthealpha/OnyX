/// <reference types="node" />

declare module "process" {
  interface Process {
    env: Record<string, string | undefined>;
    exit(code?: number): never;
  }
  const process: Process;
  export = process;
}