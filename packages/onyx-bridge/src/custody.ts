// packages/onyx-bridge/src/custody.ts

import { Connection, PublicKey, Keypair, Transaction, TransactionInstruction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';
import { CPI_AUTHORITY_SEED, IKA_PROGRAM_ID, TransferOptions } from './types';

export function getCPIAuthority(callerProgramId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([CPI_AUTHORITY_SEED], callerProgramId);
}

export function verifyAuthority(dwalletData: Buffer, expectedAuthority: PublicKey): boolean {
  if (dwalletData.length < 34) {
    return false;
  }
  
  const authority = dwalletData.subarray(2, 34);
  const expectedBytes = expectedAuthority.toBytes();
  
  return authority.equals(Buffer.from(expectedBytes));
}

export async function transferToCPIAuthority(options: TransferOptions): Promise<string> {
  const { connection, dwalletPda, newAuthority, payer } = options;
  
  const instructionData = Buffer.alloc(33);
  instructionData.writeUInt8(24, 0);
  Buffer.from(newAuthority.toBytes()).copy(instructionData, 1);
  
  const programId = new PublicKey(IKA_PROGRAM_ID);
  const [cpiAuthority] = getCPIAuthority(programId);
  
  const { SystemProgram } = await import('@solana/web3.js');
  const { Token } = await import('@solana/spl-token');
  
  const accounts: Array<{
    pubkey: PublicKey;
    isSigner: boolean;
    isWritable: boolean;
  }> = [
    { pubkey: dwalletPda, isSigner: false, isWritable: true },
    { pubkey: new PublicKey(IKA_PROGRAM_ID), isSigner: false, isWritable: false },
  ];
  
  try {
    const tokenProgram = new Token(connection, dwalletPda, programId, payer);
    const accountInfo = await tokenProgram.getAccountInfo(dwalletPda);
    
    if (accountInfo) {
      accounts.push(
        { pubkey: accountInfo.mint, isSigner: false, isWritable: false },
        { pubkey: payer.publicKey, isSigner: true, isWritable: false }
      );
    }
  } catch {
    accounts.push({ pubkey: payer.publicKey, isSigner: true, isWritable: false });
  }
  
  const transferIx = new TransactionInstruction({
    programId,
    keys: accounts,
    data: instructionData,
  });
  
  const tx = new Transaction().add(transferIx);
  
  try {
    const txSig = await sendAndConfirmTransaction(connection, tx, [payer]);
    return txSig;
  } catch (error) {
    throw new Error(`Transfer failed: ${error}`);
  }
}

export async function readCurrentAuthority(connection: Connection, dwalletPda: PublicKey): Promise<PublicKey | null> {
  try {
    const accountInfo = await connection.getAccountInfo(dwalletPda);
    if (!accountInfo || accountInfo.data.length < 34) {
      return null;
    }
    
    const authorityBytes = accountInfo.data.subarray(2, 34);
    return new PublicKey(authorityBytes);
  } catch {
    return null;
  }
}

export async function isCPIAuthorized(dwalletPda: PublicKey, callerProgramId: PublicKey, connection: Connection): Promise<boolean> {
  try {
    const [cpiAuth] = getCPIAuthority(callerProgramId);
    const currentAuth = await readCurrentAuthority(connection, dwalletPda);
    
    if (!currentAuth) {
      return false;
    }
    
    return currentAuth.equals(cpiAuth);
  } catch {
    return false;
  }
}

export async function batchTransfer(options: {
  connection: Connection;
  transfers: Array<{
    dwalletPda: PublicKey;
    newAuthority: PublicKey;
  }>;
  payer: Keypair;
}): Promise<string[]> {
  const { connection, transfers, payer } = options;
  
  const txSigs: string[] = [];
  
  for (const transfer of transfers) {
    try {
      const txSig = await transferToCPIAuthority({
        connection,
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