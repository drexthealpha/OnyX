/**
 * @onyx/router — Provider Registry
 *
 * Real public pricing from ClawRouter README (April 2026).
 * costPer1kInputTokens / costPer1kOutputTokens in USD.
 * latencyP50Ms = estimated median latency from public benchmarks.
 */

import type { Provider } from "../types.js";

export const PROVIDERS: Provider[] = [
  // ── NVIDIA Free Tier ────────────────────────────────────────────────────────
  {
    name: "nvidia",
    displayName: "NVIDIA",
    models: [
      "nvidia/gpt-oss-120b",
      "nvidia/gpt-oss-20b",
      "nvidia/deepseek-v3.2",
      "nvidia/qwen3-coder-480b",
      "nvidia/glm-4.7",
      "nvidia/llama-4-maverick",
      "nvidia/qwen3-next-80b-a3b-thinking",
      "nvidia/mistral-small-4-119b",
    ],
    costPer1kInputTokens: 0,
    costPer1kOutputTokens: 0,
    latencyP50Ms: 800,
    endpoint: "https://integrate.api.nvidia.com/v1",
    supportsStreaming: true,
    supportsVision: false,
    supportsTools: false,
    supportsReasoning: true,
    tier: "budget",
    capabilities: ["reasoning", "code"],
  },

  // ── OpenAI ───────────────────────────────────────────────────────────────────
  {
    name: "openai-nano",
    displayName: "OpenAI GPT-5 Nano",
    models: ["openai/gpt-5-nano"],
    costPer1kInputTokens: 0.00005,   // $0.05/M
    costPer1kOutputTokens: 0.0004,   // $0.40/M
    latencyP50Ms: 400,
    endpoint: "https://api.openai.com/v1",
    supportsStreaming: true,
    supportsVision: false,
    supportsTools: true,
    tier: "budget",
    capabilities: ["tools"],
  },
  {
    name: "openai-4o-mini",
    displayName: "OpenAI GPT-4o Mini",
    models: ["openai/gpt-4o-mini", "openai/gpt-4.1-nano", "openai/gpt-4.1-mini"],
    costPer1kInputTokens: 0.00015,   // $0.15/M
    costPer1kOutputTokens: 0.0006,   // $0.60/M
    latencyP50Ms: 500,
    endpoint: "https://api.openai.com/v1",
    supportsStreaming: true,
    supportsVision: false,
    supportsTools: true,
    tier: "budget",
    capabilities: ["tools"],
  },
  {
    name: "openai-gpt4o",
    displayName: "OpenAI GPT-4o",
    models: ["openai/gpt-4o", "openai/gpt-4.1"],
    costPer1kInputTokens: 0.0025,    // $2.50/M
    costPer1kOutputTokens: 0.01,     // $10/M
    latencyP50Ms: 800,
    endpoint: "https://api.openai.com/v1",
    supportsStreaming: true,
    supportsVision: true,
    supportsTools: true,
    tier: "mid",
    capabilities: ["vision", "tools", "agentic"],
  },
  {
    name: "openai-o3",
    displayName: "OpenAI o3",
    models: ["openai/o3", "openai/o4-mini", "openai/o3-mini"],
    costPer1kInputTokens: 0.002,     // $2/M
    costPer1kOutputTokens: 0.008,  // $8/M
    latencyP50Ms: 2000,
    endpoint: "https://api.openai.com/v1",
    supportsStreaming: true,
    supportsVision: false,
    supportsTools: true,
    supportsReasoning: true,
    tier: "mid",
    capabilities: ["reasoning", "tools"],
  },
  {
    name: "openai-gpt5",
    displayName: "OpenAI GPT-5",
    models: ["openai/gpt-5.3", "openai/gpt-5.2", "openai/gpt-5.3-codex"],
    costPer1kInputTokens: 0.00175,   // $1.75/M
    costPer1kOutputTokens: 0.014,    // $14/M
    latencyP50Ms: 1200,
    endpoint: "https://api.openai.com/v1",
    supportsStreaming: true,
    supportsVision: true,
    supportsTools: true,
    supportsReasoning: true,
    tier: "premium",
    capabilities: ["reasoning", "vision", "tools", "agentic", "code"],
  },

  // ── Anthropic ────────────────────────────────────────────────────────────────
  {
    name: "claude-haiku",
    displayName: "Anthropic Claude Haiku 4.5",
    models: ["anthropic/claude-haiku-4-5", "anthropic/claude-haiku-4.5"],
    costPer1kInputTokens: 0.001,     // $1/M
    costPer1kOutputTokens: 0.005,    // $5/M
    latencyP50Ms: 600,
    endpoint: "https://api.anthropic.com/v1",
    supportsStreaming: true,
    supportsVision: true,
    supportsTools: true,
    supportsReasoning: false,
    tier: "mid",
    capabilities: ["vision", "tools", "agentic"],
  },
  {
    name: "claude-sonnet",
    displayName: "Anthropic Claude Sonnet 4.6",
    models: ["anthropic/claude-sonnet-4-6", "anthropic/claude-sonnet-4.6"],
    costPer1kInputTokens: 0.003,     // $3/M
    costPer1kOutputTokens: 0.015,    // $15/M
    latencyP50Ms: 900,
    endpoint: "https://api.anthropic.com/v1",
    supportsStreaming: true,
    supportsVision: true,
    supportsTools: true,
    supportsReasoning: true,
    tier: "premium",
    capabilities: ["reasoning", "vision", "tools", "agentic"],
  },
  {
    name: "claude-opus",
    displayName: "Anthropic Claude Opus 4.6",
    models: ["anthropic/claude-opus-4-6", "anthropic/claude-opus-4.6"],
    costPer1kInputTokens: 0.005,     // $5/M
    costPer1kOutputTokens: 0.025,   // $25/M
    latencyP50Ms: 1500,
    endpoint: "https://api.anthropic.com/v1",
    supportsStreaming: true,
    supportsVision: true,
    supportsTools: true,
    supportsReasoning: true,
    tier: "premium",
    capabilities: ["reasoning", "vision", "tools", "agentic"],
  },

  // ── Google ───────────────────────────────────────────────────────────────────
  {
    name: "gemini-flash",
    displayName: "Google Gemini 2.5 Flash",
    models: ["google/gemini-2.5-flash", "google/gemini-2.5-flash-lite"],
    costPer1kInputTokens: 0.0003,    // $0.30/M
    costPer1kOutputTokens: 0.0025,   // $2.50/M
    latencyP50Ms: 500,
    endpoint: "https://generativelanguage.googleapis.com/v1beta/openai",
    supportsStreaming: true,
    supportsVision: true,
    supportsTools: true,
    tier: "budget",
    capabilities: ["vision", "tools"],
  },
  {
    name: "gemini-pro",
    displayName: "Google Gemini 2.5 Pro",
    models: ["google/gemini-2.5-pro", "google/gemini-3.1-pro", "google/gemini-3-pro-preview"],
    costPer1kInputTokens: 0.00125,   // $1.25/M
    costPer1kOutputTokens: 0.01,     // $10/M
    latencyP50Ms: 1000,
    endpoint: "https://generativelanguage.googleapis.com/v1beta/openai",
    supportsStreaming: true,
    supportsVision: true,
    supportsTools: true,
    supportsReasoning: true,
    tier: "mid",
    capabilities: ["reasoning", "vision", "tools"],
  },

  // ── xAI Grok ─────────────────────────────────────────────────────────────────
  {
    name: "grok-fast",
    displayName: "xAI Grok 4 Fast",
    models: [
      "xai/grok-4-fast",
      "xai/grok-4-1-fast",
      "xai/grok-4-fast-reasoning",
      "xai/grok-4-1-fast-reasoning",
    ],
    costPer1kInputTokens: 0.0002,    // $0.20/M
    costPer1kOutputTokens: 0.0005,   // $0.50/M
    latencyP50Ms: 350,
    endpoint: "https://api.x.ai/v1",
    supportsStreaming: true,
    supportsVision: false,
    supportsTools: true,
    supportsReasoning: true,
    tier: "budget",
    capabilities: ["tools", "reasoning"],
  },
  {
    name: "grok-premium",
    displayName: "xAI Grok 3",
    models: ["xai/grok-3", "xai/grok-4-0709"],
    costPer1kInputTokens: 0.003,     // $3/M
    costPer1kOutputTokens: 0.015,     // $15/M
    latencyP50Ms: 1100,
    endpoint: "https://api.x.ai/v1",
    supportsStreaming: true,
    supportsVision: false,
    supportsTools: true,
    supportsReasoning: true,
    tier: "premium",
    capabilities: ["reasoning", "tools"],
  },

  // ── DeepSeek ─────────────────────────────────────────────────────────────────
  {
    name: "deepseek",
    displayName: "DeepSeek",
    models: ["deepseek/deepseek-chat", "deepseek/deepseek-reasoner"],
    costPer1kInputTokens: 0.00028,   // $0.28/M
    costPer1kOutputTokens: 0.00042, // $0.42/M
    latencyP50Ms: 700,
    endpoint: "https://api.deepseek.com/v1",
    supportsStreaming: true,
    supportsVision: false,
    supportsTools: true,
    supportsReasoning: true,
    tier: "budget",
    capabilities: ["tools", "reasoning", "code"],
  },

  // ── Groq (llama-3.1-70b) ─────────────────────────────────────────────────
  {
    name: "groq",
    displayName: "Groq",
    models: ["groq/llama-3.1-70b-versatile", "groq/llama-3.1-8b-instant", "groq/mixtral-8x7b-32768"],
    costPer1kInputTokens: 0.00059,   // $0.59/M
    costPer1kOutputTokens: 0.00079,  // $0.79/M
    latencyP50Ms: 200,               // Groq is fastest due to LPU
    endpoint: "https://api.groq.com/openai/v1",
    supportsStreaming: true,
    supportsVision: false,
    supportsTools: true,
    tier: "budget",
    capabilities: ["tools", "code"],
  },

  // ── Together AI (qwen2.5-72b) ────────────────────────────────────────────────
  {
    name: "together",
    displayName: "Together AI",
    models: [
      "together/qwen2.5-72b-instruct",
      "together/qwen2.5-coder-32b-instruct",
      "together/meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
    ],
    costPer1kInputTokens: 0.0012,    // $1.2/M
    costPer1kOutputTokens: 0.0012,
    latencyP50Ms: 650,
    endpoint: "https://api.together.xyz/v1",
    supportsStreaming: true,
    supportsVision: false,
    supportsTools: true,
    tier: "budget",
    capabilities: ["tools", "code"],
  },

  // ── Cohere Command R+ ────────────────────────────────────────────────────────
  {
    name: "cohere",
    displayName: "Cohere Command R+",
    models: ["cohere/command-r-plus", "cohere/command-r-plus-08-2024"],
    costPer1kInputTokens: 0.003,     // $3/M
    costPer1kOutputTokens: 0.015,    // $15/M
    latencyP50Ms: 900,
    endpoint: "https://api.cohere.com/v1",
    supportsStreaming: true,
    supportsVision: false,
    supportsTools: true,
    tier: "premium",
    capabilities: ["tools", "rag"],
  },

  // ── Moonshot Kimi ────────────────────────────────────────────────────────────
  {
    name: "moonshot",
    displayName: "Moonshot Kimi",
    models: ["moonshot/kimi-k2.5", "moonshot/kimi-k2.6"],
    costPer1kInputTokens: 0.0006,    // $0.60/M
    costPer1kOutputTokens: 0.003,  // $3/M
    latencyP50Ms: 750,
    endpoint: "https://api.moonshot.cn/v1",
    supportsStreaming: true,
    supportsVision: true,
    supportsTools: true,
    supportsReasoning: true,
    tier: "budget",
    capabilities: ["reasoning", "vision", "tools", "agentic"],
  },

  // ── MiniMax ──────────────────────────────────────────────────────────────────
  {
    name: "minimax",
    displayName: "MiniMax",
    models: ["minimax/minimax-m2.5", "minimax/minimax-m2.7"],
    costPer1kInputTokens: 0.0003,    // $0.30/M
    costPer1kOutputTokens: 0.0012,    // $1.20/M
    latencyP50Ms: 600,
    endpoint: "https://api.minimax.chat/v1",
    supportsStreaming: true,
    supportsVision: false,
    supportsTools: true,
    supportsReasoning: true,
    tier: "budget",
    capabilities: ["reasoning", "tools", "agentic"],
  },
];

/**
 * Get all providers that support a given capability.
 */
export function getProvidersByCapability(capability: string): Provider[] {
  return PROVIDERS.filter((p) => p.capabilities?.includes(capability));
}

/**
 * Get a provider by exact name.
 */
export function getProvider(name: string): Provider | undefined {
  return PROVIDERS.find((p) => p.name === name);
}

/**
 * Get all providers in a given pricing tier.
 */
export function getProvidersByTier(tier: Provider["tier"]): Provider[] {
  return PROVIDERS.filter((p) => p.tier === tier);
}

/**
 * Estimate cost in USD for a request to a given provider.
 * Uses 1k token units.
 */
export function estimateCostUSD(
  provider: Provider,
  inputTokens: number,
  outputTokens: number,
): number {
  return (
    (inputTokens / 1000) * provider.costPer1kInputTokens +
    (outputTokens / 1000) * provider.costPer1kOutputTokens
  );
}