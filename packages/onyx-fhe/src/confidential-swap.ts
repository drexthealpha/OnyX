import { Connection, PublicKey, Keypair } from '@solana/web3.js'
import { EUint64, makeEUint64 } from './types'
import { EncryptContextAccounts } from './encrypt-context'
import { executeGraph, waitForVerified } from './refhe'

const K_INPUT = 0
const K_PLAINTEXT = 1
const K_CONSTANT = 2
const K_OP = 3
const K_OUTPUT = 4

const OP_ADD = 1
const OP_SUBTRACT = 2
const OP_IS_GREATER_OR_EQUAL = 18
const OP_SELECT = 60

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

function buildTransferGraph(): Uint8Array {
  const nodes: Buffer[] = [
    encodeNode(K_INPUT, 0, FHE_UINT64, 0, 0, 0),
    encodeNode(K_INPUT, 0, FHE_UINT64, 0, 0, 0),
    encodeNode(K_INPUT, 0, FHE_UINT64, 0, 0, 0),
    encodeNode(OP_IS_GREATER_OR_EQUAL, OP_IS_GREATER_OR_EQUAL, FHE_UINT64, 0, 2, 0),
    encodeNode(OP_SUBTRACT, OP_SUBTRACT, FHE_UINT64, 0, 2, 0),
    encodeNode(OP_ADD, OP_ADD, FHE_UINT64, 1, 2, 0),
    encodeNode(OP_SELECT, OP_SELECT, FHE_UINT64, 3, 4, 0),
    encodeNode(OP_SELECT, OP_SELECT, FHE_UINT64, 3, 5, 1),
    encodeNode(K_OUTPUT, 0, FHE_UINT64, 6, 0, 0),
    encodeNode(K_OUTPUT, 0, FHE_UINT64, 7, 0, 0),
  ]

  const constants = Buffer.alloc(0)
  const nodesData = Buffer.concat(nodes)

  const header = Buffer.alloc(13)
  header.writeUInt8(1, 0)
  header.writeUInt16LE(3, 1)
  header.writeUInt16LE(0, 3)
  header.writeUInt16LE(0, 5)
  header.writeUInt16LE(4, 7)
  header.writeUInt16LE(2, 9)
  header.writeUInt16LE(constants.length, 11)

  return Buffer.concat([header, constants, nodesData])
}

export async function transferFHE(
  from: EUint64,
  to: EUint64,
  amount: EUint64,
  connection: Connection,
  encryptContext: EncryptContextAccounts,
  payer: any
): Promise<[EUint64, EUint64]> {
  const inputs = [from.ciphertext, to.ciphertext, amount.ciphertext]

  // Deriving deterministic output PDAs instead of invalid string concatenation
  const [fromOut] = PublicKey.findProgramAddressSync(
    [Buffer.from('output'), new PublicKey(from.ciphertext).toBuffer()],
    encryptContext.encryptProgram
  )
  const [toOut] = PublicKey.findProgramAddressSync(
    [Buffer.from('output'), new PublicKey(to.ciphertext).toBuffer()],
    encryptContext.encryptProgram
  )

  const outputs: string[] = [fromOut.toBase58(), toOut.toBase58()]
  const graphBytes = buildTransferGraph()

  await executeGraph(connection, graphBytes, inputs, outputs, encryptContext, payer)

  return [makeEUint64(outputs[0]!), makeEUint64(outputs[1]!)]
}

export async function transferAndWait(
  from: EUint64,
  to: EUint64,
  amount: EUint64,
  connection: Connection,
  encryptContext: EncryptContextAccounts,
  payer: any
): Promise<[EUint64, EUint64]> {
  const inputs = [from.ciphertext, to.ciphertext, amount.ciphertext]
  
  // Use same deterministic PDA derivation
  const [fromOut] = PublicKey.findProgramAddressSync(
    [Buffer.from('output'), new PublicKey(from.ciphertext).toBuffer()],
    encryptContext.encryptProgram
  )
  const [toOut] = PublicKey.findProgramAddressSync(
    [Buffer.from('output'), new PublicKey(to.ciphertext).toBuffer()],
    encryptContext.encryptProgram
  )

  const outputs = [fromOut.toBase58(), toOut.toBase58()]
  const graphBytes = buildTransferGraph()

  await executeGraph(connection, graphBytes, inputs, outputs, encryptContext, payer)

  for (const out of outputs) {
    await waitForVerified(connection, new PublicKey(out))
  }

  return [makeEUint64(outputs[0]!), makeEUint64(outputs[1]!)]
}