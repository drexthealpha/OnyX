import { Plugin, IAgentRuntime } from "@elizaos/core";

export const umbraPlugin: Plugin = {
  name: "onyx-umbra",
  description: "Umbra stealth address protocol for privacy-preserving asset transfers",
  actions: [],
  providers: [],
  evaluators: [],
  init: async (config: Record<string, string>, runtime: IAgentRuntime): Promise<void> => {
    const enabled = config.UMBRA_ENABLED ?? process.env.UMBRA_ENABLED;
    const logger = (runtime as any).logger;
    if (enabled !== "true") {
      if (logger?.info) logger.info("onyx-umbra: disabled. Set UMBRA_ENABLED=true to activate.");
      return;
    }
    try {
      (runtime as any).settings = { ...(runtime as any).settings, UMBRA_ENABLED: "true" };
    } catch {}
    if (logger?.info) logger.info("onyx-umbra: privacy layer active.");
  }
};