/**
 * reviewer.ts — Automated code review via Claude.
 * Inspired by Archon's archon-smart-pr-review which classifies complexity
 * then runs targeted review agents.
 */

import type { StepResult } from '../types.js';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

export interface ReviewResult {
  approved: boolean;
  comments: ReviewComment[];
  summary: string;
  severity: 'none' | 'minor' | 'major' | 'blocking';
}

export interface ReviewComment {
  file: string;
  line?: number;
  type: 'bug' | 'style' | 'performance' | 'security' | 'suggestion';
  message: string;
  severity: 'info' | 'warning' | 'error';
}

interface ClaudeResponse {
  content: Array<{ type: string; text: string }>;
}

interface RawReview {
  approved: boolean;
  comments: Array<{
    file: string;
    line?: number;
    type: string;
    message: string;
    severity: string;
  }>;
  summary: string;
  severity: string;
}

const REVIEWER_SYSTEM_PROMPT = `You are an expert code reviewer. Review the provided code changes
for bugs, security issues, performance problems, and style violations.

Respond ONLY with valid JSON matching this schema:
{
  "approved": true,
  "comments": [
    {
      "file": "src/foo.ts",
      "line": 42,
      "type": "bug|style|performance|security|suggestion",
      "message": "Clear description of the issue",
      "severity": "info|warning|error"
    }
  ],
  "summary": "Overall assessment",
  "severity": "none|minor|major|blocking"
}

Severity guidelines:
- none: No issues found, approve
- minor: Style/suggestion issues only, can approve
- major: Significant bugs or security issues, request changes
- blocking: Critical security vulnerabilities or data loss risks, reject`;

/**
 * Review code changes via Claude.
 *
 * @param stepResult - The result from executeStep containing changed files
 * @param context - Optional additional context (original issue, plan step)
 */
export async function reviewCode(
  stepResult: StepResult,
  context?: { issueTitle?: string; stepDescription?: string },
): Promise<ReviewResult> {
  const apiKey = process.env['ANTHROPIC_API_KEY'];
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY environment variable is required');

  if (Object.keys(stepResult.files).length === 0) {
    return {
      approved: true,
      comments: [],
      summary: 'No files changed — nothing to review',
      severity: 'none',
    };
  }

  const filesSection = Object.entries(stepResult.files)
    .map(([path, content]) => `### ${path}\n\`\`\`\n${content}\n\`\`\``)
    .join('\n\n');

  const contextSection = context
    ? `\n## Context\n${context.issueTitle ? `Issue: ${context.issueTitle}\n` : ''}${context.stepDescription ? `Step: ${context.stepDescription}\n` : ''}`
    : '';

  const userMessage = `Review these code changes:${contextSection}

## Changed Files
${filesSection}

## Test Output
\`\`\`
${stepResult.testOutput}
\`\`\`

Provide a thorough code review.`;

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      system: REVIEWER_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error ${response.status}: ${await response.text()}`);
  }

  const data = (await response.json()) as ClaudeResponse;
  const block = data.content.find((b) => b.type === 'text');
  if (!block) throw new Error('No text in Claude review response');

  const cleaned = block.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const raw = JSON.parse(cleaned) as RawReview;

  return {
    approved: raw.approved ?? false,
    comments: (raw.comments ?? []).map((c) => ({
      file: c.file,
      line: c.line,
      type: c.type as ReviewComment['type'],
      message: c.message,
      severity: c.severity as ReviewComment['severity'],
    })),
    summary: raw.summary ?? '',
    severity: raw.severity as ReviewResult['severity'],
  };
}