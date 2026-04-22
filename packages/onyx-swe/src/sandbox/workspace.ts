/**
 * workspace.ts — Manages the workspace inside a sandbox.
 * Handles file tree operations, git setup, and npm install.
 *
 * Follows Open SWE's repository setup pattern:
 * clone → checkout branch → read AGENTS.md → begin work.
 */

import type { Sandbox } from '../types.js';

export interface WorkspaceInfo {
  repoPath: string;
  branch: string;
  hasAgentsMd: boolean;
  agentsMdContent: string | null;
}

export class WorkspaceManager {
  constructor(
    private readonly sandbox: Sandbox,
    private readonly workDir: string = '/workspace',
  ) {}

  /**
   * Clone a GitHub repository into the sandbox workspace.
   *
   * @param repoUrl - The repository URL (https or ssh)
   * @param branch - Branch to checkout (defaults to main)
   * @param token - GitHub token for private repos
   */
  async cloneRepo(repoUrl: string, branch = 'main', token?: string): Promise<string> {
    const authenticatedUrl = token
      ? repoUrl.replace('https://', `https://x-access-token:${token}@`)
      : repoUrl;

    // Extract repo name from URL
    const repoName = repoUrl.split('/').pop()?.replace('.git', '') ?? 'repo';
    const repoPath = `${this.workDir}/${repoName}`;

    // Clone with depth 1 for speed
    const cloneResult = await this.sandbox.exec(
      `git clone --depth 1 --branch ${branch} ${authenticatedUrl} ${repoPath}`,
      60_000,
    );

    if (cloneResult.exitCode !== 0) {
      // Try cloning default branch if specified branch fails
      const fallbackResult = await this.sandbox.exec(
        `git clone --depth 1 ${authenticatedUrl} ${repoPath}`,
        60_000,
      );
      if (fallbackResult.exitCode !== 0) {
        throw new Error(`Failed to clone repo: ${fallbackResult.stderr}`);
      }
    }

    return repoPath;
  }

  /**
   * Create and checkout a new branch for the task.
   */
  async createBranch(repoPath: string, branchName: string): Promise<void> {
    const result = await this.sandbox.exec(
      `cd ${repoPath} && git checkout -b ${branchName}`,
    );
    if (result.exitCode !== 0) {
      throw new Error(`Failed to create branch ${branchName}: ${result.stderr}`);
    }
  }

  /**
   * Read AGENTS.md if it exists — Open SWE's mandatory context injection step.
   * Returns null if AGENTS.md does not exist.
   */
  async readAgentsMd(repoPath: string): Promise<string | null> {
    const result = await this.sandbox.exec(`cat ${repoPath}/AGENTS.md 2>/dev/null`);
    if (result.exitCode !== 0 || !result.stdout.trim()) return null;
    return result.stdout;
  }

  /**
   * Install dependencies in the workspace.
   */
  async installDependencies(repoPath: string): Promise<void> {
    // Detect package manager
    const hasBun = await this.sandbox.exec('which bun 2>/dev/null');
    const hasPnpm = await this.sandbox.exec('which pnpm 2>/dev/null');
    const hasYarn = await this.sandbox.exec(`cat ${repoPath}/yarn.lock 2>/dev/null | head -1`);

    let installCmd: string;
    if (hasBun.exitCode === 0) {
      installCmd = `cd ${repoPath} && bun install`;
    } else if (hasPnpm.exitCode === 0) {
      installCmd = `cd ${repoPath} && pnpm install`;
    } else if (hasYarn.exitCode === 0) {
      installCmd = `cd ${repoPath} && yarn install`;
    } else {
      installCmd = `cd ${repoPath} && npm install`;
    }

    const result = await this.sandbox.exec(installCmd, 120_000);
    if (result.exitCode !== 0) {
      throw new Error(`Failed to install dependencies: ${result.stderr}`);
    }
  }

  /**
   * Initialize a complete workspace: clone, branch, read AGENTS.md, install deps.
   */
  async initialize(
    repoUrl: string,
    taskBranch: string,
    token?: string,
  ): Promise<WorkspaceInfo> {
    const repoPath = await this.cloneRepo(repoUrl, 'main', token);
    await this.createBranch(repoPath, taskBranch);
    const agentsMdContent = await this.readAgentsMd(repoPath);

    try {
      await this.installDependencies(repoPath);
    } catch (err) {
      console.warn(`Warning: dependency installation failed: ${String(err)}`);
    }

    return {
      repoPath,
      branch: taskBranch,
      hasAgentsMd: agentsMdContent !== null,
      agentsMdContent,
    };
  }

  /**
   * List files in the workspace (for context building).
   */
  async listFiles(repoPath: string, pattern = '**/*.ts'): Promise<string[]> {
    const result = await this.sandbox.exec(
      `find ${repoPath} -name "*.ts" -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null`,
    );
    if (result.exitCode !== 0) return [];
    return result.stdout
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((p) => p.replace(repoPath + '/', ''));
  }

  /**
   * Read multiple files into a context map.
   */
  async readFiles(repoPath: string, filePaths: string[]): Promise<Record<string, string>> {
    const context: Record<string, string> = {};
    for (const filePath of filePaths) {
      try {
        context[filePath] = await this.sandbox.readFile(`${repoPath}/${filePath}`);
      } catch {
        // File may not exist yet — skip
      }
    }
    return context;
  }

  /**
   * Git commit all changes in the workspace.
   */
  async commitChanges(repoPath: string, message: string): Promise<string> {
    await this.sandbox.exec(`cd ${repoPath} && git config user.email "onyx-swe@onyx.ai"`);
    await this.sandbox.exec(`cd ${repoPath} && git config user.name "ONYX SWE Agent"`);
    await this.sandbox.exec(`cd ${repoPath} && git add -A`);

    const result = await this.sandbox.exec(
      `cd ${repoPath} && git commit -m "${message.replace(/"/g, '\\"')}"`,
    );

    if (result.exitCode !== 0) {
      throw new Error(`Git commit failed: ${result.stderr}`);
    }

    // Return the commit SHA
    const shaResult = await this.sandbox.exec(`cd ${repoPath} && git rev-parse HEAD`);
    return shaResult.stdout.trim();
  }
}