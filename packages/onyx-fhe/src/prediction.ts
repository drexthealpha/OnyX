import { 
  Connection, 
  PublicKey, 
  Transaction, 
  TransactionInstruction 
} from '@solana/web3.js'
import { EUint64, makeEUint64 } from './types'
import { EncryptContextAccounts } from './encrypt-context'
import { parseDecryptionRequest } from './sealed-bid'

export interface Market {
  id: string
  question: string
  yesCount: EUint64
  noCount: EUint64
  isOpen: boolean
  totalVotes: number
  resolvedYes?: bigint
  resolvedNo?: bigint
}

const DISC_ADD = 1 // Opcode for ADD in Encrypt program
const FHE_UINT64 = 4

/**
 * Creates a "virtual" market. In a real product, this would create accounts on-chain.
 * For now, we ground it by requiring valid ciphertext accounts for counts.
 */
export async function createMarket(
  question: string,
  yesCountCiphertext: string,
  noCountCiphertext: string
): Promise<Market> {
  return {
    id: `market_${Date.now()}`,
    question,
    yesCount: makeEUint64(yesCountCiphertext),
    noCount: makeEUint64(noCountCiphertext),
    isOpen: true,
    totalVotes: 0,
  }
}

/**
 * Casts a vote by executing an ADD graph on the Encrypt program.
 * Increments the yes/no count by 1 confidentially.
 */
export async function castVote(
  market: Market,
  vote: boolean,
  connection: Connection,
  encryptContext: EncryptContextAccounts,
  payer: unknown
): Promise<string> {
  if (!market.isOpen) throw new Error('Market is closed')

  const target = vote ? market.yesCount : market.noCount
  
  // We execute a simple ADD(target, 1) graph
  // Note: In a real implementation, we would build the graph bytes here
  // similar to buildTransferGraph in confidential-swap.ts
  
  const [outputPk] = PublicKey.findProgramAddressSync(
    [Buffer.from('output'), new PublicKey(target.ciphertext).toBuffer()],
    encryptContext.encryptProgram
  )

  const { executeGraph } = await import('./refhe.js')
  
  // Placeholder graph for ADD 1
  const graphBytes = Buffer.from([1, 0, 0, 0, 0]) // Dummy for now, would be real graph

  const sig = await executeGraph(
    connection,
    graphBytes,
    [target.ciphertext],
    [outputPk.toBase58()],
    encryptContext,
    payer
  )

  market.totalVotes++
  return sig
}

export async function resolveMarket(
  market: Market,
  requestAccounts: { yes: string; no: string },
  connection: Connection,
  payer: unknown
): Promise<{ yes: bigint; no: bigint }> {
  let yesResult: bigint = 0n
  let noResult: bigint = 0n

  for (const [key, label] of [
    [requestAccounts.yes, 'yes'] as const,
    [requestAccounts.no, 'no'] as const,
  ]) {
    const accountInfo = await connection.getAccountInfo(new PublicKey(key))
    if (accountInfo) {
      const parsed = parseDecryptionRequest(accountInfo.data)
      if (parsed.result !== null) {
        if (label === 'yes') yesResult = parsed.result
        else noResult = parsed.result
      }
    }
  }

  market.resolvedYes = yesResult
  market.resolvedNo = noResult
  market.isOpen = false

  return { yes: yesResult, no: noResult }
}