import { createSolanaRpc, address, createTransactionMessage, setTransactionMessageFeePayer, setTransactionMessageLifetimeUsingBlockhash, appendTransactionMessageInstruction, signTransactionMessageWithSigners, getBase64EncodedWireTransaction } from '@solana/kit';
import { pipe } from '@solana/functional';

const SOLANA_RPC = process.env['SOLANA_RPC_URL'] ?? 'https://api.devnet.solana.com';

export async function solanaTx(instruction: { programAddress: string; accounts: any[]; data: Uint8Array }): Promise<string> {
  const vault = await import('@onyx/vault');
  const rpc = createSolanaRpc(SOLANA_RPC);
  const pubkey = vault.getPublicKey();

  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (m) => setTransactionMessageFeePayer(address(pubkey), m),
    (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
    (m) => appendTransactionMessageInstruction(instruction as any, m),
  );

  // Get signer from vault
  const vaultModule = await import('@onyx/vault');
  const wallet = await vaultModule.createWallet({ rpcUrl: SOLANA_RPC });
  const signer = wallet as any;
  
  const signedTransaction = await signTransactionMessageWithSigners(transactionMessage);
  const wireTransaction = getBase64EncodedWireTransaction(signedTransaction);
  
  const result = await rpc.sendTransaction(wireTransaction).send();
  return result;
}