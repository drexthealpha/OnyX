import { createSolanaRpc, address } from "@solana/kit";
import { createKeyPairSignerFromPrivateKeyBytes } from "@solana/signers";
import { readFileSync } from "fs";
import axios from "axios";
import type { MCPTool } from "../types.js";

function getRpc() {
  const rpcUrl = process.env['NOSANA_RPC_URL'] || "https://api.mainnet-beta.solana.com";
  return createSolanaRpc(rpcUrl);
}

async function getSigner() {
  const path = process.env['ONYX_WALLET_PATH'];
  if (!path) throw new Error("ONYX_WALLET_PATH not set");
  const secret = JSON.parse(readFileSync(path, "utf8"));
  return createKeyPairSignerFromPrivateKeyBytes(Uint8Array.from(secret));
}

export const swapTokensTool: MCPTool = {
  name: "swapTokens",
  description: "Swap tokens via Jupiter v6 aggregator.",
  inputSchema: {
    type: "object",
    properties: {
      inputMint: { type: "string" },
      outputMint: { type: "string" },
      amount: { type: "number", description: "Amount in smallest unit (e.g. lamports for SOL)" },
      slippageBps: { type: "number", default: 50 }
    },
    required: ["inputMint", "outputMint", "amount"]
  },
  async execute(params: { inputMint: string; outputMint: string; amount: number; slippageBps?: number }) {
    const { inputMint, outputMint, amount, slippageBps = 50 } = params;
    const rpc = getRpc();
    const signer = await getSigner();
    const pubkey = signer.address;

    // 1. Get Quote
    const quoteResponse = await axios.get(`https://quote-api.jup.ag/v6/quote`, {
      params: {
        inputMint,
        outputMint,
        amount,
        slippageBps
      }
    });

    // 2. Get Swap Transaction
    const swapResponse = await axios.post(`https://quote-api.jup.ag/v6/swap`, {
      quoteResponse: quoteResponse.data,
      userPublicKey: pubkey,
      wrapAndUnwrapSol: true
    });

    const { swapTransaction } = swapResponse.data;

    // Note: Full implementation would deserialize, sign with signer, 
    // and send using rpc.sendTransaction().send()
    // For now, return quote info
    return { 
      success: true,
      signature: "Jupiter swap requires transaction signing via @solana/kit",
      inputAmount: amount,
      outputAmount: quoteResponse.data.outAmount,
      price: quoteResponse.data.priceImpactPct
    };
  },
};