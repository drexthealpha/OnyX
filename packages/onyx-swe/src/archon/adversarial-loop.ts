/**
 * adversarial-loop.ts — Security and bug testing via Claude adversarial review.
 *
 * Inspired by Archon's archon-comprehensive-pr-review which runs 5 parallel
 * review agents then synthesizes findings. Here we use a single adversarial
 * reviewer with a focused "find everything wrong" system prompt.
 *
 * Also stores discovered bug patterns in @onyx/mem for continuous improvement —
 * patterns from past sessions are injected into future SWE sessions.
 */

import type { AdversarialResult } from '../types.js';
import { storeBugPattern } from '../memory/bug-patterns.js';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

interface ClaudeResponse {
  content: Array<{ type: string; text: string }>;
}

interface RawAdversarialResult {
  issues: Array<{
    type: string;
    severity: string;
    description: string;
    location?: string;
    recommendation?: string;
  }>;
  passed: boolean;
  summary: string;
}

// Adversarial system prompt — the core of the loop
const ADVERSARIAL_SYSTEM_PROMPT = `You are a security researcher and bug finder.
Find all bugs, security issues, and edge cases in this code. Be thorough and critical.

Look for:
- Security vulnerabilities (injection, path traversal, prototype pollution, ReDoS, SSRF)
- Logic errors and off-by-one errors
- Null/undefined dereferences and missing null checks
- Race conditions and concurrency issues
- Memory leaks and resource leaks
- Incorrect error handling (errors swallowed silently)
- Type coercion bugs
- Integer overflow/underflow
- Improper input validation
- Insecure use of cryptography
- Hardcoded secrets or credentials
- Dangerous eval() or dynamic code execution
- Missing authentication/authorization checks
- Broken promise chains and unhandled rejections
- Edge cases: empty inputs, very long inputs, special characters, Unicode

Respond ONLY with valid JSON matching this schema:
{
  "issues": [
    {
      "type": "security|logic|null_deref|race|memory|error_handling|type|validation|other",
      "severity": "critical|high|medium|low|info",
      "description": "Clear description of the issue",
      "location": "function name or line hint",
      "recommendation": "How to fix it"
    }
  ],
  "passed": false,
  "summary": "Overall security assessment"
}

If no issues found, return an empty issues array and set passed: true.
Be critical — finding zero issues in real-world code is rare.`;

/**
 * Run adversarial testing on code — finds bugs and security issues.
 *
 * @param code - The code to test (single file or concatenated files)
 * @param context - Optional context (e.g. "This is a GitHub PR creator")
 * @returns AdversarialResult with issues list and passed flag
 *
 * Automatically stores discovered bug patterns in @onyx/mem for future sessions.
 */
export async function adversarialTest(
  code: string,
  context?: string,
): Promise<AdversarialResult> {
  const apiKey = process.env['ANTHROPIC_API_KEY'];
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY environment variable is required');

  const contextSection = context ? `\n\n## Context\n${context}` : '';

  const userMessage = `Perform a thorough security and bug review of this code:${contextSection}

\`\`\`typescript
${code}
\`\`\`

Find every bug, security issue, and edge case. Be exhaustive and critical.`;

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 3000,
      system: ADVERSARIAL_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error ${response.status}: ${await response.text()}`);
  }

  const data = (await response.json()) as ClaudeResponse;
  const block = data.content.find((b) => b.type === 'text');
  if (!block) throw new Error('No text in adversarial review response');

  const cleaned = block.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  let raw: RawAdversarialResult;
  try {
    raw = JSON.parse(cleaned) as RawAdversarialResult;
  } catch {
    // Partial parse failure — treat as issues found
    return {
      issues: [`Failed to parse adversarial review response: ${cleaned.slice(0, 200)}`],
      passed: false,
    };
  }

  const issueDescriptions = raw.issues.map(
    (i) =>
      `[${i.severity.toUpperCase()}] ${i.type}: ${i.description}${i.recommendation ? ` — Fix: ${i.recommendation}` : ''}`,
  );

  // Store high/critical issues as bug patterns in memory for future sessions
  const criticalIssues = raw.issues.filter(
    (i) => i.severity === 'critical' || i.severity === 'high',
  );

  for (const issue of criticalIssues) {
    try {
      await storeBugPattern(
        `${issue.type}: ${issue.description}`,
        context ?? 'adversarial-loop',
      );
    } catch {
      // Memory storage failure should not break the main flow
    }
  }

  return {
    issues: issueDescriptions,
    passed: raw.passed && raw.issues.length === 0,
  };
}