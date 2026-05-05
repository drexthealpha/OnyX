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
    const fhe = await import('@onyx/fhe');
    const { createSolanaRpc } = await import('@solana/kit');
    const rpcUrl = process.env['NOSANA_RPC_URL'] || 'https://api.devnet.solana.com';
    const rpc = createSolanaRpc(rpcUrl);
    // Use a placeholder caller program ID if not provided in env
    const callerId = process.env['FHE_CALLER_PROGRAM_ID'] || '11111111111111111111111111111111';
    const { address } = await import('@solana/kit');
    const ctx = await fhe.buildEncryptContext(rpc, address(callerId), address(payer));
    
    return {
      success: true,
      // Kit Address is a branded string — no .toBase58() needed
      encryptProgram: ctx.encryptProgram,
      config: ctx.config,
      deposit: ctx.deposit,
      networkEncryptionKey: ctx.networkEncryptionKey,
    };
  },
};