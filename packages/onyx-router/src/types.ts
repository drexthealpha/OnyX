/**
 * @onyx/router — Core Types
 * Pure TypeScript interfaces (no zod dependency).
 */

// ─── Provider ───────────────────────────────────────────────────────────────

export interface Provider {
  name: string;
  displayName: string;
  models: string[];
  costPer1kInputTokens: number;
  costPer1kOutputTokens: number;
  latencyP50Ms: number;
  endpoint: string;
  supportsStreaming: boolean;
  supportsVision?: boolean;
  supportsTools?: boolean;
  supportsReasoning?: boolean;
  tier: "budget" | "mid" | "premium";
  capabilities?: string[];
}

// ─── Budget Cap ──────────────────────────────────────────────────────────────

export interface BudgetCap {
  userId: string;
  maxCostPerRequestUSD?: number;
  dailyLimitUSD?: number;
  monthlyLimitUSD?: number;
}

// ─── Payment Receipt ─────────────────────────────────────────────────────────

export interface PaymentReceipt {
  txSignature: string;
  amountUSD: number;
  provider: string;
  model: string;
  timestamp: number;
  chain: "solana" | "base";
  walletAddress: string;
}

// ─── Route Request ───────────────────────────────────────────────────────────

export interface RouteRequest {
  userId: string;
  prompt: string;
  systemPrompt?: string;
  maxOutputTokens: number;
  budget: BudgetCap;
  requiresVision?: boolean;
  requiresTools?: boolean;
  requiresReasoning?: boolean;
  requiresStreaming?: boolean;
  preferLowLatency?: boolean;
}

// ─── Routing Tier ────────────────────────────────────────────────────────────

export type RoutingTier = "SIMPLE" | "MEDIUM" | "COMPLEX" | "REASONING";

// ─── Routing Decision ────────────────────────────────────────────────────────

export interface RoutingDecision {
  provider: Provider;
  model: string;
  tier: RoutingTier;
  estimatedCostUSD: number;
  reasoning: string;
}

// ─── RL Outcome ──────────────────────────────────────────────────────────────

export interface RLOutcome {
  userId: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  actualCostUSD: number;
  latencyMs: number;
  success: boolean;
  tokenEfficiency: number;
}