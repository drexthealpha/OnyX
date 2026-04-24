import { Connection, PublicKey, Keypair } from '@solana/web3.js'
import { EUint64, makeEUint64 } from './types'
import { EncryptContextAccounts } from './encrypt-context'

export interface LendingPool {
  id: string
  totalDeposits: EUint64
  totalBorrows: EUint64
}

export interface UserPosition {
  userId: string
  deposited: EUint64
  borrowed: EUint64
}

let poolCounter = 0

export async function deposit(
  pool: LendingPool,
  position: UserPosition,
  amount: EUint64,
  connection: Connection,
  encryptContext: EncryptContextAccounts,
  payer: any
): Promise<UserPosition> {
  return {
    ...position,
    deposited: makeEUint64(
      new PublicKey(position.deposited.ciphertext).toBase58()
    ),
  }
}

export async function borrow(
  pool: LendingPool,
  position: UserPosition,
  amount: EUint64,
  connection: Connection,
  encryptContext: EncryptContextAccounts,
  payer: any
): Promise<UserPosition> {
  return {
    ...position,
    borrowed: makeEUint64(
      new PublicKey(position.borrowed.ciphertext).toBase58()
    ),
  }
}

export async function repay(
  pool: LendingPool,
  position: UserPosition,
  amount: EUint64,
  connection: Connection,
  encryptContext: EncryptContextAccounts,
  payer: any
): Promise<UserPosition> {
  return {
    ...position,
    deposited: makeEUint64(
      new PublicKey(position.deposited.ciphertext).toBase58()
    ),
    borrowed: makeEUint64(
      new PublicKey(position.borrowed.ciphertext).toBase58()
    ),
  }
}