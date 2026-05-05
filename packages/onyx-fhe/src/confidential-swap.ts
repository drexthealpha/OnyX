import { 
  address, 
  Address, 
  Rpc, 
  SolanaRpcApi, 
  TransactionSigner 
} from '@solana/kit'
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

function buildTransferGraph(): Uint8Array {
  const nodes: Uint8Array[] = [
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
  const nodesData = Buffer.concat(nodes.map(n => Buffer.from(n)))

  const header = Buffer.alloc(13)
  header.writeUInt8(1, 0)
  header.writeUInt16LE(3, 1)
  header.writeUInt16LE(0, 3)
  header.writeUInt16LE(0, 5)
  header.writeUInt16LE(4, 7)
  header.writeUInt16LE(2, 9)
  header.writeUInt16LE(constants.length, 11)

  return new Uint8Array(Buffer.concat([header, constants, nodesData]))
}

export async function transferFHE(
  from: EUint64,
  to: EUint64,
  amount: EUint64,
  rpc: Rpc<SolanaRpcApi>,
  encryptContext: EncryptContextAccounts,
  payer: TransactionSigner
): Promise<[EUint64, EUint64]> {
  const inputs = [from.ciphertext, to.ciphertext, amount.ciphertext]

  // Output ciphertexts are keypair accounts, not PDAs (per Encrypt docs)
  const { generateKeyPairSigner } = await import('@solana/kit')
  const fromOutSigner = await generateKeyPairSigner()
  const toOutSigner   = await generateKeyPairSigner()

  const outputs: string[] = [fromOutSigner.address, toOutSigner.address]
  const graphBytes = buildTransferGraph()

  await executeGraph(rpc, graphBytes, inputs, outputs, encryptContext, payer, [fromOutSigner, toOutSigner])

  return [makeEUint64(fromOutSigner.address), makeEUint64(toOutSigner.address)]
}

export async function transferAndWait(
  from: EUint64,
  to: EUint64,
  amount: EUint64,
  rpc: Rpc<SolanaRpcApi>,
  encryptContext: EncryptContextAccounts,
  payer: TransactionSigner
): Promise<[EUint64, EUint64]> {
  const inputs = [from.ciphertext, to.ciphertext, amount.ciphertext]

  // Output ciphertexts are keypair accounts, not PDAs (per Encrypt docs)
  const { generateKeyPairSigner } = await import('@solana/kit')
  const fromOutSigner = await generateKeyPairSigner()
  const toOutSigner   = await generateKeyPairSigner()

  const outputs = [fromOutSigner.address, toOutSigner.address]
  const graphBytes = buildTransferGraph()

  await executeGraph(rpc, graphBytes, inputs, outputs, encryptContext, payer, [fromOutSigner, toOutSigner])

  for (const out of outputs) {
    await waitForVerified(rpc, address(out))
  }

  return [makeEUint64(fromOutSigner.address), makeEUint64(toOutSigner.address)]
}