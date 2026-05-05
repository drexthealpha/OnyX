import { 
  address, 
  Address, 
  Rpc, 
  SolanaRpcApi, 
  TransactionSigner,
  generateKeyPairSigner,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstruction,
  signTransactionMessageWithSigners,
  fetchEncodedAccount
} from '@solana/kit'
import { getU8Codec } from '@solana/codecs';
import { EncryptContextAccounts } from './encrypt-context'
import { EUint64, makeEUint64 } from './types'

export interface BidDigest {
  digest: string
  requestAccount: string
}

export const DISC_REQUEST_DECRYPTION = 10

export function parseDecryptionRequest(data: Uint8Array): {
  ciphertext: Uint8Array
  digest: Uint8Array
  requester: Uint8Array
  fheType: number
  totalLen: number
  bytesWritten: number
  result: bigint | null
} {
  if (data.length < 107) throw new Error('Invalid DecryptionRequest data')
  const ciphertext = data.subarray(2, 34)
  const digest = data.subarray(34, 66)
  const requester = data.subarray(66, 98)
  
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  const fheType = view.getUint8(98)
  const totalLen = view.getUint32(99, true)
  const bytesWritten = view.getUint32(103, true)
  const result: bigint | null = (bytesWritten === totalLen && totalLen > 0)
    ? view.getBigUint64(107, true)
    : null
  return { ciphertext, digest, requester, fheType, totalLen, bytesWritten, result }
}

export function verifyDigest(actual: Uint8Array, expected: Uint8Array): void {
  let equals = true;
  if (actual.length !== expected.length) equals = false;
  else {
    for (let i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) equals = false;
    }
  }
  if (equals) return;
  throw new Error('Digest mismatch — ciphertext may have been tampered')
}

export async function requestDecryption(
  ciphertext: Address,
  rpc: Rpc<SolanaRpcApi>,
  encryptContext: EncryptContextAccounts,
  payer: TransactionSigner
): Promise<{ digest: Uint8Array; requestAccount: Address }> {
  const enc = encryptContext
  const requestAccount = await generateKeyPairSigner()
  
  const data = new Uint8Array([DISC_REQUEST_DECRYPTION])

  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (m) => setTransactionMessageFeePayerSigner(payer, m),
    (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
    (m) =>
      appendTransactionMessageInstruction(
        {
          programAddress: enc.encryptProgram,
          accounts: [
            { address: payer.address, role: 3 }, // Writable + Signer
            { address: requestAccount.address, role: 3 }, // Writable + Signer
            { address: ciphertext, role: 0 },
            { address: enc.config, role: 0 },
            { address: enc.deposit, role: 3 },
            { address: enc.cpiAuthority, role: 0 },
            { address: enc.callerProgram, role: 0 },
            { address: enc.networkEncryptionKey, role: 0 },
            { address: enc.eventAuthority, role: 0 },
            { address: enc.systemProgram, role: 0 },
          ],
          data,
        },
        m,
      ),
  );

  const fullySignedTransaction = await signTransactionMessageWithSigners(transactionMessage);
  const { getBase64EncodedWireTransaction } = await import('@solana/transactions');
  const wireTransaction = getBase64EncodedWireTransaction(fullySignedTransaction);
  
  await rpc.sendTransaction(wireTransaction).send();
  
  const account = await fetchEncodedAccount(rpc, requestAccount.address)
  if (!account.exists) throw new Error('Failed to create DecryptionRequest account')
  
  const parsed = parseDecryptionRequest(account.data)
  return { digest: parsed.digest, requestAccount: requestAccount.address }
}

export async function submitBid(
  amount: EUint64,
  rpc: Rpc<SolanaRpcApi>,
  encryptContext: EncryptContextAccounts,
  payer: TransactionSigner
): Promise<BidDigest> {
  const { digest, requestAccount } = await requestDecryption(
    address(amount.ciphertext),
    rpc,
    encryptContext,
    payer
  )

  const digestHex = Buffer.from(digest).toString('hex')

  return { 
    digest: digestHex, 
    requestAccount: requestAccount
  }
}

export async function revealWinner(
  bids: BidDigest[],
  rpc: Rpc<SolanaRpcApi>,
  payer: TransactionSigner
): Promise<string> {
  const results: { pubkey: string; value: bigint }[] = []

  for (const bid of bids) {
    const requestAccount = address(bid.requestAccount)
    const account = await fetchEncodedAccount(rpc, requestAccount)
    if (!account.exists) continue

    const parsed = parseDecryptionRequest(account.data)
    if (parsed.result === null) continue

    verifyDigest(parsed.digest, Uint8Array.from(Buffer.from(bid.digest, 'hex')))
    results.push({ pubkey: bid.digest, value: parsed.result })
  }

  if (results.length === 0) throw new Error('No valid bids found')

  results.sort((a, b) => a.value > b.value ? -1 : 1)
  return results[0].pubkey
}