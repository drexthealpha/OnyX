import { Connection, PublicKey, Keypair } from '@solana/web3.js'
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

function encodeNode(kind: number, opType: number, fheType: number, a: number, b: number, c: number): Buffer {
  const buf = Buffer.alloc(9)
  buf.writeUInt8(kind, 0)
  buf.writeUInt8(opType, 1)
  buf.writeUInt8(fheType, 2)
  buf.writeUInt16LE(a, 3)
  buf.writeUInt16LE(b, 5)
  buf.writeUInt16LE(c, 7)
  return buf
}

function uint64ToEUint128LE(value: bigint): Buffer {
  const buf = Buffer.alloc(16)
  buf.writeBigUInt64LE(value & BigInt('0xFFFFFFFFFFFFFFFF'), 0)
  buf.writeBigUInt64LE(0n, 8)
  return buf
}

function buildSwapGraph(): Uint8Array {
  const nodes: Buffer[] = [
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

  const nodesData = Buffer.concat(nodes)

  const header = Buffer.alloc(13)
  header.writeUInt8(1, 0)
  header.writeUInt16LE(4, 1)
  header.writeUInt16LE(0, 3)
  header.writeUInt16LE(2, 5)
  header.writeUInt16LE(7, 7)
  header.writeUInt16LE(1, 9)
  header.writeUInt16LE(constants.length, 11)

  return Buffer.concat([header, constants, nodesData])
}

export async function swapFHE(
  reserveIn: EUint128,
  reserveOut: EUint128,
  amountIn: EUint64,
  minOut: EUint64,
  connection: Connection,
  encryptContext: EncryptContextAccounts,
  payer: any
): Promise<EUint64> {
  const inputs = [reserveIn.ciphertext, reserveOut.ciphertext, amountIn.ciphertext, minOut.ciphertext]
  
  const [outPubkey] = PublicKey.findProgramAddressSync(
    [Buffer.from('output'), new PublicKey(amountIn.ciphertext).toBuffer()],
    encryptContext.encryptProgram
  )
  const outputs = [outPubkey.toBase58()]
  const graphBytes = buildSwapGraph()

  await executeGraph(connection, graphBytes, inputs, outputs, encryptContext, payer)

  return makeEUint64(outputs[0]!)
}