import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js'
import { EncryptContextAccounts } from './encrypt-context'
import { EUint64, makeEUint64 } from './types'

export interface BidDigest {
  digest: string
  requestAccount: string
}

export const DISC_REQUEST_DECRYPTION = 10

export function parseDecryptionRequest(data: Buffer): {
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
  const fheType = data.readUInt8(98)
  const totalLen = data.readUInt32LE(99)
  const bytesWritten = data.readUInt32LE(103)
  const result: bigint | null = (bytesWritten === totalLen && totalLen > 0)
    ? data.readBigUInt64LE(107)
    : null
  return { ciphertext, digest, requester, fheType, totalLen, bytesWritten, result }
}

export function verifyDigest(actual: Uint8Array, expected: Buffer): void {
  if (Buffer.from(actual).equals(expected)) return
  throw new Error('Digest mismatch — ciphertext may have been tampered')
}

export async function submitBid(
  amount: EUint64,
  connection: Connection,
  encryptContext: EncryptContextAccounts,
  payer: any
): Promise<BidDigest> {
  const enc = encryptContext

  const data = Buffer.alloc(33)
  data.writeUInt8(DISC_REQUEST_DECRYPTION, 0)
  data.set(new PublicKey(amount.ciphertext).toBuffer(), 1)

  const instruction = new TransactionInstruction({
    programId: enc.encryptProgram,
    keys: [
      { pubkey: enc.config, isSigner: false, isWritable: true },
      { pubkey: enc.deposit, isSigner: false, isWritable: true },
      { pubkey: enc.payer, isSigner: true, isWritable: true },
      { pubkey: enc.eventAuthority, isSigner: false, isWritable: false },
      { pubkey: enc.encryptProgram, isSigner: false, isWritable: false },
    ],
    data,
  })

  const tx = new Transaction().add(instruction)
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
  tx.sign(payer)

  const signature = await connection.sendRawTransaction(tx.serialize())
  await connection.confirmTransaction(signature)
  const txInfo = await connection.getTransaction(signature).catch(() => null)
  const logs = txInfo?.meta?.logMessages || []
  const digestMatch = logs.join('').match(/digest:\s*([a-f0-9]{64})/i)
  const digest = digestMatch ? digestMatch[1] : '0'.repeat(64)

  const [requestAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from('decryption_request'), new PublicKey(amount.ciphertext).toBuffer()],
    enc.encryptProgram
  )

  return { digest, requestAccount: requestAccount.toBase58() }
}

export async function revealWinner(
  bids: BidDigest[],
  connection: Connection,
  payer: any
): Promise<string> {
  const results: { pubkey: string; value: bigint }[] = []

  for (const bid of bids) {
    const requestAccount = new PublicKey(bid.requestAccount)
    const accountInfo = await connection.getAccountInfo(requestAccount)
    if (!accountInfo) continue

    const parsed = parseDecryptionRequest(accountInfo.data)
    if (parsed.result === null) continue

    verifyDigest(parsed.digest, Buffer.from(bid.digest, 'hex'))
    results.push({ pubkey: bid.digest, value: parsed.result })
  }

  if (results.length === 0) throw new Error('No valid bids found')

  results.sort((a, b) => a.value > b.value ? -1 : 1)
  return results[0].pubkey
}