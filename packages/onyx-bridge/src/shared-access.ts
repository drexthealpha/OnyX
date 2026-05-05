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
import { getStructCodec, getBytesCodec, getU8Codec, getI64Codec } from '@solana/codecs';
import { SharedAccessOptions } from './types';

export const SHARED_ACCESS_PREFIX = 'shared_access';

export class SharedAccessManager {
  private rpc: Rpc<SolanaRpcApi>;
  private programId: Address;
  
  constructor(rpc: Rpc<SolanaRpcApi>, programId: Address) {
    this.rpc = rpc;
    this.programId = programId;
  }
  
  static async grant(options: SharedAccessOptions & { payer: TransactionSigner }): Promise<string> {
    const { owner, grantee, rpc, durationSeconds, maxAmountLamports, payer } = options;
    
    const programId = address('87W54kGYFQ1rgWqMeu4XTPHWXWmXSQCcjm8vCTfiq1oY');
    
    const { getProgramDerivedAddress, getAddressEncoder } = await import('@solana/addresses');
    const [pda] = await getProgramDerivedAddress({
      programAddress: programId,
      seeds: [
        new TextEncoder().encode(SHARED_ACCESS_PREFIX),
        getAddressEncoder().encode(owner),
        getAddressEncoder().encode(grantee),
      ],
    });
    
    const duration = durationSeconds || 86400;
    const maxAmount = maxAmountLamports || 0n;
    const expiry = BigInt(Math.floor(Date.now() / 1000) + duration);
    
    const grantIxCodec = getStructCodec([
      ['discriminator', getU8Codec()],
      ['expiry', getI64Codec()],
      ['maxAmount', getI64Codec()],
      ['active', getU8Codec()],
    ]);

    const instructionData = grantIxCodec.encode({
      discriminator: 100,
      expiry,
      maxAmount,
      active: 1,
    });
    
    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

    const transactionMessage = pipe(
      createTransactionMessage({ version: 0 }),
      (m) => setTransactionMessageFeePayerSigner(payer, m),
      (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
      (m) =>
        appendTransactionMessageInstruction(
          {
            programAddress: programId,
            accounts: [
              { address: pda, role: 3 },
              { address: owner, role: 1 },
              { address: grantee, role: 0 },
              { address: address('11111111111111111111111111111111'), role: 0 },
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
  
  static async revoke(options: {
    owner: Address;
    grantee: Address;
    rpc: Rpc<SolanaRpcApi>;
    payer: TransactionSigner;
  }): Promise<string> {
    const { owner, grantee, rpc, payer } = options;
    
    const programId = address('87W54kGYFQ1rgWqMeu4XTPHWXWmXSQCcjm8vCTfiq1oY');
    
    const { getProgramDerivedAddress, getAddressEncoder } = await import('@solana/addresses');
    const [pda] = await getProgramDerivedAddress({
      programAddress: programId,
      seeds: [
        new TextEncoder().encode(SHARED_ACCESS_PREFIX),
        getAddressEncoder().encode(owner),
        getAddressEncoder().encode(grantee),
      ],
    });
    
    const instructionData = new Uint8Array([101]);
    
    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

    const transactionMessage = pipe(
      createTransactionMessage({ version: 0 }),
      (m) => setTransactionMessageFeePayerSigner(payer, m),
      (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
      (m) =>
        appendTransactionMessageInstruction(
          {
            programAddress: programId,
            accounts: [
              { address: pda, role: 3 },
              { address: owner, role: 1 },
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
  
  static async checkAccess(options: {
    owner: Address;
    grantee: Address;
    rpc: Rpc<SolanaRpcApi>;
  }): Promise<{ hasAccess: boolean; expiry: bigint; maxAmount: bigint }> {
    const { owner, grantee, rpc } = options;
    
    const programId = address('87W54kGYFQ1rgWqMeu4XTPHWXWmXSQCcjm8vCTfiq1oY');
    
    const { getProgramDerivedAddress, getAddressEncoder } = await import('@solana/addresses');
    const [pda] = await getProgramDerivedAddress({
      programAddress: programId,
      seeds: [
        new TextEncoder().encode(SHARED_ACCESS_PREFIX),
        getAddressEncoder().encode(owner),
        getAddressEncoder().encode(grantee),
      ],
    });
    
    try {
      const account = await fetchEncodedAccount(rpc, pda);
      if (!account.exists || account.data.length < 25) {
        return { hasAccess: false, expiry: 0n, maxAmount: 0n };
      }
      
      const data = account.data;
      const discriminator = data[0];
      
      if (discriminator !== 100) {
        return { hasAccess: false, expiry: 0n, maxAmount: 0n };
      }
      
      const accessCodec = getStructCodec([
        ['expiry', getI64Codec()],
        ['maxAmount', getI64Codec()],
      ]);
      
      const decoded = accessCodec.decode(data.subarray(1, 17));
      const currentTime = BigInt(Math.floor(Date.now() / 1000));
      
      if (decoded.expiry <= currentTime) {
        return { hasAccess: false, expiry: decoded.expiry, maxAmount: 0n };
      }
      
      return { hasAccess: true, expiry: decoded.expiry, maxAmount: decoded.maxAmount };
    } catch {
      return { hasAccess: false, expiry: 0n, maxAmount: 0n };
    }
  }
  
  static async executeWithSharedAccess(options: {
    owner: Address;
    grantee: Address;
    rpc: Rpc<SolanaRpcApi>;
    instructions: Instruction[];
    payer: TransactionSigner;
  }): Promise<string> {
    const { owner, grantee, rpc, instructions, payer } = options;
    
    const access = await SharedAccessManager.checkAccess({
      owner,
      grantee,
      rpc,
    });
    
    if (!access.hasAccess) {
      throw new Error('Shared access not granted or expired');
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
}

export async function grantSharedAccess(options: SharedAccessOptions & { rpc: Rpc<SolanaRpcApi>; payer: TransactionSigner }): Promise<string> {
  return SharedAccessManager.grant(options);
}

export async function revokeSharedAccess(options: {
  owner: Address;
  grantee: Address;
  rpc: Rpc<SolanaRpcApi>;
  payer: TransactionSigner;
}): Promise<string> {
  return SharedAccessManager.revoke(options);
}

export async function checkSharedAccess(options: {
  owner: Address;
  grantee: Address;
  rpc: Rpc<SolanaRpcApi>;
}): Promise<{ hasAccess: boolean; expiry: bigint; maxAmount: bigint }> {
  return SharedAccessManager.checkAccess(options);
}