import { createSolanaRpc, address, lamports } from "@solana/kit";
import { createKeyPairSignerFromPrivateKeyBytes } from "@solana/signers";
import { getTransferSolInstruction } from "@solana-program/system";
import { pipe } from "@solana/functional";
import { createTransactionMessage, setTransactionMessageFeePayerSigner, setTransactionMessageLifetimeUsingBlockhash, appendTransactionMessageInstruction, signTransactionMessageWithSigners, getBase64EncodedWireTransaction } from "@solana/kit";
import { readFileSync } from "fs";
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

export const getBalanceTool: MCPTool = {
  name: "getBalance",
  description: "Get SOL balance for the ONYX wallet or any public address",
  inputSchema: {
    type: "object",
    properties: {
      wallet: { type: "string", description: "Public address to check balance for" }
    }
  },
  async execute(params: { wallet?: string }) {
    const rpc = getRpc();
    const pubkey = params.wallet || (await getSigner()).address;
    const { value: balance } = await rpc.getBalance(address(pubkey)).send();
    return { 
      address: pubkey, 
      lamports: balance, 
      sol: Number(balance) / 1e9 
    };
  },
};

export const transferTool: MCPTool = {
  name: "transfer",
  description: "Transfer SOL from the ONYX agent wallet to a recipient.",
  inputSchema: {
    type: "object",
    properties: {
      to: { type: "string", description: "Recipient public address" },
      lamports: { type: "number", description: "Amount in lamports to transfer" }
    },
    required: ["to", "lamports"]
  },
  async execute(params: { to: string; lamports: number }) {
    const rpc = getRpc();
    const signer = await getSigner();
    const from = signer.address;
    const to = params.to;

    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

    const transactionMessage = pipe(
      createTransactionMessage({ version: 0 }),
      (m) => setTransactionMessageFeePayerSigner(signer, m),
      (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
      (m) => appendTransactionMessageInstruction(
        getTransferSolInstruction({
          source: signer,
          destination: address(to),
          amount: lamports(BigInt(params.lamports)),
        }),
        m
      ),
    );

    const signedTransaction = await signTransactionMessageWithSigners(transactionMessage);
    const wireTransaction = getBase64EncodedWireTransaction(signedTransaction);
    const result = await rpc.sendTransaction(wireTransaction).send();

    return { 
      success: true,
      signature: result, 
      from, 
      to, 
      lamports: params.lamports 
    };
  },
};