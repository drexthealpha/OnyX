import { 
  address, 
  appendTransactionMessageInstruction, 
  createSolanaRpc, 
  createTransactionMessage, 
  pipe, 
  setTransactionMessageFeePayerSigner, 
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  Address,
  Rpc,
  SolanaRpcApi,
  TransactionSigner,
} from '@solana/kit'
import { getStructCodec, getBytesCodec, getU16Codec, addCodecSizePrefix, fixCodecSize } from '@solana/codecs'
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
export async function deriveVaultAddress(payer: Address): Promise<[Address, number]> {
  const { getProgramDerivedAddress, getAddressEncoder } = await import('@solana/addresses')
  const [pda, bump] = await getProgramDerivedAddress({
    programAddress: address(ONYX_FHE_VAULT_PROGRAM_ID),
    seeds: [new TextEncoder().encode('vault'), getAddressEncoder().encode(payer)],
  })
  return [pda, bump]
}

/**
 * Creates a new FHE Vault on-chain.
 */
export async function createVault(
  rpc: Rpc<SolanaRpcApi>,
  payer: TransactionSigner
): Promise<string> {
  const [vault] = await deriveVaultAddress(payer.address)
  
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (m) => setTransactionMessageFeePayerSigner(payer, m),
    (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
    (m) =>
      appendTransactionMessageInstruction(
        {
          programAddress: address(ONYX_FHE_VAULT_PROGRAM_ID),
          accounts: [
            { address: vault, role: 3 }, // Writable
            { address: payer.address, role: 3 }, // Writable + Signer
            { address: address('11111111111111111111111111111111'), role: 0 }, // SystemProgram
          ],
          data: IX_DISC_CREATE_VAULT,
        },
        m,
      ),
  );

  const fullySignedTransaction = await signTransactionMessageWithSigners(transactionMessage);
  const { getBase64EncodedWireTransaction } = await import('@solana/transactions');
  const wireTransaction = getBase64EncodedWireTransaction(fullySignedTransaction);
  
  return await rpc.sendTransaction(wireTransaction).send();
}

/**
 * Executes a confidential transfer via the FHE Vault program.
 * The vault program will CPI into the Encrypt program to execute the graph.
 */
export async function executeVaultTransfer(
  rpc: Rpc<SolanaRpcApi>,
  payer: TransactionSigner,
  graphBytes: Uint8Array,
  inputs: string[],
  outputs: string[],
): Promise<string> {
  const [vault] = await deriveVaultAddress(payer.address)
  const enc = await buildEncryptContext(rpc, address(ONYX_FHE_VAULT_PROGRAM_ID), payer.address)

  // Build instruction data using codecs
  const executeTransferCodec = getStructCodec([
    ['discriminator', fixCodecSize(getBytesCodec(), 8)],
    ['graph', addCodecSizePrefix(getBytesCodec(), getU16Codec())],
    ['numInputs', getU16Codec()],
  ]);

  const instructionData = executeTransferCodec.encode({
    discriminator: IX_DISC_EXECUTE_TRANSFER,
    graph: graphBytes,
    numInputs: inputs.length,
  });

  const keys = [
    { address: vault, role: 3 },
    { address: payer.address, role: 3 },
    { address: enc.config, role: 0 },
    { address: enc.deposit, role: 3 },
    { address: enc.cpiAuthority, role: 0 },
    { address: enc.callerProgram, role: 0 },
    { address: enc.networkEncryptionKey, role: 0 },
    { address: enc.eventAuthority, role: 0 },
    { address: enc.encryptProgram, role: 0 },
    { address: enc.systemProgram, role: 0 },   // required by EncryptContext
    ...inputs.map(ct => ({ address: address(ct), role: 0 })),
    ...outputs.map(ct => ({ address: address(ct), role: 3 })),
  ]

  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (m) => setTransactionMessageFeePayerSigner(payer, m),
    (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
    (m) =>
      appendTransactionMessageInstruction(
        {
          programAddress: address(ONYX_FHE_VAULT_PROGRAM_ID),
          accounts: keys,
          data: instructionData,
        },
        m,
      ),
  );

  const fullySignedTransaction = await signTransactionMessageWithSigners(transactionMessage);
  const { getBase64EncodedWireTransaction } = await import('@solana/transactions');
  const wireTransaction = getBase64EncodedWireTransaction(fullySignedTransaction);
  
  return await rpc.sendTransaction(wireTransaction).send();
}
