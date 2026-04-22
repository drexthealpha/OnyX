/**
 * tester.ts — Runs the test suite inside the sandbox.
 * Follows Open SWE's validation principle: only run tests related to
 * changed files; CI handles the full suite.
 */

import type { Sandbox } from '../types.js';

export interface TestResult {
  passed: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
  failingTests: string[];
}

/**
 * Detect the package manager and test framework used in the workspace.
 */
async function detectTestCommand(sandbox: Sandbox): Promise<string> {
  const packageJsonResult = await sandbox.exec('cat package.json 2>/dev/null || echo "{}"');
  const raw = packageJsonResult.stdout;

  let pkg: { scripts?: Record<string, string>; devDependencies?: Record<string, string> } = {};
  try {
    pkg = JSON.parse(raw) as typeof pkg;
  } catch {
    // Ignore parse errors
  }

  const scripts = pkg.scripts ?? {};
  const devDeps = pkg.devDependencies ?? {};

  // Prefer explicit test script
  if (scripts['test']) {
    // Detect bun vs npm
    const hasBun = await sandbox.exec('which bun 2>/dev/null');
    if (hasBun.exitCode === 0) return 'bun test';
    return 'npm test';
  }

  // Fallback by framework
  if (devDeps['vitest']) return 'npx vitest run';
  if (devDeps['jest']) return 'npx jest';
  if (devDeps['mocha']) return 'npx mocha';

  return 'npm test';
}

/**
 * Extract failing test names from output.
 */
function extractFailingTests(output: string): string[] {
  const failing: string[] = [];
  const patterns = [
    /✗\s+(.+)/g,                    // vitest
    /FAIL\s+(.+)/g,                  // jest
    /\d+\) (.+)/g,                   // mocha
    /not ok \d+ - (.+)/g,            // tap
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(output)) !== null) {
      failing.push(match[1]!.trim());
    }
  }

  return [...new Set(failing)]; // deduplicate
}

/**
 * Run the full test suite in the sandbox.
 *
 * @param sandbox - The Docker sandbox to run tests in
 * @param testPathPattern - Optional pattern to filter test files (e.g. "auth" runs auth.test.ts only)
 * @param timeoutMs - Maximum test run time in milliseconds (default 5 minutes)
 */
export async function runTestSuite(
  sandbox: Sandbox,
  testPathPattern?: string,
  timeoutMs: number = 300_000,
): Promise<TestResult> {
  const baseCmd = await detectTestCommand(sandbox);

  // Add path pattern if provided — avoids running the entire test suite
  let testCmd = baseCmd;
  if (testPathPattern) {
    if (baseCmd.includes('jest') || baseCmd.includes('vitest')) {
      testCmd = `${baseCmd} --testPathPattern="${testPathPattern}"`;
    } else if (baseCmd.includes('mocha')) {
      testCmd = `${baseCmd} --grep "${testPathPattern}"`;
    }
  }

  const start = Date.now();

  const result = await sandbox.exec(testCmd, timeoutMs);
  const duration = Date.now() - start;

  const combinedOutput = `${result.stdout}\n${result.stderr}`.trim();
  const failingTests = result.exitCode !== 0 ? extractFailingTests(combinedOutput) : [];

  return {
    passed: result.exitCode === 0,
    exitCode: result.exitCode,
    stdout: result.stdout,
    stderr: result.stderr,
    duration,
    failingTests,
  };
}