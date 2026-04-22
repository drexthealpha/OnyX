/**
 * coder.ts — Executes a single plan step inside the sandbox.
 * Writes code, runs validation, returns result.
 *
 * Follows Open SWE's task execution pattern:
 * understand → implement → verify (run only related tests) → return result
 */

import type { PlanStep, StepResult, Sandbox } from '../types.js';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

interface ClaudeResponse {
  content: Array<{ type: string; text: string }>;
}

interface CodeAction {
  type: 'write_file' | 'exec_command' | 'done';
  path?: string;
  content?: string;
  command?: string;
  rationale?: string;
}

interface CodeResponse {
  actions: CodeAction[];
  summary: string;
}

async function callClaude(system: string, user: string, apiKey: string): Promise<string> {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error ${response.status}: ${await response.text()}`);
  }

  const data = (await response.json()) as ClaudeResponse;
  const block = data.content.find((b) => b.type === 'text');
  if (!block) throw new Error('No text in Claude response');
  return block.text;
}

const CODER_SYSTEM_PROMPT = `You are an expert software engineer implementing code changes.
Given a step description and context, produce the exact file changes needed.

Respond ONLY with valid JSON matching this schema:
{
  "actions": [
    { "type": "write_file", "path": "relative/path.ts", "content": "full file content here", "rationale": "why" },
    { "type": "exec_command", "command": "npm test -- --testPathPattern=foo", "rationale": "run related tests only" }
  ],
  "summary": "Brief summary of what was implemented"
}

Rules:
- Always write complete file contents, never partial diffs
- Only run tests directly related to files you changed (not full test suite)
- Use relative paths from repo root
- Prefer TypeScript
- Include proper error handling
- Never create backup files`;

/**
 * Execute one plan step inside the sandbox, writing code and running tests.
 *
 * @param step - The plan step to execute
 * @param sandbox - The Docker sandbox to execute in
 * @param repoContext - Optional existing file contents for context
 * @returns StepResult with success flag, changed files, and test output
 */
export async function executeStep(
  step: PlanStep,
  sandbox: Sandbox,
  repoContext?: Record<string, string>,
): Promise<StepResult> {
  const apiKey = process.env['ANTHROPIC_API_KEY'];
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY environment variable is required');

  // Build context from existing files the step will touch
  let contextSection = '';
  if (repoContext && step.filePaths.length > 0) {
    const relevantFiles = step.filePaths
      .filter((p) => repoContext[p])
      .map((p) => `### ${p}\n\`\`\`typescript\n${repoContext[p]}\n\`\`\``)
      .join('\n\n');
    if (relevantFiles) {
      contextSection = `\n\n## Existing File Context\n${relevantFiles}`;
    }
  }

  const userMessage = `Implement this step:

## Step
${step.description}

## Files to modify/create
${step.filePaths.join('\n') || 'TBD based on implementation'}

## Expected Changes
${step.expectedChanges}${contextSection}

Produce the complete implementation.`;

  const rawResponse = await callClaude(CODER_SYSTEM_PROMPT, userMessage, apiKey);
  const cleaned = rawResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  let codeResponse: CodeResponse;
  try {
    codeResponse = JSON.parse(cleaned) as CodeResponse;
  } catch {
    return {
      success: false,
      files: {},
      testOutput: '',
      error: `Failed to parse coder response: ${cleaned.slice(0, 200)}`,
    };
  }

  const writtenFiles: Record<string, string> = {};
  let testOutput = '';
  let lastExitCode = 0;

  // Execute actions in sequence
  for (const action of codeResponse.actions) {
    if (action.type === 'write_file' && action.path && action.content !== undefined) {
      try {
        await sandbox.writeFile(action.path, action.content);
        writtenFiles[action.path] = action.content;
      } catch (err) {
        return {
          success: false,
          files: writtenFiles,
          testOutput,
          error: `Failed to write ${action.path}: ${String(err)}`,
        };
      }
    } else if (action.type === 'exec_command' && action.command) {
      try {
        const result = await sandbox.exec(action.command, 120_000); // 2 min timeout
        testOutput += `$ ${action.command}\n${result.stdout}${result.stderr}\n`;
        lastExitCode = result.exitCode;
      } catch (err) {
        testOutput += `$ ${action.command}\nERROR: ${String(err)}\n`;
        lastExitCode = 1;
      }
    }
  }

  return {
    success: lastExitCode === 0,
    files: writtenFiles,
    testOutput: testOutput || 'No test commands executed',
    error: lastExitCode !== 0 ? `Command exited with code ${lastExitCode}` : undefined,
  };
}