import { Plugin, Provider, IAgentRuntime, Memory } from "@elizaos/core";

export const solanaNetworkProvider: Provider = {
  name: "solana-network",
  position: -8,
  description: "Provides Solana network context",
  get: async (runtime: IAgentRuntime, message: Memory): Promise<{ text: string; values: Record<string, unknown> }> => {
    const network = runtime.getSetting?.("SOLANA_NETWORK") ?? process.env.SOLANA_NETWORK ?? "mainnet-beta";
    return { text: "Solana network: " + network, values: { network } };
  }
};

export const solanaPlugin: Plugin = {
  name: "onyx-solana",
  description: "Provides Solana blockchain context and transaction utilities",
  actions: [],
  providers: [solanaNetworkProvider],
  evaluators: [],
  init: async (config: Record<string, string>, runtime: IAgentRuntime): Promise<void> => {
    const rpcUrl = config.SOLANA_RPC_URL ?? process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";
    const logger = (runtime as any).logger;
    if (logger?.info) logger.info("onyx-solana: connected to " + rpcUrl);
  }
};