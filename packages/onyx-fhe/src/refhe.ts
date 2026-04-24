import { Connection, Transaction, TransactionInstruction, PublicKey, Keypair, clusterApiUrl } from '@solana/web3.js'
import { EncryptContextAccounts } from './encrypt-context'

export const DISC_EXECUTE_GRAPH = 4

export async function executeGraph(
  connection: Connection,
  graphBytes: Uint8Array,
  inputs: string[],
  outputs: string[],
  encryptContext: EncryptContextAccounts,
  payer: any
): Promise<string> {
  const enc = encryptContext

  const keys = [
    { pubkey: enc.config, isSigner: false, isWritable: false },
    { pubkey: enc.deposit, isSigner: false, isWritable: true },
    { pubkey: enc.cpiAuthority, isSigner: false, isWritable: false },
    { pubkey: enc.callerProgram, isSigner: false, isWritable: false },
    { pubkey: enc.networkEncryptionKey, isSigner: false, isWritable: false },
    { pubkey: enc.payer, isSigner: true, isWritable: true },
    { pubkey: enc.eventAuthority, isSigner: false, isWritable: false },
    { pubkey: enc.encryptProgram, isSigner: false, isWritable: false },
    ...inputs.map(ct => ({ pubkey: new PublicKey(ct), isSigner: false, isWritable: false })),
    ...outputs.map(ct => ({ pubkey: new PublicKey(ct), isSigner: false, isWritable: true })),
  ]

  const data = Buffer.alloc(5 + graphBytes.length)
  data.writeUInt8(DISC_EXECUTE_GRAPH, 0)
  data.writeUInt16LE(graphBytes.length, 1)
  data.set(graphBytes, 3)
  data.writeUInt16LE(inputs.length, 3 + graphBytes.length)

  const instruction = new TransactionInstruction({
    programId: enc.encryptProgram,
    keys,
    data,
  })

  const transaction = new Transaction().add(instruction)
  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

  if (payer instanceof Keypair) {
    transaction.sign(payer)
  } else {
    transaction.sign(payer)
  }

  const signature = await connection.sendRawTransaction(transaction.serialize())
  return signature
}

export async function waitForVerified(
  connection: Connection,
  ciphertext: PublicKey,
  timeout: number = 60000
): Promise<boolean> {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const account = await connection.getAccountInfo(ciphertext)
    if (account && account.data.length >= 100 && account.data[99] === 1) {
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
  encryptContext: EncryptContextAccounts
): TransactionInstruction {
  const enc = encryptContext

  const keys = [
    { pubkey: enc.config, isSigner: false, isWritable: false },
    { pubkey: enc.deposit, isSigner: false, isWritable: true },
    { pubkey: enc.cpiAuthority, isSigner: false, isWritable: false },
    { pubkey: enc.callerProgram, isSigner: false, isWritable: false },
    { pubkey: enc.networkEncryptionKey, isSigner: false, isWritable: false },
    { pubkey: enc.payer, isSigner: true, isWritable: true },
    { pubkey: enc.eventAuthority, isSigner: false, isWritable: false },
    { pubkey: enc.encryptProgram, isSigner: false, isWritable: false },
    ...inputs.map(ct => ({ pubkey: new PublicKey(ct), isSigner: false, isWritable: false })),
    ...outputs.map(ct => ({ pubkey: new PublicKey(ct), isSigner: false, isWritable: true })),
  ]

  const data = Buffer.alloc(5 + graphBytes.length)
  data.writeUInt8(DISC_EXECUTE_GRAPH, 0)
  data.writeUInt16LE(graphBytes.length, 1)
  data.set(graphBytes, 3)
  data.writeUInt16LE(inputs.length, 3 + graphBytes.length)

  return new TransactionInstruction({
    programId: enc.encryptProgram,
    keys,
    data,
  })
}