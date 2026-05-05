import { 
  address, 
  appendTransactionMessageInstruction, 
  createSolanaRpc, 
  createTransactionMessage, 
  fetchEncodedAccount, 
  pipe, 
  setTransactionMessageFeePayerSigner, 
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  Address,
  Rpc,
  SolanaRpcApi,
  TransactionSigner,
} from '@solana/kit';
import { getU16Codec } from '@solana/codecs';
import { EncryptContextAccounts } from './encrypt-context'

export const DISC_EXECUTE_GRAPH = 4

export async function executeGraph(
  rpc: Rpc<SolanaRpcApi>,
  graphBytes: Uint8Array,
  inputs: string[],
  outputs: string[],
  encryptContext: EncryptContextAccounts,
  payer: TransactionSigner,
  outputSigners: TransactionSigner[] = [] // Keypair signers for output ciphertext accounts
): Promise<string> {
  const enc = encryptContext

  const roInputAccounts = inputs.map(ct => ({ address: address(ct), role: 0 as const }))

  // Output ciphertext accounts are keypair accounts (not PDAs).
  // We embed the signer so Kit's signTransactionMessageWithSigners co-signs them.
  const rwOutputAccounts = outputs.map((ct, i) => {
    const signer = outputSigners[i]
    if (signer) {
      return { address: signer.address, role: 3 as const, signer }
    }
    // Fallback: address-only (writable, signer must be provided externally)
    return { address: address(ct), role: 3 as const }
  })

  const accounts = [
    { address: enc.config, role: 0 as const },
    { address: enc.deposit, role: 3 as const },
    { address: enc.cpiAuthority, role: 0 as const },
    { address: enc.callerProgram, role: 0 as const },
    { address: enc.networkEncryptionKey, role: 0 as const },
    { address: enc.payer, role: 3 as const },
    { address: enc.eventAuthority, role: 0 as const },
    { address: enc.encryptProgram, role: 0 as const },
    ...roInputAccounts,
    ...rwOutputAccounts,
  ]

  const data = new Uint8Array(5 + graphBytes.length)
  data[0] = DISC_EXECUTE_GRAPH
  const u16 = getU16Codec()
  data.set(u16.encode(graphBytes.length), 1)
  data.set(graphBytes, 3)
  data.set(u16.encode(inputs.length), 3 + graphBytes.length)

  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (m) => setTransactionMessageFeePayerSigner(payer, m),
    (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
    (m) =>
      appendTransactionMessageInstruction(
        {
          programAddress: enc.encryptProgram,
          accounts,
          data,
        } as any,
        m,
      ),
  );

  const fullySignedTransaction = await signTransactionMessageWithSigners(transactionMessage);
  const { getBase64EncodedWireTransaction } = await import('@solana/transactions');
  const wireTransaction = getBase64EncodedWireTransaction(fullySignedTransaction);
  
  return await rpc.sendTransaction(wireTransaction).send();
}

export async function waitForVerified(
  rpc: Rpc<SolanaRpcApi>,
  ciphertext: Address,
  timeout: number = 60000
): Promise<boolean> {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const account = await fetchEncodedAccount(rpc, ciphertext)
    if (account.exists && account.data.length >= 100 && account.data[99] === 1) {
      return true
    }
    await new Promise(r => setTimeout(r, 1000))
  }
  throw new Error(`EncryptFHEError: CPI failed — ciphertext status PENDING after ${timeout / 1000}s timeout`)
}

export function buildExecuteGraphInstruction(
  graphBytes: Uint8Array,
  inputs: string[],
  outputs: string[],
  encryptContext: EncryptContextAccounts,
  outputSigners: TransactionSigner[] = []
): { programAddress: Address; accounts: any[]; data: Uint8Array } {
  const enc = encryptContext

  const roInputAccounts = inputs.map(ct => ({ address: address(ct), role: 0 as const }))
  const rwOutputAccounts = outputs.map((ct, i) => {
    const signer = outputSigners[i]
    if (signer) return { address: signer.address, role: 3 as const, signer }
    return { address: address(ct), role: 3 as const }
  })

  const accounts = [
    { address: enc.config, role: 0 as const },
    { address: enc.deposit, role: 3 as const },
    { address: enc.cpiAuthority, role: 0 as const },
    { address: enc.callerProgram, role: 0 as const },
    { address: enc.networkEncryptionKey, role: 0 as const },
    { address: enc.payer, role: 3 as const },
    { address: enc.eventAuthority, role: 0 as const },
    { address: enc.encryptProgram, role: 0 as const },
    ...roInputAccounts,
    ...rwOutputAccounts,
  ]

  const data = new Uint8Array(5 + graphBytes.length)
  data[0] = DISC_EXECUTE_GRAPH
  const u16 = getU16Codec()
  data.set(u16.encode(graphBytes.length), 1)
  data.set(graphBytes, 3)
  data.set(u16.encode(inputs.length), 3 + graphBytes.length)

  return {
    programAddress: enc.encryptProgram,
    accounts,
    data,
  }
}