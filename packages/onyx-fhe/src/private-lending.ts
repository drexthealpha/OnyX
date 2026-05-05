import { 
  address, 
  Address, 
  Rpc, 
  SolanaRpcApi, 
  TransactionSigner 
} from '@solana/kit'
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
  rpc: Rpc<SolanaRpcApi>,
  encryptContext: EncryptContextAccounts,
  payer: TransactionSigner
): Promise<string> {
  // Output ciphertexts are keypair accounts, not PDAs (per Encrypt docs)
  const { generateKeyPairSigner } = await import('@solana/kit')
  const newPoolTotalSigner   = await generateKeyPairSigner()
  const newUserDepositSigner = await generateKeyPairSigner()

  // Graph: ADD(pool.totalDeposits, amount) -> newPoolTotal
  //        ADD(position.deposited,  amount) -> newUserDeposit
  const graphBytes = new Uint8Array(0) // pre-alpha: graph DSL not yet public

  return await executeGraph(
    rpc,
    graphBytes,
    [pool.totalDeposits.ciphertext, position.deposited.ciphertext, amount.ciphertext],
    [newPoolTotalSigner.address, newUserDepositSigner.address],
    encryptContext,
    payer,
    [newPoolTotalSigner, newUserDepositSigner]
  )
}

/**
 * Borrows funds from a private lending pool.
 */
export async function borrow(
  pool: LendingPool,
  position: UserPosition,
  amount: EUint64,
  rpc: Rpc<SolanaRpcApi>,
  encryptContext: EncryptContextAccounts,
  payer: TransactionSigner
): Promise<string> {
  // Output ciphertexts are keypair accounts, not PDAs (per Encrypt docs)
  const { generateKeyPairSigner } = await import('@solana/kit')
  const newPoolBorrowsSigner = await generateKeyPairSigner()
  const newUserBorrowSigner  = await generateKeyPairSigner()

  // Graph: ADD(pool.totalBorrows, amount) -> newPoolBorrows
  //        ADD(position.borrowed,  amount) -> newUserBorrow
  const graphBytes = new Uint8Array(0) // pre-alpha: graph DSL not yet public

  return await executeGraph(
    rpc,
    graphBytes,
    [pool.totalBorrows.ciphertext, position.borrowed.ciphertext, amount.ciphertext],
    [newPoolBorrowsSigner.address, newUserBorrowSigner.address],
    encryptContext,
    payer,
    [newPoolBorrowsSigner, newUserBorrowSigner]
  )
}

/**
 * Repays a private loan.
 */
export async function repay(
  pool: LendingPool,
  position: UserPosition,
  amount: EUint64,
  rpc: Rpc<SolanaRpcApi>,
  encryptContext: EncryptContextAccounts,
  payer: TransactionSigner
): Promise<string> {
  // Output ciphertexts are keypair accounts, not PDAs (per Encrypt docs)
  const { generateKeyPairSigner } = await import('@solana/kit')
  const newPoolBorrowsSigner = await generateKeyPairSigner()
  const newUserBorrowSigner  = await generateKeyPairSigner()

  // Graph: SUB(pool.totalBorrows, amount) -> newPoolBorrows
  //        SUB(position.borrowed,  amount) -> newUserBorrow
  const graphBytes = new Uint8Array(0) // pre-alpha: graph DSL not yet public

  return await executeGraph(
    rpc,
    graphBytes,
    [pool.totalBorrows.ciphertext, position.borrowed.ciphertext, amount.ciphertext],
    [newPoolBorrowsSigner.address, newUserBorrowSigner.address],
    encryptContext,
    payer,
    [newPoolBorrowsSigner, newUserBorrowSigner]
  )
}