import { Connection, PublicKey } from '@solana/web3.js'
import { EUint64, makeEUint64 } from './types'
import { EncryptContextAccounts } from './encrypt-context'
import { executeGraph } from './refhe'

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

/**
 * Deposits funds into a private lending pool by updating on-chain FHE state.
 */
export async function deposit(
  pool: LendingPool,
  position: UserPosition,
  amount: EUint64,
  connection: Connection,
  encryptContext: EncryptContextAccounts,
  payer: any
): Promise<string> {
  const [newPoolTotal] = PublicKey.findProgramAddressSync(
    [Buffer.from('pool_deposit'), Buffer.from(pool.id)],
    encryptContext.encryptProgram
  )
  const [newUserDeposit] = PublicKey.findProgramAddressSync(
    [Buffer.from('user_deposit'), Buffer.from(position.userId)],
    encryptContext.encryptProgram
  )

  const graphBytes = Buffer.alloc(0) // Graph would implement ADD(pool.total, amount) and ADD(user.deposited, amount)
  
  return await executeGraph(
    connection,
    graphBytes,
    [pool.totalDeposits.ciphertext, position.deposited.ciphertext, amount.ciphertext],
    [newPoolTotal.toBase58(), newUserDeposit.toBase58()],
    encryptContext,
    payer
  )
}

/**
 * Borrows funds from a private lending pool.
 */
export async function borrow(
  pool: LendingPool,
  position: UserPosition,
  amount: EUint64,
  connection: Connection,
  encryptContext: EncryptContextAccounts,
  payer: any
): Promise<string> {
  const [newPoolBorrows] = PublicKey.findProgramAddressSync(
    [Buffer.from('pool_borrow'), Buffer.from(pool.id)],
    encryptContext.encryptProgram
  )
  const [newUserBorrow] = PublicKey.findProgramAddressSync(
    [Buffer.from('user_borrow'), Buffer.from(position.userId)],
    encryptContext.encryptProgram
  )

  const graphBytes = Buffer.alloc(0) // Graph would implement ADD(pool.borrows, amount) and ADD(user.borrowed, amount)
  
  return await executeGraph(
    connection,
    graphBytes,
    [pool.totalBorrows.ciphertext, position.borrowed.ciphertext, amount.ciphertext],
    [newPoolBorrows.toBase58(), newUserBorrow.toBase58()],
    encryptContext,
    payer
  )
}

/**
 * Repays a private loan.
 */
export async function repay(
  pool: LendingPool,
  position: UserPosition,
  amount: EUint64,
  connection: Connection,
  encryptContext: EncryptContextAccounts,
  payer: any
): Promise<string> {
  const [newPoolBorrows] = PublicKey.findProgramAddressSync(
    [Buffer.from('pool_borrow'), Buffer.from(pool.id)],
    encryptContext.encryptProgram
  )
  const [newUserBorrow] = PublicKey.findProgramAddressSync(
    [Buffer.from('user_borrow'), Buffer.from(position.userId)],
    encryptContext.encryptProgram
  )

  const graphBytes = Buffer.alloc(0) // Graph would implement SUB(pool.borrows, amount) and SUB(user.borrowed, amount)
  
  return await executeGraph(
    connection,
    graphBytes,
    [pool.totalBorrows.ciphertext, position.borrowed.ciphertext, amount.ciphertext],
    [newPoolBorrows.toBase58(), newUserBorrow.toBase58()],
    encryptContext,
    payer
  )
}