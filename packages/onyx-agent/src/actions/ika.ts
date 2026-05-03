import { Action, ActionResult, IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";

export const ikaSignAction: Action = {
  name: "IKA_SIGN",
  similes: ["SIGN_MESSAGE", "MPC_SIGN", "IKA_AUTHORIZE"],
  description: "Sign a message using the Ika decentralized wallet network.",
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    return !!(process.env.ONYX_WALLET_PATH);
  },
  handler: async (runtime: IAgentRuntime, message: Memory, state: State, options: any, callback: HandlerCallback): Promise<ActionResult> => {
    const text = message.content?.text || "";
    // Extract message (crude extraction)
    const msgMatch = text.match(/sign\s+(?:message|text)?\s+["'](.+?)["']/i) || text.match(/message:\s*(.+)/i);
    const dwalletMatch = text.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/);

    if (!msgMatch) {
      const err = "Please provide the message to sign in quotes, e.g., Sign message 'hello world'";
      if (callback) await callback({ text: err });
      return { text: err, success: false };
    }

    if (!dwalletMatch) {
      const err = "Please provide the Ika dWallet public key.";
      if (callback) await callback({ text: err });
      return { text: err, success: false };
    }

    const messageToSign = Buffer.from(msgMatch[1]).toString("base64");
    const dwalletPubkey = dwalletMatch[0];

    try {
      const solana = await import("@onyx/solana");
      const result = await solana.executeTool("ikaSign", {
        message: messageToSign,
        dwalletPubkey,
        curve: 0 // Default Secp256k1
      }) as { txSig: string; signature: string };

      const responseText = `Ika MPC Signature Generated!
Approval Tx: ${result.txSig}
Signature (Base64): ${result.signature}
Wallet: ${dwalletPubkey}`;

      if (callback) await callback({ text: responseText });
      return { text: responseText, success: true };
    } catch (error: any) {
      const err = `Ika signing failed: ${error.message}`;
      if (callback) await callback({ text: err });
      return { text: err, success: false };
    }
  },
  examples: [
    [
      { user: "{{user1}}", content: { text: "Sign message 'Approve Transaction 123' with wallet 4vMzy9Tst8EwW3V6N7V7Z7N7V7Z7N7V7Z7N7V7Z7N7V7" } },
      { user: "{{user2}}", content: { text: "Initiating Ika MPC signature...", action: "IKA_SIGN" } }
    ]
  ]
};
