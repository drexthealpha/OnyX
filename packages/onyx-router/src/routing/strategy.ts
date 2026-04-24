/**
 * @onyx/router — Routing Strategy
 *
 * Selects the cheapest qualifying provider for a given prompt + budget.
 * Mirrors ClawRouter's 4-tier SIMPLE/MEDIUM/COMPLEX/REASONING classification
 * but adapted for @onyx/router's Provider registry.
 *
 * Algorithm:
 *   1. Classify request into a RoutingTier via keyword heuristics
 *   2. Filter providers: must support all required capabilities
 *   3. Filter by maxCostPerRequest budget cap
 *   4. Filter by latency if preferLowLatency
 *   5. Return cheapest qualifying provider (by blended cost)
 */

import type { Provider, BudgetCap, RoutingDecision, RoutingTier } from "../types.js";
import { PROVIDERS, estimateCostUSD } from "./providers.js";

// ─── Tier Classification ─────────────────────────────────────────────────────

const REASONING_KEYWORDS = [
  "prove", "theorem", "derivation", "math", "calculate", "solve",
  "algorithm", "optimize", "formal", "logic", "reasoning", "infer",
  "deduce", "hypothesis", "proof", "differential", "integral", "equation",
  "probability", "statistical", "bayesian", "step by step",
];

const COMPLEX_KEYWORDS = [
  "analyze", "architecture", "design", "refactor", "debug", "implement",
  "explain in detail", "compare", "evaluate", "critique", "summarize",
  "translate", "write code", "function", "class", "api", "database",
  "system", "codebase", "complex", "difficult", "comprehensive",
];

const SIMPLE_KEYWORDS = [
  "hello", "hi", "thanks", "what is", "define", "explain briefly",
  "short", "quick", "simple", "yes or no", "list", "name", "when",
  "who", "where", "how many", "capital", "city", "country",
];

// Simple helper: check if text contains keyword (more relaxed matching)
function containsKeyword(text: string, keywords: string[]): boolean {
  return keywords.some(kw => text.includes(kw));
}

/**
 * Classify a prompt into one of four routing tiers.
 */
export function classifyTier(prompt: string, systemPrompt?: string): RoutingTier {
  const text = `${systemPrompt ?? ""} ${prompt}`.toLowerCase();
  const words = text.split(/\s+/);
  const tokenEstimate = Math.ceil(text.length / 4);

  // Force COMPLEX for very long inputs
  if (tokenEstimate > 8000) return "COMPLEX";

  // Score via keyword matching
  let reasoningScore = 0;
  let complexScore = 0;
  let simpleScore = 0;

  for (const kw of REASONING_KEYWORDS) {
    if (containsKeyword(text, [kw])) reasoningScore += 2;
  }
  for (const kw of COMPLEX_KEYWORDS) {
    if (containsKeyword(text, [kw])) complexScore += 1;
  }
  for (const kw of SIMPLE_KEYWORDS) {
    if (containsKeyword(text, [kw])) simpleScore += 1;
  }

  // Code block heuristic
  if (text.includes("```") || text.includes("function") || text.includes("class ")) {
    complexScore += 2;
  }

  // Prioritize complex/reasoning over simple for substantive queries
  if (complexScore >= 2) return "COMPLEX";
  if (reasoningScore >= 3) return "REASONING";
  if (tokenEstimate > 2000) return "COMPLEX";

  // Very short factual questions = SIMPLE
  if (words.length < 6 || tokenEstimate < 50) {
    if (simpleScore > 0 || words.length < 4) return "SIMPLE";
  }

  if (simpleScore >= 2 && complexScore === 0) return "SIMPLE";

  return "MEDIUM"; // safe default
}

/**
 * Route a prompt to the cheapest qualifying provider within budget.
 *
 * @param prompt      User message
 * @param budget      Per-request and daily/monthly caps
 * @param options     Optional capability requirements and latency preference
 */
export function routeRequest(
  prompt: string,
  budget: BudgetCap,
  options: {
    systemPrompt?: string;
    maxOutputTokens?: number;
    requiresVision?: boolean;
    requiresTools?: boolean;
    requiresReasoning?: boolean;
    requiresStreaming?: boolean;
    preferLowLatency?: boolean;
  } = {},
): RoutingDecision {
  const tier = classifyTier(prompt, options.systemPrompt);
  const inputTokenEstimate = Math.ceil((prompt.length + (options.systemPrompt?.length ?? 0)) / 4);
  const outputTokenEstimate = options.maxOutputTokens ?? 1000;

  // Build capability requirements
  const requiredCaps: string[] = [];
  if (options.requiresVision) requiredCaps.push("vision");
  if (options.requiresTools) requiredCaps.push("tools");
  if (options.requiresReasoning) requiredCaps.push("reasoning");

  // Filter: capability support
  let candidates = PROVIDERS.filter((p) => {
    if (options.requiresVision && !p.supportsVision) return false;
    if (options.requiresTools && !p.supportsTools) return false;
    if (options.requiresReasoning && !p.supportsReasoning) return false;
    if (options.requiresStreaming && !p.supportsStreaming) return false;
    return true;
  });

  // Filter: must have at least one model
  candidates = candidates.filter((p) => p.models.length > 0);

  // Filter: budget cap (per-request)
  if (budget.maxCostPerRequestUSD !== undefined) {
    const cap = budget.maxCostPerRequestUSD;
    candidates = candidates.filter((p) => {
      const cost = estimateCostUSD(p, inputTokenEstimate, outputTokenEstimate);
      return cost <= cap;
    });
  }

  // Filter: tier preference — prefer providers matching the classified tier
  // SIMPLE → budget, MEDIUM → budget/mid, COMPLEX → mid/premium, REASONING → mid/premium
  const TIER_PREFERENCE: Record<RoutingTier, Provider["tier"][]> = {
    SIMPLE: ["budget"],
    MEDIUM: ["budget", "mid"],
    COMPLEX: ["mid", "premium"],
    REASONING: ["mid", "premium"],
  };

  const preferredTiers = TIER_PREFERENCE[tier];
  const tierFiltered = candidates.filter((p) => preferredTiers.includes(p.tier));

  // Fall back to all candidates if tier filter eliminates everything
  const pool = tierFiltered.length > 0 ? tierFiltered : candidates;

  if (pool.length === 0) {
    throw new Error(
      `No providers available for tier=${tier} with budget cap=${budget.maxCostPerRequestUSD}` +
        ` and capabilities=${requiredCaps.join(",") || "none"}`,
    );
  }

  // Sort by latency first if preferLowLatency, otherwise sort by cost
  const sorted = [...pool].sort((a, b) => {
    if (options.preferLowLatency) {
      // Primary: latency, secondary: cost
      const latDiff = a.latencyP50Ms - b.latencyP50Ms;
      if (Math.abs(latDiff) > 100) return latDiff;
    }
    // Primary: blended cost
    const costA = estimateCostUSD(a, inputTokenEstimate, outputTokenEstimate);
    const costB = estimateCostUSD(b, inputTokenEstimate, outputTokenEstimate);
    return costA - costB;
  });

  const winner = sorted[0];
  const model = winner.models[0]; // load balancer will rotate via round-robin
  const estimatedCostUSD = estimateCostUSD(winner, inputTokenEstimate, outputTokenEstimate);

  const caps = requiredCaps.length > 0 ? ` | needs: ${requiredCaps.join(",")}` : "";
  const reasoning =
    `tier=${tier} | provider=${winner.name} | cost=$${estimatedCostUSD.toFixed(5)}` +
    ` | latency=${winner.latencyP50Ms}ms${caps}`;

  return {
    provider: winner,
    model,
    tier,
    estimatedCostUSD,
    reasoning,
  };
}