import { onyxCharacter } from "./character.js";
export { onyxCharacter };
export type { OnyxRuntime, ConversationTelemetry } from "./runtime";
export { createOnyxRuntime, MEMORY_TABLES } from "./runtime";
export * from "./actions";
export { walletStateProvider } from "./providers/wallet";
export { budgetRemainingProvider } from "./providers/budget";
export { screenContextProvider } from "./providers/context";
export { memoryStateProvider } from "./providers/memory-state";
export { budgetCheckEvaluator } from "./evaluators/budget";
export { learningExtractorEvaluator } from "./evaluators/learning";
export { nosanaPlugin, buildNosanaJobDef, nosanaStatusProvider } from "./plugins/nosana";
export type { NosanaJobDefinition } from "./plugins/nosana";
export { solanaPlugin, solanaNetworkProvider } from "./plugins/solana";
export { umbraPlugin } from "./plugins/umbra";
export { ikaPlugin } from "./plugins/ika";
export { encryptPlugin } from "./plugins/encrypt";
export { claudeMemPlugin, restoreMemoriesAction, persistMemoriesEvaluator } from "./plugins/claude-mem";
export { deepTutorPlugin, checkProgressAction, learnerProfileProvider } from "./plugins/deep-tutor";
export { last30DaysPlugin, recentIntelProvider } from "./plugins/last30days";
export * from "@onyx/research";
export { runIntel, getLatestIntel, getTrendingTopics, generateBrief } from "@onyx/intel";
export type { IntelBrief, Source as IntelSource } from "@onyx/intel";
export * from "@onyx/trading";
export * from "@onyx/privacy";
export * from "@onyx/compute";
export * from "@onyx/tutor";
export * from "@onyx/solana";


export const NAME = "onyx-agent";
export const VERSION = "0.1.0";

/**
 * Agent Management API (Library Mode)
 */

export async function listAgents() {
  return [
    {
      id: onyxCharacter.id,
      name: onyxCharacter.name,
      status: "ready",
      version: VERSION,
    },
  ];
}

export async function getAgent(id: string) {
  if (id === onyxCharacter.id || id === "onyx") {
    return {
      id: onyxCharacter.id,
      name: onyxCharacter.name,
      config: onyxCharacter,
    };
  }
  throw new Error(`Agent not found: ${id}`);
}

export async function createAgent(name?: string, config?: unknown) {
  return {
    id: `custom-${Date.now()}`,
    name: name ?? "Custom Agent",
    config: { ...onyxCharacter, ...config },
    status: "created",
  };
}

const eliza = new (await import("@elizaos/core")).ElizaOS();

export async function runAgent(id: string, prompt?: string) {
  const agent = await getAgent(id);
  
  let runtime = eliza.getAgent(agent.id as any);
  if (!runtime) {
    // ── Mutual exclusion: ELIZAOS_CLOUD_API_KEY and ANTHROPIC_API_KEY must not both be set ──
    const hasCloud = !!process.env['ELIZAOS_CLOUD_API_KEY'];
    const hasAnthropic = !!process.env['ANTHROPIC_API_KEY'];
    if (hasCloud && hasAnthropic) {
      throw new Error(
        '[onyx-agent] Configuration error: ELIZAOS_CLOUD_API_KEY and ANTHROPIC_API_KEY are mutually exclusive. ' +
        'Unset one before starting the agent runtime.'
      );
    }

    const { solanaPlugin } = await import("./plugins/solana.js");
    const { nosanaPlugin } = await import("./plugins/nosana.js");
    const { ikaPlugin } = await import("./plugins/ika.js");
    const { umbraPlugin } = await import("./plugins/umbra.js");
    const { encryptPlugin } = await import("./plugins/encrypt.js");

    // ── Plugin ordering: sql must init before local-embedding ──────────
    // @elizaos/plugin-sql sets up the DB schema; local-embedding depends on it.
    // We dynamically load sql first if available, then the rest.
    const sqlPlugin = await import("@elizaos/plugin-sql").catch(() => null);
    const embeddingPlugin = await import("@elizaos/plugin-local-embedding").catch(() => null);

    const orderedPlugins = [
      ...(sqlPlugin ? [sqlPlugin.default ?? sqlPlugin] : []),
      ...(embeddingPlugin ? [embeddingPlugin.default ?? embeddingPlugin] : []),
      solanaPlugin,
      nosanaPlugin,
      ikaPlugin,
      umbraPlugin,
      encryptPlugin,
    ];

    await eliza.addAgents([{
      character: agent.config,
      plugins: orderedPlugins,
    }], { autoStart: true });

    runtime = eliza.getAgent(agent.id as any)!;
  }


  const result = await eliza.handleMessage(runtime, {
    content: { text: prompt || "" },
    entityId: (await import("@elizaos/core")).stringToUuid("user"),
    roomId: (await import("@elizaos/core")).stringToUuid("default-room"),
  }) as unknown as unknown[];

  // handleMessage returns Memory[] or similar in recent Eliza versions
  const lastResponse = result[result.length - 1];

  return {
    agentId: id,
    prompt,
    response: lastResponse?.content?.text || "No response",
    timestamp: Date.now(),
  };
}

export async function deleteAgent(id: string) {
  if (id === onyxCharacter.id) {
    throw new Error("Cannot delete the system character");
  }
  return { ok: true };
}