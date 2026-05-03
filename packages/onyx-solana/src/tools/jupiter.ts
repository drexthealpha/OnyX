import { 
  Connection, 
  PublicKey, 
  Keypair, 
  VersionedTransaction 
} from "@solana/web3.js";
import { readFileSync } from "fs";
import axios from "axios";
import type { MCPTool } from "../types.js";

function getConnection(): Connection {
  const rpc = process.env.NOSANA_RPC_URL || "https://api.mainnet-beta.solana.com";
  return new Connection(rpc, "confirmed");
}

function getKeypair(): Keypair {
  const path = process.env.ONYX_WALLET_PATH;
  if (!path) throw new Error("ONYX_WALLET_PATH not set");
  const secret = JSON.parse(readFileSync(path, "utf8"));
  return Keypair.fromSecretKey(Uint8Array.from(secret));
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
    const connection = getConnection();
    const payer = getKeypair();

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
      userPublicKey: payer.publicKey.toBase58(),
      wrapAndUnwrapSol: true
    });

    const { swapTransaction } = swapResponse.data;

    // 3. Sign and Execute
    const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
    transaction.sign([payer]);

    const latestBlockHash = await connection.getLatestBlockhash();
    const signature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: true,
      maxRetries: 2
    });

    await connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature
    });

    return { 
      success: true,
      signature,
      inputAmount: amount,
      outputAmount: quoteResponse.data.outAmount,
      price: quoteResponse.data.priceImpactPct
    };
  },
};