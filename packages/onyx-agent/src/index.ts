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

export async function createAgent(name?: string, config?: any) {
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
    const { solanaPlugin } = await import("./plugins/solana.js");
    const { nosanaPlugin } = await import("./plugins/nosana.js");
    const { ikaPlugin } = await import("./plugins/ika.js");
    const { umbraPlugin } = await import("./plugins/umbra.js");
    const { encryptPlugin } = await import("./plugins/encrypt.js");

    await eliza.addAgents([{
      character: agent.config,
      plugins: [
        solanaPlugin,
        nosanaPlugin,
        ikaPlugin,
        umbraPlugin,
        encryptPlugin,
      ],
    }], { autoStart: true });
    
    runtime = eliza.getAgent(agent.id as any)!;
  }

  const result = await eliza.handleMessage(runtime, {
    content: { text: prompt || "" },
    entityId: (await import("@elizaos/core")).stringToUuid("user"),
    roomId: (await import("@elizaos/core")).stringToUuid("default-room"),
  }) as unknown as any[];

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