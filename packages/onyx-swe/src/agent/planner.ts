/**
 * planner.ts — Takes a GitHub issue URL, fetches the issue via GitHub REST API,
 * then calls the Claude API (user-provided key) to generate a 3-5 step implementation plan.
 *
 * Inspired by Open SWE's context engineering: rich source context (full issue body +
 * comments) is assembled first, then passed to the LLM rather than relying on tool calls
 * for discovery.
 */

import { fetchIssue } from '../github/issues.js';
import type { Plan, PlanStep } from '../types.js';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeResponse {
  content: Array<{ type: string; text: string }>;
}

interface RawPlan {
  steps: Array<{
    description: string;
    filePaths: string[];
    expectedChanges: string;
  }>;
  estimatedMinutes: number;
}

async function callClaude(
  systemPrompt: string,
  userMessage: string,
  apiKey: string,
): Promise<string> {
  const messages: ClaudeMessage[] = [{ role: 'user', content: userMessage }];

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
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error ${response.status}: ${error}`);
  }

  const data = (await response.json()) as ClaudeResponse;
  const textBlock = data.content.find((b) => b.type === 'text');
  if (!textBlock) throw new Error('No text block in Claude response');
  return textBlock.text;
}

function parsePlan(raw: string): Plan {
  // Strip markdown fences if present
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  let parsed: RawPlan;
  try {
    parsed = JSON.parse(cleaned) as RawPlan;
  } catch {
    throw new Error(`Failed to parse plan JSON: ${cleaned.slice(0, 200)}`);
  }

  if (!Array.isArray(parsed.steps) || parsed.steps.length === 0) {
    throw new Error('Plan must contain at least one step');
  }

  const steps: PlanStep[] = parsed.steps.map((s, i) => {
    if (!s.description) throw new Error(`Step ${i} missing description`);
    return {
      description: s.description,
      filePaths: Array.isArray(s.filePaths) ? s.filePaths : [],
      expectedChanges: s.expectedChanges ?? '',
    };
  });

  return {
    steps,
    estimatedMinutes: typeof parsed.estimatedMinutes === 'number' ? parsed.estimatedMinutes : 30,
  };
}

const PLANNER_SYSTEM_PROMPT = `You are an expert software engineer creating implementation plans.
Given a GitHub issue, produce a clear, actionable implementation plan with 3-5 steps.

Respond ONLY with valid JSON. No preamble, no markdown explanation, no code fences.
The JSON must match this exact schema:
{
  "steps": [
    {
      "description": "What to do in this step (clear, actionable)",
      "filePaths": ["path/to/file.ts", "path/to/other.ts"],
      "expectedChanges": "What changes will be made and why"
    }
  ],
  "estimatedMinutes": 45
}

Rules:
- 3 to 5 steps maximum
- Each step should be independently executable
- filePaths should be relative to the repo root
- estimatedMinutes should be a realistic total estimate
- Steps flow logically: understand → implement → test → document/cleanup`;

/**
 * Plan an implementation from a GitHub issue URL.
 *
 * @param issueUrl - Full GitHub issue URL, e.g. https://github.com/owner/repo/issues/42
 * @returns Promise<Plan> with 3-5 steps and time estimate
 *
 * Required env vars:
 *   GITHUB_TOKEN — user-provided GitHub personal access token
 *   ANTHROPIC_API_KEY — user-provided Claude API key
 */
export async function planFromIssue(issueUrl: string): Promise<Plan> {
  const githubToken = process.env['GITHUB_TOKEN'];
  const anthropicKey = process.env['ANTHROPIC_API_KEY'];

  if (!githubToken) throw new Error('GITHUB_TOKEN environment variable is required');
  if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY environment variable is required');

  // Fetch the full issue context (title + body + comments) — Open SWE pattern:
  // assemble rich source context before any LLM call
  const issue = await fetchIssue(issueUrl);

  const commentsSection =
    issue.comments.length > 0
      ? '\n\n## Comments\n' +
        issue.comments
          .map((c) => `**${c.author}** (${c.createdAt}):\n${c.body}`)
          .join('\n\n---\n\n')
      : '';

  const userMessage = `Please create an implementation plan for this GitHub issue:

## Repository
${issue.owner}/${issue.repo}

## Issue #${issue.number}: ${issue.title}
Labels: ${issue.labels.join(', ') || 'none'}
Author: ${issue.author}
Created: ${issue.createdAt}

## Description
${issue.body}${commentsSection}

Create a focused 3-5 step implementation plan.`;

  const rawResponse = await callClaude(PLANNER_SYSTEM_PROMPT, userMessage, anthropicKey);
  const plan = parsePlan(rawResponse);

  // Enforce 3-5 step constraint
  if (plan.steps.length < 3 || plan.steps.length > 5) {
    throw new Error(
      `Plan must have 3-5 steps, got ${plan.steps.length}`,
    );
  }

  return plan;
}