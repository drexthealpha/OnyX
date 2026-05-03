import { Connection, sendAndConfirmTransaction, Transaction } from '@solana/web3.js';
import type { TransactionInstruction } from '@solana/web3.js';

const SOLANA_RPC = process.env.SOLANA_RPC_URL ?? 'https://api.devnet.solana.com';

export async function solanaTx(instruction: TransactionInstruction): Promise<string> {
  const vault = await import('@onyx/vault');
  const connection = new Connection(SOLANA_RPC, 'confirmed');

  const tx = new Transaction().add(instruction);
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.feePayer = (await import('@solana/web3.js')).PublicKey.default; // Temporary placeholder, in real impl this would be vault.getPublicKey()

  const { PublicKey } = await import('@solana/web3.js');
  const userPubkey = new PublicKey(await vault.getPublicKey());
  tx.feePayer = userPubkey;

  const message = tx.serializeMessage();
  const signature = await vault.signTransaction(message);
  
  tx.addSignature(userPubkey, Buffer.from(signature));
  const sig = await connection.sendRawTransaction(tx.serialize());
  return sig;
}