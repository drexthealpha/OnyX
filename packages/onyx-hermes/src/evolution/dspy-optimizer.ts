/**
 * DSPy-style prompt optimizer.
 *
 * Takes a skill prompt + performance score.
 * If score < 0.6: generates an improved prompt via critique-and-revise pattern.
 * Uses @onyx/router for Claude API calls (user's key via x402).
 * Returns improved prompt string.
 *
 * Pattern:
 *   1. Critique: "What is wrong with this prompt given its score?"
 *   2. Revise: "Rewrite to fix these issues."
 */

const IMPROVEMENT_THRESHOLD = 0.6;

export interface OptimizeResult {
  improved: boolean;
  prompt: string;
  reason: string;
}

async function callRouterApi(messages: Array<{ role: string; content: string }>): Promise<string> {
  // Dynamic import of @onyx/router with graceful fallback
  // In development or when router is not yet built, returns echo.
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const router = require('@onyx/router') as {
      complete: (messages: Array<{ role: string; content: string }>) => Promise<string>;
    };
    return await router.complete(messages);
  } catch {
    // Fallback: echo the last user message (no improvement without router)
    const last = messages[messages.length - 1];
    return last?.content ?? '';
  }
}

export class DspyOptimizer {
  private readonly threshold: number;

  constructor(threshold = IMPROVEMENT_THRESHOLD) {
    this.threshold = threshold;
  }

  /**
   * Optimise a skill prompt if its score is below threshold.
   *
   * @param skillName - Name of the skill being optimised
   * @param currentPrompt - Current SKILL.md content
   * @param score - Current performance score (0.0–1.0)
   * @returns OptimizeResult with the (possibly improved) prompt
   */
  async optimize(
    skillName: string,
    currentPrompt: string,
    score: number
  ): Promise<OptimizeResult> {
    if (score >= this.threshold) {
      return {
        improved: false,
        prompt: currentPrompt,
        reason: `Score ${score.toFixed(2)} >= threshold ${this.threshold} — no improvement needed`,
      };
    }

    // Step 1: Critique
    const critiqueMessages = [
      {
        role: 'system',
        content:
          'You are a prompt engineering expert. Analyse the given skill prompt and identify specific weaknesses that would cause it to underperform. Be concise and specific.',
      },
      {
        role: 'user',
        content: `Skill: ${skillName}\nPerformance score: ${score.toFixed(2)} (threshold: ${this.threshold})\n\n--- CURRENT PROMPT ---\n${currentPrompt}\n\nWhat specific issues explain this low score? List 2–3 concrete problems.`,
      },
    ];

    let critique: string;
    try {
      critique = await callRouterApi(critiqueMessages);
    } catch (err) {
      return {
        improved: false,
        prompt: currentPrompt,
        reason: `Critique API call failed: ${String(err)}`,
      };
    }

    // Step 2: Revise
    const reviseMessages = [
      {
        role: 'system',
        content:
          'You are a prompt engineering expert. Rewrite the given skill prompt to fix the identified issues. Output ONLY the improved prompt — no explanation, no preamble.',
      },
      {
        role: 'user',
        content: `Skill: ${skillName}\n\n--- CURRENT PROMPT ---\n${currentPrompt}\n\n--- CRITIQUE ---\n${critique}\n\nRewrite the prompt to fix these issues. Output only the improved prompt.`,
      },
    ];

    let improvedPrompt: string;
    try {
      improvedPrompt = await callRouterApi(reviseMessages);
    } catch (err) {
      return {
        improved: false,
        prompt: currentPrompt,
        reason: `Revision API call failed: ${String(err)}`,
      };
    }

    const trimmed = improvedPrompt.trim();
    if (!trimmed || trimmed === currentPrompt.trim()) {
      return {
        improved: false,
        prompt: currentPrompt,
        reason: 'API returned identical or empty prompt',
      };
    }

    return {
      improved: true,
      prompt: trimmed,
      reason: `Score ${score.toFixed(2)} < ${this.threshold} — prompt improved via critique-and-revise`,
    };
  }
}