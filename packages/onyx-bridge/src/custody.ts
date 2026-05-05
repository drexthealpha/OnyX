import { 
  address, 
  appendTransactionMessageInstruction, 
  createSolanaRpc, 
  createTransactionMessage, 
  fetchEncodedAccount, 
  pipe, 
  setTransactionMessageFeePayerSigner, 
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  Address,
  Rpc,
  SolanaRpcApi,
  TransactionSigner,
} from '@solana/kit';
import { getStructCodec, getBytesCodec, getU8Codec } from '@solana/codecs';
import { CPI_AUTHORITY_SEED, IKA_PROGRAM_ID, TransferOptions } from './types';

export async function getCPIAuthority(callerProgramId: Address): Promise<[Address, number]> {
  const { getProgramDerivedAddress } = await import('@solana/addresses');
  const [pda, bump] = await getProgramDerivedAddress({
    programAddress: address(callerProgramId),
    seeds: [new TextEncoder().encode(CPI_AUTHORITY_SEED)],
  });
  return [pda, bump];
}

export async function verifyAuthority(dwalletData: Uint8Array, expectedAuthority: Address): Promise<boolean> {
  if (dwalletData.length < 34) {
    return false;
  }
  
  const authority = dwalletData.subarray(2, 34);
  const { getAddressEncoder } = await import('@solana/addresses');
  const expectedBytes = getAddressEncoder().encode(expectedAuthority);
  
  return authority.every((b, i) => b === expectedBytes[i]);
}

export async function transferToCPIAuthority(options: TransferOptions): Promise<string> {
  const { rpc, dwalletPda, newAuthority, payer } = options;
  
  const { fixCodecSize } = await import('@solana/codecs');
  const transferIxCodec = getStructCodec([
    ['discriminator', getU8Codec()],
    ['newAuthority', fixCodecSize(getBytesCodec(), 32)],
  ]);

  const { getAddressEncoder } = await import('@solana/addresses');
  const instructionData = transferIxCodec.encode({
    discriminator: 24,
    newAuthority: getAddressEncoder().encode(newAuthority),
  });
  
  const dwalletProgramId = address(IKA_PROGRAM_ID);
  
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (m) => setTransactionMessageFeePayerSigner(payer, m),
    (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
    (m) =>
      appendTransactionMessageInstruction(
        {
          programAddress: dwalletProgramId,
          accounts: [
            { address: payer.address, role: 1 }, // Signer
            { address: dwalletPda, role: 3 }, // Writable
          ],
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

export async function readCurrentAuthority(rpc: Rpc<SolanaRpcApi>, dwalletPda: Address): Promise<Address | null> {
  try {
    const account = await fetchEncodedAccount(rpc, dwalletPda);
    if (!account.exists || account.data.length < 34) {
      return null;
    }
    
    const authorityBytes = account.data.subarray(2, 34);
    const { getAddressDecoder } = await import('@solana/addresses');
    return getAddressDecoder().decode(authorityBytes);
  } catch {
    return null;
  }
}

export async function isCPIAuthorized(dwalletPda: Address, callerProgramId: Address, rpc: Rpc<SolanaRpcApi>): Promise<boolean> {
  try {
    const [cpiAuth] = await getCPIAuthority(callerProgramId);
    const currentAuth = await readCurrentAuthority(rpc, dwalletPda);
    
    if (!currentAuth) {
      return false;
    }
    
    return currentAuth === cpiAuth;
  } catch {
    return false;
  }
}

export async function batchTransfer(options: {
  rpc: Rpc<SolanaRpcApi>;
  transfers: Array<{
    dwalletPda: Address;
    newAuthority: Address;
  }>;
  payer: TransactionSigner;
}): Promise<string[]> {
  const { rpc, transfers, payer } = options;
  
  const txSigs: string[] = [];
  
  for (const transfer of transfers) {
    try {
      const txSig = await transferToCPIAuthority({
        rpc,
        dwalletPda: transfer.dwalletPda,
        newAuthority: transfer.newAuthority,
        payer,
      });
      txSigs.push(txSig);
    } catch (error) {
      throw new Error(`Batch transfer failed at ${txSigs.length}: ${error}`);
    }
  }
  
  return txSigs;
}