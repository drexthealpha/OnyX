import { Connection, PublicKey, Keypair, TransactionInstruction } from '@solana/web3.js'
import { GraphFeeInput } from './types'

export const DISC_CREATE_DEPOSIT = 13
export const DISC_TOP_UP = 14
export const DISC_REIMBURSE = 17
export const DISC_REQUEST_WITHDRAW = 18
export const DISC_WITHDRAW = 15

export function calculateFee(input: GraphFeeInput): bigint {
  const totalInputs = BigInt(input.numInputs + input.numPlaintextInputs + input.numConstants)
  return (
    input.feeParams.encPerInput  * totalInputs +
    input.feeParams.encPerOutput * BigInt(input.numOutputs) +
    input.feeParams.maxEncPerOp  * BigInt(input.numOps)
  )
}

export function createDepositInstruction(
  depositPda: PublicKey,
  payer: PublicKey,
  encAmount: bigint,
  gasAmount: bigint,
  bump: number
): TransactionInstruction {
  const data = Buffer.alloc(17)
  data.writeUInt8(DISC_CREATE_DEPOSIT, 0)
  data.writeUInt8(bump, 1)
  data.writeBigUInt64LE(encAmount, 2)
  data.writeBigUInt64LE(gasAmount, 10)
  return new TransactionInstruction({
    programId: new PublicKey('4ebfzWdKnrnGseuQpezXdG8yCdHqwQ1SSBHD3bWArND8'),
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: depositPda, isSigner: false, isWritable: true },
    ],
    data,
  })
}

export function topUpInstruction(
  depositPda: PublicKey,
  payer: PublicKey,
  encAmount: bigint,
  gasAmount: bigint
): TransactionInstruction {
  const data = Buffer.alloc(16)
  data.writeUInt8(DISC_TOP_UP, 0)
  data.writeBigUInt64LE(encAmount, 1)
  data.writeBigUInt64LE(gasAmount, 9)
  return new TransactionInstruction({
    programId: new PublicKey('4ebfzWdKnrnGseuQpezXdG8yCdHqwQ1SSBHD3bWArND8'),
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: depositPda, isSigner: false, isWritable: true },
    ],
    data,
  })
}

export function requestWithdrawInstruction(
  depositPda: PublicKey,
  payer: PublicKey,
  encAmount: bigint,
  gasAmount: bigint
): TransactionInstruction {
  const data = Buffer.alloc(16)
  data.writeUInt8(DISC_REQUEST_WITHDRAW, 0)
  data.writeBigUInt64LE(encAmount, 1)
  data.writeBigUInt64LE(gasAmount, 9)
  return new TransactionInstruction({
    programId: new PublicKey('4ebfzWdKnrnGseuQpezXdG8yCdHqwQ1SSBHD3bWArND8'),
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: depositPda, isSigner: false, isWritable: true },
    ],
    data,
  })
}

export function withdrawInstruction(
  depositPda: PublicKey,
  payer: PublicKey
): TransactionInstruction {
  const data = Buffer.alloc(1)
  data.writeUInt8(DISC_WITHDRAW, 0)
  return new TransactionInstruction({
    programId: new PublicKey('4ebfzWdKnrnGseuQpezXdG8yCdHqwQ1SSBHD3bWArND8'),
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: depositPda, isSigner: false, isWritable: true },
    ],
    data,
  })
}

export async function autoTopUp(
  connection: Connection,
  depositPda: PublicKey,
  threshold: bigint,
  payer: Keypair
): Promise<void> {
  try {
    const account = await connection.getAccountInfo(depositPda)
    if (!account || account.data.length < 42) return
    const encBalance = account.data.readBigUInt64LE(34)
    if (encBalance >= threshold) return
  } catch {
    return
  }
}

export function parseDepositAccount(data: Buffer): { encBalance: bigint; gasBalance: bigint } {
  if (data.length < 42) throw new Error('Invalid deposit account data')
  return {
    encBalance: data.readBigUInt64LE(34),
    gasBalance: data.readBigUInt64LE(42),
  }
}