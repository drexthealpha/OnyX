// packages/onyx-bridge/src/shared-access.ts

import { Connection, PublicKey, Keypair, Transaction, TransactionInstruction, sendAndConfirmTransaction, SystemProgram } from '@solana/web3.js';
import { SharedAccessOptions } from './types';

export const SHARED_ACCESS_PREFIX = Buffer.from('shared_access');

export class SharedAccessManager {
  private connection: Connection;
  private programId: PublicKey;
  
  constructor(connection: Connection, programId: PublicKey) {
    this.connection = connection;
    this.programId = programId;
  }
  
  static async grant(options: SharedAccessOptions): Promise<string> {
    const { owner, grantee, connection, durationSeconds, maxAmountLamports } = options;
    
    const programId = new PublicKey('87W54kGYFQ1rgWqMeu4XTPHWXWmXSQCcjm8vCTfiq1oY');
    
    const seeds = [
      SHARED_ACCESS_PREFIX,
      Buffer.from(owner.toBytes()),
      Buffer.from(grantee.toBytes()),
    ];
    const [pda] = PublicKey.findProgramAddressSync(seeds, programId);
    
    const duration = durationSeconds || 86400;
    const maxAmount = maxAmountLamports || 0n;
    const expiry = BigInt(Math.floor(Date.now() / 1000) + duration);
    
    const instructionData = Buffer.alloc(50);
    instructionData.writeUInt8(100, 0);
    instructionData.writeBigInt64LE(expiry, 1);
    instructionData.writeBigInt64LE(maxAmount, 9);
    instructionData.writeUInt8(1, 17);
    
    const grantIx = new TransactionInstruction({
      programId,
      keys: [
        { pubkey: pda, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: true, isWritable: false },
        { pubkey: grantee, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: instructionData,
    });
    
    const tx = new Transaction().add(grantIx);
    const payer = Keypair.generate();
    
    return await sendAndConfirmTransaction(connection, tx, [payer]);
  }
  
  static async revoke(options: {
    owner: PublicKey;
    grantee: PublicKey;
    connection: Connection;
  }): Promise<string> {
    const { owner, grantee, connection } = options;
    
    const programId = new PublicKey('87W54kGYFQ1rgWqMeu4XTPHWXWmXSQCcjm8vCTfiq1oY');
    
    const seeds = [
      SHARED_ACCESS_PREFIX,
      Buffer.from(owner.toBytes()),
      Buffer.from(grantee.toBytes()),
    ];
    const [pda] = PublicKey.findProgramAddressSync(seeds, programId);
    
    const instructionData = Buffer.alloc(1);
    instructionData.writeUInt8(101, 0);
    
    const revokeIx = new TransactionInstruction({
      programId,
      keys: [
        { pubkey: pda, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: true, isWritable: false },
      ],
      data: instructionData,
    });
    
    const tx = new Transaction().add(revokeIx);
    const payer = Keypair.generate();
    
    return await sendAndConfirmTransaction(connection, tx, [payer]);
  }
  
  static async checkAccess(options: {
    owner: PublicKey;
    grantee: PublicKey;
    connection: Connection;
  }): Promise<{ hasAccess: boolean; expiry: bigint; maxAmount: bigint }> {
    const { owner, grantee, connection } = options;
    
    const programId = new PublicKey('87W54kGYFQ1rgWqMeu4XTPHWXWmXSQCcjm8vCTfiq1oY');
    
    const seeds = [
      SHARED_ACCESS_PREFIX,
      Buffer.from(owner.toBytes()),
      Buffer.from(grantee.toBytes()),
    ];
    const [pda] = PublicKey.findProgramAddressSync(seeds, programId);
    
    try {
      const accountInfo = await connection.getAccountInfo(pda);
      if (!accountInfo || accountInfo.data.length < 25) {
        return { hasAccess: false, expiry: 0n, maxAmount: 0n };
      }
      
      const data = Buffer.from(accountInfo.data);
      const discriminator = data[0];
      
      if (discriminator !== 100) {
        return { hasAccess: false, expiry: 0n, maxAmount: 0n };
      }
      
      const expiry = data.readBigInt64LE(1);
      const currentTime = BigInt(Math.floor(Date.now() / 1000));
      
      if (expiry <= currentTime) {
        return { hasAccess: false, expiry, maxAmount: 0n };
      }
      
      const maxAmount = data.readBigInt64LE(9);
      
      return { hasAccess: true, expiry, maxAmount };
    } catch {
      return { hasAccess: false, expiry: 0n, maxAmount: 0n };
    }
  }
  
  static async executeWithSharedAccess(options: {
    owner: PublicKey;
    grantee: PublicKey;
    connection: Connection;
    instructions: TransactionInstruction[];
  }): Promise<string> {
    const { owner, grantee, connection, instructions } = options;
    
    const access = await SharedAccessManager.checkAccess({
      owner,
      grantee,
      connection,
    });
    
    if (!access.hasAccess) {
      throw new Error('Shared access not granted or expired');
    }
    
    const tx = new Transaction();
    for (const ix of instructions) {
      tx.add(ix);
    }
    
    const payer = Keypair.generate();
    
    return await sendAndConfirmTransaction(connection, tx, [payer]);
  }
  
  static async delegateAccess(options: {
    fromGrantor: PublicKey;
    toGrantee: PublicKey;
    connection: Connection;
    maxAmount: bigint;
    durationSeconds: number;
  }): Promise<string> {
    const { fromGrantor, toGrantee, connection, maxAmount, durationSeconds } = options;
    
    return SharedAccessManager.grant({
      owner: fromGrantor,
      grantee: toGrantee,
      connection,
      maxAmountLamports: maxAmount,
      durationSeconds,
    });
  }
}

export async function grantSharedAccess(options: SharedAccessOptions): Promise<string> {
  return SharedAccessManager.grant(options);
}

export async function revokeSharedAccess(options: {
  owner: PublicKey;
  grantee: PublicKey;
  connection: Connection;
}): Promise<string> {
  return SharedAccessManager.revoke(options);
}

export async function checkSharedAccess(options: {
  owner: PublicKey;
  grantee: PublicKey;
  connection: Connection;
}): Promise<{ hasAccess: boolean; expiry: bigint; maxAmount: bigint }> {
  return SharedAccessManager.checkAccess(options);
}