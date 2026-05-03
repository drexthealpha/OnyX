// Shared types for onyx-swe

export interface PlanStep {
  description: string;
  filePaths: string[];
  expectedChanges: string;
}

export interface Plan {
  steps: PlanStep[];
  estimatedMinutes: number;
}

export interface StepResult {
  success: boolean;
  files: Record<string, string>; // filePath → content
  testOutput: string;
  error?: string;
}

export interface GitHubIssue {
  number: number;
  title: string;
  body: string;
  owner: string;
  repo: string;
  url: string;
  labels: string[];
  author: string;
  createdAt: string;
  comments: Array<{
    author: string;
    body: string;
    createdAt: string;
  }>;
}

export interface Sandbox {
  exec(cmd: string, timeoutMs?: number): Promise<{ stdout: string; stderr: string; exitCode: number }>;
  writeFile(path: string, content: string): Promise<void>;
  readFile(path: string): Promise<string>;
  destroy(): Promise<void>;
}

export interface AdversarialResult {
  issues: string[];
  passed: boolean;
}

export interface PRInfo {
  url: string;
  number: number;
  branch: string;
}

export interface SandboxOptions {
  memoryLimitMb?: number;
  cpuQuota?: number;
  networkEnabled?: boolean;
}

export interface SandboxResult {
  id: string;
  output: string;
  error: string;
  exitCode: number;
  duration: number;
}