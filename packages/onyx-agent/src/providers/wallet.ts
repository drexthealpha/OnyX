import { Provider, ProviderResult, IAgentRuntime, Memory, State } from "@elizaos/core";

export const walletStateProvider: Provider = {
  name: "wallet-state",
  position: -10,
  description: "Provides current wallet state including address and balances",
  get: async (runtime: IAgentRuntime, message: Memory, state: State): Promise<ProviderResult> => {
    const address = runtime.getSetting?.("WALLET_ADDRESS") ?? process.env.WALLET_ADDRESS ?? "";
    const balance = runtime.getSetting?.("WALLET_BALANCE_SOL") ?? process.env.WALLET_BALANCE_SOL ?? "0.00";
    if (!address) {
      return { text: "No wallet configured. Set WALLET_ADDRESS in settings.", values: { configured: false } };
    }
    return {
      text: "Wallet: " + address + " | Balance: " + balance + " SOL",
      values: { address, balance, configured: true }
    };
  }
};