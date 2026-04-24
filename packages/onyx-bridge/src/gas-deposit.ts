// packages/onyx-bridge/src/gas-deposit.ts

import { Connection, PublicKey, Keypair, Transaction, TransactionInstruction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';
import { IKA_PROGRAM_ID, DISC_GAS_DEPOSIT, GAS_DEPOSIT_LEN, GasDepositOptions } from './types';

export function getGasDepositPda(userPubkey: Uint8Array, programId?: string): [PublicKey, number] {
  const programIdObj = new PublicKey(programId || IKA_PROGRAM_ID);
  const seeds = [Buffer.from('gas_deposit'), Buffer.from(userPubkey)];
  return PublicKey.findProgramAddressSync(seeds, programIdObj);
}

export const INSTRUCTION_CREATE_DEPOSIT = 36;
export const INSTRUCTION_TOP_UP = 37;
export const INSTRUCTION_SETTLE_GAS = 38;
export const INSTRUCTION_REQUEST_WITHDRAW = 44;
export const INSTRUCTION_WITHDRAW = 45;

export const IKA_BALANCE_OFFSET = 34;
export const SOL_BALANCE_OFFSET = 42;

export async function createGasDeposit(options: GasDepositOptions): Promise<string> {
  const { connection, userPubkey, amountLamports, isIkaBalance, payer } = options;
  
  const [gasDepositPda, bump] = getGasDepositPda(userPubkey);
  
  const instructionData = Buffer.alloc(34);
  instructionData.writeUInt8(INSTRUCTION_CREATE_DEPOSIT, 0);
  instructionData.writeUInt8(bump, 1);
  instructionData.writeUInt8(isIkaBalance ? 1 : 0, 2);
  instructionData.writeBigUInt64LE(BigInt(amountLamports), 3);
  
  const programId = new PublicKey(IKA_PROGRAM_ID);
  
  const createIx = new TransactionInstruction({
    programId,
    keys: [
      { pubkey: gasDepositPda, isSigner: false, isWritable: true },
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: instructionData,
  });
  
  const tx = new Transaction().add(createIx);
  const txSig = await sendAndConfirmTransaction(connection, tx, [payer]);
  
  return txSig;
}

export async function topUpGasDeposit(options: GasDepositOptions): Promise<string> {
  const { connection, userPubkey, amountLamports, isIkaBalance, payer } = options;
  
  const [gasDepositPda] = getGasDepositPda(userPubkey);
  
  const instructionData = Buffer.alloc(34);
  instructionData.writeUInt8(INSTRUCTION_TOP_UP, 0);
  instructionData.writeUInt8(isIkaBalance ? 1 : 0, 1);
  instructionData.writeBigUInt64LE(BigInt(amountLamports), 3);
  
  const programId = new PublicKey(IKA_PROGRAM_ID);
  
  const topUpIx = new TransactionInstruction({
    programId,
    keys: [
      { pubkey: gasDepositPda, isSigner: false, isWritable: true },
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: instructionData,
  });
  
  const tx = new Transaction().add(topUpIx);
  const txSig = await sendAndConfirmTransaction(connection, tx, [payer]);
  
  return txSig;
}

export async function settleGas(options: {
  connection: Connection;
  userPubkey: Uint8Array;
  ikawalletPda: PublicKey;
  amountLamports: bigint;
  payer: Keypair;
}): Promise<string> {
  const { connection, userPubkey, ikawalletPda, amountLamports, payer } = options;
  
  const [gasDepositPda] = getGasDepositPda(userPubkey);
  
  const instructionData = Buffer.alloc(35);
  instructionData.writeUInt8(INSTRUCTION_SETTLE_GAS, 0);
  instructionData.writeBigUInt64LE(BigInt(amountLamports), 3);
  
  const programId = new PublicKey(IKA_PROGRAM_ID);
  
  const settleIx = new TransactionInstruction({
    programId,
    keys: [
      { pubkey: gasDepositPda, isSigner: false, isWritable: true },
      { pubkey: ikawalletPda, isSigner: false, isWritable: true },
      { pubkey: payer.publicKey, isSigner: true, isWritable: false },
    ],
    data: instructionData,
  });
  
  const tx = new Transaction().add(settleIx);
  const txSig = await sendAndConfirmTransaction(connection, tx, [payer]);
  
  return txSig;
}

export async function requestWithdraw(options: {
  connection: Connection;
  userPubkey: Uint8Array;
  recipient: PublicKey;
  amountLamports: bigint;
  payer: Keypair;
}): Promise<string> {
  const { connection, userPubkey, recipient, amountLamports, payer } = options;
  
  const [gasDepositPda] = getGasDepositPda(userPubkey);
  
  const instructionData = Buffer.alloc(67);
  instructionData.writeUInt8(INSTRUCTION_REQUEST_WITHDRAW, 0);
  instructionData.writeBigUInt64LE(BigInt(amountLamports), 3);
  Buffer.from(recipient.toBytes()).copy(instructionData, 11);
  
  const programId = new PublicKey(IKA_PROGRAM_ID);
  
  const requestIx = new TransactionInstruction({
    programId,
    keys: [
      { pubkey: gasDepositPda, isSigner: false, isWritable: true },
      { pubkey: payer.publicKey, isSigner: true, isWritable: false },
    ],
    data: instructionData,
  });
  
  const tx = new Transaction().add(requestIx);
  const txSig = await sendAndConfirmTransaction(connection, tx, [payer]);
  
  return txSig;
}

export async function withdrawGas(options: {
  connection: Connection;
  userPubkey: Uint8Array;
  recipient: PublicKey;
  amountLamports: bigint;
  payer: Keypair;
}): Promise<string> {
  const { connection, userPubkey, recipient, amountLamports, payer } = options;
  
  const [gasDepositPda] = getGasDepositPda(userPubkey);
  
  const instructionData = Buffer.alloc(67);
  instructionData.writeUInt8(INSTRUCTION_WITHDRAW, 0);
  instructionData.writeBigUInt64LE(BigInt(amountLamports), 3);
  Buffer.from(recipient.toBytes()).copy(instructionData, 11);
  
  const programId = new PublicKey(IKA_PROGRAM_ID);
  
  const withdrawIx = new TransactionInstruction({
    programId,
    keys: [
      { pubkey: gasDepositPda, isSigner: false, isWritable: true },
      { pubkey: recipient, isSigner: false, isWritable: true },
      { pubkey: payer.publicKey, isSigner: true, isWritable: false },
    ],
    data: instructionData,
  });
  
  const tx = new Transaction().add(withdrawIx);
  const txSig = await sendAndConfirmTransaction(connection, tx, [payer]);
  
  return txSig;
}

export async function readGasDepositBalance(connection: Connection, userPubkey: Uint8Array): Promise<{
  ikaBalance: bigint;
  solBalance: bigint;
}> {
  const [gasDepositPda] = getGasDepositPda(userPubkey);
  
  try {
    const accountInfo = await connection.getAccountInfo(gasDepositPda);
    if (!accountInfo || accountInfo.data.length < GAS_DEPOSIT_LEN) {
      return { ikaBalance: 0n, solBalance: 0n };
    }
    
    const data = Buffer.from(accountInfo.data);
    const discriminator = data[0];
    
    if (discriminator !== DISC_GAS_DEPOSIT) {
      return { ikaBalance: 0n, solBalance: 0n };
    }
    
    const ikaBalance = data.readBigUInt64LE(IKA_BALANCE_OFFSET);
    const solBalance = data.readBigUInt64LE(SOL_BALANCE_OFFSET);
    
    return { ikaBalance, solBalance };
  } catch {
    return { ikaBalance: 0n, solBalance: 0n };
  }
}