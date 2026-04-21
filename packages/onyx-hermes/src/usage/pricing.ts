/**
 * Token cost tracking.
 * Maintains per-skill, per-session token usage and estimates USD cost.
 */

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
}

export interface CostEstimate {
  inputCostUsd: number;
  outputCostUsd: number;
  totalCostUsd: number;
  model: string;
}

// Pricing table (USD per million tokens) — matches upstream Hermes pricing data
const PRICING_TABLE: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-20250514': { input: 3.0, output: 15.0 },
  'claude-opus-4-20250514': { input: 15.0, output: 75.0 },
  'gpt-4o': { input: 2.5, output: 10.0 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4.1': { input: 2.0, output: 8.0 },
  'deepseek-chat': { input: 0.14, output: 0.28 },
  'gemini-2.5-pro': { input: 1.25, output: 10.0 },
  'gemini-2.5-flash': { input: 0.15, output: 0.6 },
  default: { input: 1.0, output: 4.0 },
};

export class PricingCalculator {
  private readonly sessionUsage = new Map<string, TokenUsage>();
  private readonly skillUsage = new Map<string, TokenUsage>();

  /** Record token usage for a session and skill. */
  record(sessionId: string, skillName: string, usage: TokenUsage): void {
    this.accumulate(this.sessionUsage, sessionId, usage);
    this.accumulate(this.skillUsage, skillName, usage);
  }

  /** Estimate cost for a given usage and model. */
  estimate(usage: TokenUsage, model: string): CostEstimate {
    const pricing = PRICING_TABLE[model] ?? PRICING_TABLE['default']!;
    const inputCostUsd = (usage.inputTokens / 1_000_000) * pricing.input;
    const outputCostUsd = (usage.outputTokens / 1_000_000) * pricing.output;
    return {
      inputCostUsd,
      outputCostUsd,
      totalCostUsd: inputCostUsd + outputCostUsd,
      model,
    };
  }

  /** Get cumulative usage for a session. */
  getSessionUsage(sessionId: string): TokenUsage {
    return this.sessionUsage.get(sessionId) ?? this.emptyUsage();
  }

  /** Get cumulative usage for a skill. */
  getSkillUsage(skillName: string): TokenUsage {
    return this.skillUsage.get(skillName) ?? this.emptyUsage();
  }

  private accumulate(map: Map<string, TokenUsage>, key: string, usage: TokenUsage): void {
    const existing = map.get(key) ?? this.emptyUsage();
    map.set(key, {
      inputTokens: existing.inputTokens + usage.inputTokens,
      outputTokens: existing.outputTokens + usage.outputTokens,
      cacheReadTokens: existing.cacheReadTokens + usage.cacheReadTokens,
      cacheWriteTokens: existing.cacheWriteTokens + usage.cacheWriteTokens,
    });
  }

  private emptyUsage(): TokenUsage {
    return { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 };
  }
}