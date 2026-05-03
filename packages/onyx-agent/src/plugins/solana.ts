import { Plugin, Provider, IAgentRuntime, Memory, State, ProviderResult } from "@elizaos/core";

export const solanaNetworkProvider: Provider = {
  name: "solana-network",
  position: -8,
  description: "Provides Solana network context",
  get: async (runtime: IAgentRuntime, message: Memory, state: State): Promise<ProviderResult> => {
    const network = runtime.getSetting?.("SOLANA_NETWORK") ?? process.env['SOLANA_NETWORK'] ?? "mainnet-beta";
    return { text: "Solana network: " + (network as string), values: { network: network as string } };
  }
};

import { solanaTransferAction, solanaBalanceAction } from "../actions/solana.js";

export const solanaPlugin: Plugin = {
  name: "onyx-solana",
  description: "Provides Solana blockchain context and transaction utilities",
  actions: [solanaTransferAction, solanaBalanceAction],
  providers: [solanaNetworkProvider],
  evaluators: [],
  init: async (config: Record<string, string>, runtime: IAgentRuntime): Promise<void> => {
    const rpcUrl = config['SOLANA_RPC_URL'] ?? process.env['SOLANA_RPC_URL'] ?? "https://api.mainnet-beta.solana.com";
    const logger = runtime.logger;
    if (logger?.info) logger.info("onyx-solana: connected to " + rpcUrl);
  }
};