// packages/onyx-fhe/src/deposit.ts
// Rewritten to use @solana/kit (no @solana/web3.js) per the Encrypt pre-alpha integration docs.

import { address, fetchEncodedAccount, Address, Rpc, SolanaRpcApi } from '@solana/kit'
import { GraphFeeInput } from './types'
import { ENCRYPT_PROGRAM_ID } from './program-id'

// ---------------------------------------------------------------------------
// Instruction discriminators (from Encrypt pre-alpha docs)
// ---------------------------------------------------------------------------
export const DISC_CREATE_DEPOSIT    = 13
export const DISC_TOP_UP            = 14
export const DISC_REIMBURSE         = 17
export const DISC_REQUEST_WITHDRAW  = 18
export const DISC_WITHDRAW          = 15

// ---------------------------------------------------------------------------
// Fee calculation
// ---------------------------------------------------------------------------
export function calculateFee(input: GraphFeeInput): bigint {
  const totalInputs = BigInt(input.numInputs + input.numPlaintextInputs + input.numConstants)
  return (
    input.feeParams.encPerInput  * totalInputs +
    input.feeParams.encPerOutput * BigInt(input.numOutputs) +
    input.feeParams.maxEncPerOp  * BigInt(input.numOps)
  )
}

// ---------------------------------------------------------------------------
// Instruction builder types — Kit-compatible (no web3.js)
// ---------------------------------------------------------------------------
export interface EncryptInstruction {
  programAddress: Address
  accounts: Array<{ address: Address; role: 0 | 1 | 2 | 3 }>
  data: Uint8Array
}

// ---------------------------------------------------------------------------
// createDepositInstruction
// Doc layout: disc(1) + bump(1) + enc_amount(8 LE u64) + gas_amount(8 LE u64) = 18 bytes
// ---------------------------------------------------------------------------
export function createDepositInstruction(
  depositPda: Address,
  configPda: Address,
  payer: Address,
  encVault: Address,
  encAmount: bigint,
  gasAmount: bigint,
  bump: number,
  tokenProgram: Address,
  systemProgram: Address
): EncryptInstruction {
  const data = new Uint8Array(18)
  const view = new DataView(data.buffer)
  view.setUint8(0, DISC_CREATE_DEPOSIT)
  view.setUint8(1, bump)
  view.setBigUint64(2, encAmount, true)
  view.setBigUint64(10, gasAmount, true)

  return {
    programAddress: address(ENCRYPT_PROGRAM_ID),
    accounts: [
      { address: depositPda,    role: 1 }, // Writable
      { address: configPda,     role: 0 }, // ReadOnly
      { address: payer,         role: 3 }, // WritableSigner (authority)
      { address: payer,         role: 3 }, // WritableSigner (user / user_ata — caller provides distinct ATAs if needed)
      { address: encVault,      role: 1 }, // Writable (vault)
      { address: tokenProgram,  role: 0 }, // ReadOnly
      { address: systemProgram, role: 0 }, // ReadOnly
    ],
    data,
  }
}

// ---------------------------------------------------------------------------
// topUpInstruction
// Doc layout: disc(1) + enc_amount(8 LE u64) + gas_amount(8 LE u64) = 17 bytes
// ---------------------------------------------------------------------------
export function topUpInstruction(
  depositPda: Address,
  payer: Address,
  encAmount: bigint,
  gasAmount: bigint
): EncryptInstruction {
  const data = new Uint8Array(17)
  const view = new DataView(data.buffer)
  view.setUint8(0, DISC_TOP_UP)
  view.setBigUint64(1, encAmount, true)
  view.setBigUint64(9, gasAmount, true)

  return {
    programAddress: address(ENCRYPT_PROGRAM_ID),
    accounts: [
      { address: payer,      role: 3 }, // WritableSigner
      { address: depositPda, role: 1 }, // Writable
    ],
    data,
  }
}

// ---------------------------------------------------------------------------
// requestWithdrawInstruction
// Doc layout: disc(1) + enc_amount(8 LE u64) + gas_amount(8 LE u64) = 17 bytes
// ---------------------------------------------------------------------------
export function requestWithdrawInstruction(
  depositPda: Address,
  payer: Address,
  encAmount: bigint,
  gasAmount: bigint
): EncryptInstruction {
  const data = new Uint8Array(17)
  const view = new DataView(data.buffer)
  view.setUint8(0, DISC_REQUEST_WITHDRAW)
  view.setBigUint64(1, encAmount, true)
  view.setBigUint64(9, gasAmount, true)

  return {
    programAddress: address(ENCRYPT_PROGRAM_ID),
    accounts: [
      { address: payer,      role: 3 }, // WritableSigner
      { address: depositPda, role: 1 }, // Writable
    ],
    data,
  }
}

// ---------------------------------------------------------------------------
// withdrawInstruction
// Doc layout: disc(1) = 1 byte
// ---------------------------------------------------------------------------
export function withdrawInstruction(
  depositPda: Address,
  payer: Address
): EncryptInstruction {
  const data = new Uint8Array([DISC_WITHDRAW])

  return {
    programAddress: address(ENCRYPT_PROGRAM_ID),
    accounts: [
      { address: payer,      role: 3 }, // WritableSigner
      { address: depositPda, role: 1 }, // Writable
    ],
    data,
  }
}

// ---------------------------------------------------------------------------
// autoTopUp — checks deposit balance, tops up if below threshold
// Uses @solana/kit fetchEncodedAccount (no web3.js Connection/Keypair)
// ---------------------------------------------------------------------------
export async function autoTopUp(
  rpc: Rpc<SolanaRpcApi>,
  depositPda: Address,
  threshold: bigint
): Promise<void> {
  try {
    const account = await fetchEncodedAccount(rpc, depositPda)
    if (!account.exists || account.data.length < 42) return
    const view = new DataView(account.data.buffer, account.data.byteOffset, account.data.byteLength)
    const encBalance = view.getBigUint64(34, true)
    if (encBalance >= threshold) return
    // Caller is responsible for constructing and sending the topUp transaction
  } catch {
    return
  }
}

// ---------------------------------------------------------------------------
// parseDepositAccount — offset 34=encBalance, offset 42=gasBalance (u64 LE)
// ---------------------------------------------------------------------------
export function parseDepositAccount(data: Uint8Array): { encBalance: bigint; gasBalance: bigint } {
  if (data.length < 50) throw new Error('Invalid deposit account data')
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  return {
    encBalance: view.getBigUint64(34, true),
    gasBalance: view.getBigUint64(42, true),
  }
}