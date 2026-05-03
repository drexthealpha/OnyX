/**
 * @onyx/solana — FHE tools
 * Grounded in @onyx/fhe package.
 */

import type { MCPTool } from "../types.js";

export const createFHEAccountTool: MCPTool = {
  name: "createFHEAccount",
  description: "Create a Fully Homomorphic Encryption (FHE) account context.",
  inputSchema: {
    type: "object",
    properties: {
      payer: { type: "string", description: "Payer public address" },
    },
    required: ["payer"],
  } as any,
  async execute({ payer }: { payer: string }) {
    const fhe = await import("@onyx/fhe");
    // Use a placeholder caller program ID if not provided in env
    const callerId = process.env.FHE_CALLER_PROGRAM_ID || "11111111111111111111111111111111";
    const ctx = await fhe.buildEncryptContext(callerId, payer);
    
    return {
      success: true,
      encryptProgram: ctx.encryptProgram.toBase58(),
      config: ctx.config.toBase58(),
      deposit: ctx.deposit.toBase58(),
      networkEncryptionKey: ctx.networkEncryptionKey.toBase58(),
    };
  },
};