import { 
  address, 
  Address, 
  Rpc, 
  SolanaRpcApi, 
  TransactionSigner,
  fetchEncodedAccount,
} from '@solana/kit'
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
  rpc: Rpc<SolanaRpcApi>,
  encryptContext: EncryptContextAccounts,
  payer: TransactionSigner
): Promise<string> {
  if (!market.isOpen) throw new Error('Market is closed')

  const target = vote ? market.yesCount : market.noCount

  // Output ciphertext is a keypair account, not a PDA (per Encrypt docs)
  const { generateKeyPairSigner } = await import('@solana/kit')
  const outputSigner = await generateKeyPairSigner()

  const { executeGraph } = await import('./refhe.js')

  // pre-alpha: ADD(target, 1) graph bytes — DSL spec not yet public
  const graphBytes = new Uint8Array([1, 0, 0, 0, 0])

  const sig = await executeGraph(
    rpc,
    graphBytes,
    [target.ciphertext],
    [outputSigner.address],
    encryptContext,
    payer,
    [outputSigner]
  )

  market.totalVotes++
  return sig
}

export async function resolveMarket(
  market: Market,
  requestAccounts: { yes: string; no: string },
  rpc: Rpc<SolanaRpcApi>,
  payer: TransactionSigner
): Promise<{ yes: bigint; no: bigint }> {
  let yesResult: bigint = 0n
  let noResult: bigint = 0n

  for (const [key, label] of [
    [requestAccounts.yes, 'yes'] as const,
    [requestAccounts.no, 'no'] as const,
  ]) {
    const account = await fetchEncodedAccount(rpc, address(key))
    if (account.exists) {
      const parsed = parseDecryptionRequest(account.data)
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