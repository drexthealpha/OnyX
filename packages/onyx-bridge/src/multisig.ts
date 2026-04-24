// packages/onyx-bridge/src/multisig.ts

import { Connection, PublicKey, Keypair, Transaction, TransactionInstruction, sendAndConfirmTransaction } from '@solana/web3.js';
import { VoteResult, MultisigConfig, MultisigOptions, VoteOptions } from './types';

export class OnyxMultisig {
  private connection: Connection;
  private programId: PublicKey;
  private pda: PublicKey;
  private state: {
    threshold: number;
    members: Map<string, boolean>;
    votes: Map<string, boolean>;
    nonce: number;
    approved: boolean;
    rejected: boolean;
  };
  
  constructor(connection: Connection, programId: PublicKey, pda: PublicKey) {
    this.connection = connection;
    this.programId = programId;
    this.pda = pda;
    this.state = {
      threshold: 0,
      members: new Map(),
      votes: new Map(),
      nonce: 0,
      approved: false,
      rejected: false,
    };
  }
  
  static async create(options: MultisigOptions): Promise<OnyxMultisig> {
    const { connection, programId, members, threshold, payer } = options;
    
    const seeds = [Buffer.from('multisig'), Buffer.from([...members].sort().map(m => m.toBase58()).join(''))];
    const [pda] = PublicKey.findProgramAddressSync(seeds, programId);
    
    const instructionData = Buffer.alloc(4 + members.length * 32);
    instructionData.writeUInt32LE(members.length, 0);
    instructionData.writeUInt8(threshold, 4);
    
    for (let i = 0; i < members.length; i++) {
      Buffer.from(members[i].toBytes()).copy(instructionData, 5 + i * 32);
    }
    
    const initIx = new TransactionInstruction({
      programId,
      keys: [
        { pubkey: pda, isSigner: false, isWritable: true },
        { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      ],
      data: instructionData,
    });
    
    const tx = new Transaction().add(initIx);
    await sendAndConfirmTransaction(connection, tx, [payer]);
    
    const multisig = new OnyxMultisig(connection, programId, pda);
    multisig.state.threshold = threshold;
    for (const member of members) {
      multisig.state.members.set(member.toBase58(), true);
    }
    multisig.state.nonce = 0;
    
    return multisig;
  }
  
  static async load(connection: Connection, programId: PublicKey, pda: PublicKey): Promise<OnyxMultisig> {
    try {
      const accountInfo = await connection.getAccountInfo(pda);
      if (!accountInfo) {
        throw new Error('Multisig PDA not found');
      }
      
      const multisig = new OnyxMultisig(connection, programId, pda);
      
      const data = Buffer.from(accountInfo.data);
      const memberCount = data.readUInt32LE(0);
      multisig.state.threshold = data[4];
      multisig.state.nonce = data[5];
      
      for (let i = 0; i < memberCount; i++) {
        const memberBytes = data.subarray(6 + i * 32, 6 + (i + 1) * 32);
        const member = new PublicKey(memberBytes);
        multisig.state.members.set(member.toBase58(), true);
      }
      
      return multisig;
    } catch (error) {
      throw new Error(`Failed to load multisig: ${error}`);
    }
  }
  
  async castVote(options: VoteOptions): Promise<VoteResult> {
    const { multisig, voter, approve } = options;
    
    const voterBase58 = voter.publicKey.toBase58();
    
    if (!this.state.members.has(voterBase58)) {
      throw new Error('NOT_MEMBER: Voter is not a member of this multisig');
    }
    
    if (this.state.votes.has(voterBase58)) {
      throw new Error('DOUBLE_VOTE: Member has already voted');
    }
    
    this.state.votes.set(voterBase58, approve);
    
    let approvalCount = 0;
    let rejectionCount = 0;
    
    for (const [, vote] of this.state.votes.entries()) {
      if (vote) {
        approvalCount++;
      } else {
        rejectionCount++;
      }
    }
    
    const totalMembers = this.state.members.size;
    const remainingVotes = totalMembers - this.state.votes.size;
    
    if (approvalCount >= this.state.threshold) {
      this.state.approved = true;
    } else if (rejectionCount >= (totalMembers - this.state.threshold + 1)) {
      this.state.rejected = true;
    } else if (approvalCount + remainingVotes < this.state.threshold) {
      this.state.rejected = true;
    }
    
    return {
      approved: this.state.approved,
      approvalCount,
      rejectionCount,
      threshold: this.state.threshold,
    };
  }
  
  getPda(): PublicKey {
    return this.pda;
  }
  
  getState(): {
    threshold: number;
    memberCount: number;
    voteCount: number;
    nonce: number;
    approved: boolean;
    rejected: boolean;
  } {
    return {
      threshold: this.state.threshold,
      memberCount: this.state.members.size,
      voteCount: this.state.votes.size,
      nonce: this.state.nonce,
      approved: this.state.approved,
      rejected: this.state.rejected,
    };
  }
  
  getRequiredApprovals(): number {
    return this.state.threshold;
  }
  
  getRequiredRejections(): number {
    return this.state.members.size - this.state.threshold + 1;
  }
  
  hasReachedDeadline(): boolean {
    return this.state.rejected;
  }
  
  isApproved(): boolean {
    return this.state.approved;
  }
}

export function computeMultisigPda(members: PublicKey[], programId: PublicKey, nonce: number = 0): [PublicKey, number] {
  const memberData = Buffer.alloc(32 * members.length);
  for (let i = 0; i < members.length; i++) {
    Buffer.from(members[i].toBytes()).copy(memberData, i * 32);
  }
  
  const seeds = [Buffer.from('multisig'), memberData, Buffer.alloc(1)];
  seeds[2].writeUInt8(nonce, 0);
  
  return PublicKey.findProgramAddressSync(seeds, programId);
}

export async function createMultisigTransaction(options: {
  connection: Connection;
  multisig: OnyxMultisig;
  instructions: TransactionInstruction[];
  payer: Keypair;
}): Promise<string> {
  const { connection, multisig, instructions, payer } = options;
  
  const state = multisig.getState();
  
  if (state.approved) {
    throw new Error('Multisig already approved');
  }
  
  if (state.rejected) {
    throw new Error('Multisig rejected - cannot execute');
  }
  
  const tx = new Transaction();
  for (const ix of instructions) {
    tx.add(ix);
  }
  
  const txSig = await sendAndConfirmTransaction(connection, tx, [payer]);
  
  return txSig;
}