import { Action, ActionResult, IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";

export const solanaTransferAction: Action = {
  name: "SOLANA_TRANSFER",
  similes: ["SEND_SOL", "TRANSFER_SOL", "PAY_SOL"],
  description: "Transfer SOL or SPL tokens to another address.",
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    return !!(process.env.ONYX_WALLET_PATH);
  },
  handler: async (runtime: IAgentRuntime, message: Memory, state: State, options: any, callback: HandlerCallback): Promise<ActionResult> => {
    const text = message.content?.text || "";
    // Basic extraction logic
    const addressMatch = text.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/);
    const amountMatch = text.match(/(\d+(?:\.\d+)?)\s*(sol|usdc|usdt)/i);
    
    if (!addressMatch) {
      const err = "Could not find a valid Solana address in the message.";
      if (callback) await callback({ text: err });
      return { text: err, success: false };
    }

    const to = addressMatch[0];
    const amount = parseFloat(amountMatch?.[1] || "0");
    const mint = amountMatch?.[2]?.toUpperCase() === "SOL" ? undefined : amountMatch?.[2];

    try {
      const solana = await import("@onyx/solana");
      const result = await solana.executeTool("transfer", {
        to,
        amount,
        mint
      }) as { signature: string };

      const responseText = `Transfer successful! 
Signature: ${result.signature}
Recipient: ${to}
Amount: ${amount} ${mint || "SOL"}`;

      if (callback) await callback({ text: responseText });
      return { text: responseText, success: true };
    } catch (error: any) {
      const err = `Transfer failed: ${error.message}`;
      if (callback) await callback({ text: err });
      return { text: err, success: false };
    }
  },
  examples: [
    [
      { user: "{{user1}}", content: { text: "Send 0.1 SOL to 4vMzy9Tst8EwW3V6N7V7Z7N7V7Z7N7V7Z7N7V7Z7N7V7" } },
      { user: "{{user2}}", content: { text: "Transferring SOL...", action: "SOLANA_TRANSFER" } }
    ]
  ]
};

export const solanaBalanceAction: Action = {
  name: "SOLANA_BALANCE",
  similes: ["CHECK_BALANCE", "GET_BALANCE", "WALLET_STATUS"],
  description: "Check the current wallet balance.",
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    return !!(process.env.ONYX_WALLET_PATH);
  },
  handler: async (runtime: IAgentRuntime, message: Memory, state: State, options: any, callback: HandlerCallback): Promise<ActionResult> => {
    try {
      const solana = await import("@onyx/solana");
      const result = await solana.executeTool("getBalance", {}) as { sol: number; usdc: number };

      const responseText = `Wallet Balance:
SOL: ${result.sol.toFixed(4)}
USDC: ${result.usdc.toFixed(2)}`;

      if (callback) await callback({ text: responseText });
      return { text: responseText, success: true };
    } catch (error: any) {
      const err = `Failed to get balance: ${error.message}`;
      if (callback) await callback({ text: err });
      return { text: err, success: false };
    }
  },
  examples: [
    [
      { user: "{{user1}}", content: { text: "How much money do I have?" } },
      { user: "{{user2}}", content: { text: "Checking balance...", action: "SOLANA_BALANCE" } }
    ]
  ]
};
