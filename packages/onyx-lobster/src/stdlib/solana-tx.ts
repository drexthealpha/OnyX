import { Connection, sendAndConfirmTransaction, Transaction } from '@solana/web3.js';
import type { TransactionInstruction } from '@solana/web3.js';

const SOLANA_RPC = process.env.SOLANA_RPC_URL ?? 'https://api.devnet.solana.com';

export async function solanaTx(instruction: TransactionInstruction): Promise<string> {
  const vault = await import('@onyx/vault');
  const connection = new Connection(SOLANA_RPC, 'confirmed');

  const tx = new Transaction().add(instruction);
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  const signed = await vault.signTransaction(tx);
  const sig = await sendAndConfirmTransaction(connection, signed, []);
  return sig;
}