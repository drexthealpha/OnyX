import { Connection, PublicKey, Keypair } from '@solana/web3.js'
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

const DISC_CREATE_PLAINTEXT = 2
const FHE_BOOL = 0
const FHE_UINT64 = 4

let marketCounter = 0

export async function createMarket(
  question: string,
  connection: Connection,
  encryptContext: EncryptContextAccounts,
  payer: any
): Promise<Market> {
  const id = `market_${Date.now()}_${++marketCounter}`

  const [yesKey, noKey] = [
    new Keypair().publicKey.toBase58(),
    new Keypair().publicKey.toBase58(),
  ]

  return {
    id,
    question,
    yesCount: makeEUint64(yesKey),
    noCount: makeEUint64(noKey),
    isOpen: true,
    totalVotes: 0,
  }
}

export async function castVote(
  market: Market,
  vote: boolean,
  connection: Connection,
  encryptContext: EncryptContextAccounts,
  payer: any
): Promise<void> {
  if (!market.isOpen) throw new Error('Market is closed')

  const targetCiphertext = vote ? market.yesCount.ciphertext : market.noCount.ciphertext

  const data = Buffer.alloc(2)
  data.writeUInt8(DISC_CREATE_PLAINTEXT, 0)
  data.writeUInt8(vote ? 1 : 0, 1)

  market.totalVotes++
}

export async function resolveMarket(
  market: Market,
  requestAccounts: { yes: string; no: string },
  connection: Connection,
  payer: any
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

  if (market.resolvedYes !== undefined) market.resolvedYes = yesResult
  if (market.resolvedNo !== undefined) market.resolvedNo = noResult
  market.isOpen = false

  return { yes: yesResult, no: noResult }
}