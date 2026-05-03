import { 
  Connection, 
  PublicKey, 
  Transaction, 
  TransactionInstruction, 
  SystemProgram, 
  Keypair 
} from '@solana/web3.js'
import { 
  ONYX_FHE_VAULT_PROGRAM_ID, 
  VAULT_SEED, 
  IX_DISC_CREATE_VAULT, 
  IX_DISC_EXECUTE_TRANSFER 
} from './program-id'
import { EncryptContextAccounts, buildEncryptContext } from './encrypt-context'

/**
 * Derives the PDA for a vault belonging to a specific payer.
 */
export function deriveVaultAddress(payer: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [VAULT_SEED, payer.toBuffer()],
    new PublicKey(ONYX_FHE_VAULT_PROGRAM_ID)
  )
}

/**
 * Creates a new FHE Vault on-chain.
 */
export async function createVault(
  connection: Connection,
  payer: Keypair
): Promise<string> {
  const [vault] = deriveVaultAddress(payer.publicKey)
  
  const data = IX_DISC_CREATE_VAULT

  const instruction = new TransactionInstruction({
    programId: new PublicKey(ONYX_FHE_VAULT_PROGRAM_ID),
    keys: [
      { pubkey: vault, isSigner: false, isWritable: true },
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  })

  const tx = new Transaction().add(instruction)
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
  tx.sign(payer)

  return await connection.sendRawTransaction(tx.serialize())
}

/**
 * Executes a confidential transfer via the FHE Vault program.
 * The vault program will CPI into the Encrypt program to execute the graph.
 */
export async function executeVaultTransfer(
  connection: Connection,
  payer: Keypair,
  graphBytes: Uint8Array,
  inputs: string[],
  outputs: string[],
): Promise<string> {
  const [vault] = deriveVaultAddress(payer.publicKey)
  const enc = await buildEncryptContext(ONYX_FHE_VAULT_PROGRAM_ID, payer.publicKey.toBase58())

  // Data: [disc 8b][graph_len u16 LE][graph_bytes][num_inputs u16 LE]
  const data = Buffer.alloc(8 + 2 + graphBytes.length + 2)
  IX_DISC_EXECUTE_TRANSFER.copy(data, 0)
  data.writeUInt16LE(graphBytes.length, 8)
  data.set(graphBytes, 10)
  data.writeUInt16LE(inputs.length, 10 + graphBytes.length)

  const keys = [
    { pubkey: vault, isSigner: false, isWritable: true },
    { pubkey: payer.publicKey, isSigner: true, isWritable: true },
    { pubkey: enc.config, isSigner: false, isWritable: false },
    { pubkey: enc.deposit, isSigner: false, isWritable: true },
    { pubkey: enc.cpiAuthority, isSigner: false, isWritable: false },
    { pubkey: enc.callerProgram, isSigner: false, isWritable: false },
    { pubkey: enc.networkEncryptionKey, isSigner: false, isWritable: false },
    { pubkey: enc.eventAuthority, isSigner: false, isWritable: false },
    { pubkey: enc.encryptProgram, isSigner: false, isWritable: false },
    ...inputs.map(ct => ({ pubkey: new PublicKey(ct), isSigner: false, isWritable: false })),
    ...outputs.map(ct => ({ pubkey: new PublicKey(ct), isSigner: false, isWritable: true })),
  ]

  const instruction = new TransactionInstruction({
    programId: new PublicKey(ONYX_FHE_VAULT_PROGRAM_ID),
    keys,
    data,
  })

  const tx = new Transaction().add(instruction)
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
  tx.sign(payer)

  return await connection.sendRawTransaction(tx.serialize())
}
