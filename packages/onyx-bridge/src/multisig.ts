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
  Instruction,
  appendTransactionMessageInstructions,
} from '@solana/kit';
import { getStructCodec, getBytesCodec, getU8Codec, getU32Codec, getArrayCodec } from '@solana/codecs';
import { VoteResult, MultisigConfig, MultisigOptions, VoteOptions } from './types';

export class OnyxMultisig {
  private rpc: Rpc<SolanaRpcApi>;
  private programId: Address;
  private pda: Address;
  private state: {
    threshold: number;
    members: Map<string, boolean>;
    votes: Map<string, boolean>;
    nonce: number;
    approved: boolean;
    rejected: boolean;
  };
  
  constructor(rpc: Rpc<SolanaRpcApi>, programId: Address, pda: Address) {
    this.rpc = rpc;
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
    const { rpc, programId, members, threshold, payer } = options;
    
    const { getProgramDerivedAddress, getAddressEncoder } = await import('@solana/addresses');
    const sortedMembers = [...members].sort();
    const membersString = sortedMembers.join('');
    
    const [pda] = await getProgramDerivedAddress({
      programAddress: address(programId),
      seeds: [new TextEncoder().encode('multisig'), new TextEncoder().encode(membersString)],
    });
    
    const { fixCodecSize } = await import('@solana/codecs');
    const initIxCodec = getStructCodec([
      ['memberCount', getU32Codec()],
      ['threshold', getU8Codec()],
      ['members', getArrayCodec(fixCodecSize(getBytesCodec(), 32), { size: members.length })],
    ]);

    const instructionData = initIxCodec.encode({
      memberCount: members.length,
      threshold,
      members: members.map(m => getAddressEncoder().encode(m)),
    });
    
    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

    const transactionMessage = pipe(
      createTransactionMessage({ version: 0 }),
      (m) => setTransactionMessageFeePayerSigner(payer, m),
      (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
      (m) =>
        appendTransactionMessageInstruction(
          {
            programAddress: address(programId),
            accounts: [
              { address: pda, role: 3 },
              { address: payer.address, role: 3 },
            ],
            data: instructionData,
          },
          m,
        ),
    );

    const fullySignedTransaction = await signTransactionMessageWithSigners(transactionMessage);
    const { getBase64EncodedWireTransaction } = await import('@solana/transactions');
    const wireTransaction = getBase64EncodedWireTransaction(fullySignedTransaction);
    
    await rpc.sendTransaction(wireTransaction).send();
    
    const multisig = new OnyxMultisig(rpc, address(programId), pda);
    multisig.state.threshold = threshold;
    for (const member of members) {
      multisig.state.members.set(member, true);
    }
    multisig.state.nonce = 0;
    
    return multisig;
  }
  
  static async load(rpc: Rpc<SolanaRpcApi>, programId: Address, pda: Address): Promise<OnyxMultisig> {
    try {
      const account = await fetchEncodedAccount(rpc, pda);
      if (!account.exists) {
        throw new Error('Multisig PDA not found');
      }
      
      const multisig = new OnyxMultisig(rpc, programId, pda);
      const data = account.data;
      
      const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
      const memberCount = view.getUint32(0, true);
      multisig.state.threshold = view.getUint8(4);
      multisig.state.nonce = view.getUint8(5);
      
      const { getAddressDecoder } = await import('@solana/addresses');
      for (let i = 0; i < memberCount; i++) {
        const memberBytes = data.subarray(6 + i * 32, 6 + (i + 1) * 32);
        const member = getAddressDecoder().decode(memberBytes);
        multisig.state.members.set(member, true);
      }
      
      return multisig;
    } catch (error) {
      throw new Error(`Failed to load multisig: ${error}`);
    }
  }
  
  async castVote(options: VoteOptions): Promise<VoteResult> {
    const { multisig, voter, approve } = options;
    
    const voterAddress = voter.address;
    
    if (!this.state.members.has(voterAddress)) {
      throw new Error('NOT_MEMBER: Voter is not a member of this multisig');
    }
    
    if (this.state.votes.has(voterAddress)) {
      throw new Error('DOUBLE_VOTE: Member has already voted');
    }
    
    this.state.votes.set(voterAddress, approve);
    
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
  
  getPda(): Address {
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

export async function computeMultisigPda(members: Address[], programId: Address, nonce: number = 0): Promise<[Address, number]> {
  const { getAddressEncoder, getProgramDerivedAddress } = await import('@solana/addresses');
  const memberData = new Uint8Array(32 * members.length);
  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    if (member) {
      memberData.set(getAddressEncoder().encode(member), i * 32);
    }
  }
  
  const nonceBytes = new Uint8Array(1);
  nonceBytes[0] = nonce;
  
  const [pda, bump] = await getProgramDerivedAddress({
    programAddress: address(programId),
    seeds: [new TextEncoder().encode('multisig'), memberData, nonceBytes],
  });
  return [pda, bump];
}

export async function createMultisigTransaction(options: {
  rpc: Rpc<SolanaRpcApi>;
  multisig: OnyxMultisig;
  instructions: Instruction[];
  payer: TransactionSigner;
}): Promise<string> {
  const { rpc, multisig, instructions, payer } = options;
  
  const state = multisig.getState();
  
  if (state.approved) {
    throw new Error('Multisig already approved');
  }
  
  if (state.rejected) {
    throw new Error('Multisig rejected - cannot execute');
  }
  
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (m) => setTransactionMessageFeePayerSigner(payer, m),
    (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
    (m) => appendTransactionMessageInstructions(instructions, m)
  );

  const fullySignedTransaction = await signTransactionMessageWithSigners(transactionMessage);
  const { getBase64EncodedWireTransaction } = await import('@solana/transactions');
  const wireTransaction = getBase64EncodedWireTransaction(fullySignedTransaction);
  
  return await rpc.sendTransaction(wireTransaction).send();
}