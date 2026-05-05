import { 
  address, 
  Address, 
  Rpc, 
  SolanaRpcApi, 
  TransactionSigner 
} from '@solana/kit'
import { EUint64, EUint128, makeEUint64, makeEUint128 } from './types'
import { EncryptContextAccounts } from './encrypt-context'
import { executeGraph } from './refhe'

const K_INPUT = 0
const K_OUTPUT = 4

const OP_ADD = 1
const OP_SUBTRACT = 2
const OP_MULTIPLY = 3
const OP_DIVIDE = 4
const OP_IS_GREATER_OR_EQUAL = 18
const OP_SELECT = 60

const FHE_UINT128 = 5
const FHE_UINT64 = 4

function encodeNode(kind: number, opType: number, fheType: number, a: number, b: number, c: number): Uint8Array {
  const buf = new Uint8Array(9)
  const view = new DataView(buf.buffer)
  view.setUint8(0, kind)
  view.setUint8(1, opType)
  view.setUint8(2, fheType)
  view.setUint16(3, a, true)
  view.setUint16(5, b, true)
  view.setUint16(7, c, true)
  return buf
}

function uint64ToEUint128LE(value: bigint): Uint8Array {
  const buf = new Uint8Array(16)
  const view = new DataView(buf.buffer)
  view.setBigUint64(0, value & 0xFFFFFFFFFFFFFFFFn, true)
  view.setBigUint64(8, 0n, true)
  return buf
}

function buildSwapGraph(): Uint8Array {
  const nodes: Uint8Array[] = [
    encodeNode(K_INPUT, 0, FHE_UINT128, 0, 0, 0),
    encodeNode(K_INPUT, 0, FHE_UINT128, 0, 0, 0),
    encodeNode(K_INPUT, 0, FHE_UINT64, 0, 0, 0),
    encodeNode(K_INPUT, 0, FHE_UINT64, 0, 0, 0),
    encodeNode(OP_MULTIPLY, OP_MULTIPLY, FHE_UINT64, 2, 0, 0),
    encodeNode(OP_MULTIPLY, OP_MULTIPLY, FHE_UINT128, 4, 1, 0),
    encodeNode(OP_MULTIPLY, OP_MULTIPLY, FHE_UINT128, 2, 0, 0),
    encodeNode(OP_MULTIPLY, OP_MULTIPLY, FHE_UINT128, 1, 0, 0),
    encodeNode(OP_MULTIPLY, OP_MULTIPLY, FHE_UINT128, 7, 0, 0),
    encodeNode(OP_ADD, OP_ADD, FHE_UINT128, 6, 8, 0),
    encodeNode(OP_DIVIDE, OP_DIVIDE, FHE_UINT128, 5, 9, 0),
    encodeNode(OP_IS_GREATER_OR_EQUAL, OP_IS_GREATER_OR_EQUAL, FHE_UINT64, 10, 3, 0),
    encodeNode(K_OUTPUT, 0, FHE_UINT128, 10, 0, 0),
  ]

  const constants = Buffer.concat([
    uint64ToEUint128LE(997n),
    uint64ToEUint128LE(1000n),
  ])

  const nodesData = Buffer.concat(nodes.map(n => Buffer.from(n)))

  const header = Buffer.alloc(13)
  header.writeUInt8(1, 0)
  header.writeUInt16LE(4, 1)
  header.writeUInt16LE(0, 3)
  header.writeUInt16LE(2, 5)
  header.writeUInt16LE(7, 7)
  header.writeUInt16LE(1, 9)
  header.writeUInt16LE(constants.length, 11)

  return new Uint8Array(Buffer.concat([header, constants, nodesData]))
}

export async function swapFHE(
  reserveIn: EUint128,
  reserveOut: EUint128,
  amountIn: EUint64,
  minOut: EUint64,
  rpc: Rpc<SolanaRpcApi>,
  encryptContext: EncryptContextAccounts,
  payer: TransactionSigner
): Promise<EUint64> {
  const inputs = [reserveIn.ciphertext, reserveOut.ciphertext, amountIn.ciphertext, minOut.ciphertext]
  
  // Output ciphertext is a keypair account, not a PDA (per Encrypt docs)
  const { generateKeyPairSigner } = await import('@solana/kit')
  const outSigner = await generateKeyPairSigner()
  const outputs = [outSigner.address]
  const graphBytes = buildSwapGraph()

  await executeGraph(rpc, graphBytes, inputs, outputs, encryptContext, payer, [outSigner])

  return makeEUint64(outSigner.address)
}