import { 
  address, 
  createSolanaRpc, 
  Address, 
  Rpc, 
  SolanaRpcApi, 
  TransactionSigner,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstruction,
  signTransactionMessageWithSigners,
  fetchEncodedAccount,
} from '@solana/kit';
import { getU64Codec } from '@solana/codecs';
import { DWalletInfo, CrossChainTransferOptions, IKA_PROGRAM_ID, Curve } from './types';
import { createDWallet, getDWalletPda } from './dwallet';
import { signMessage, approveMessage, computeMessageDigest } from './sign';
import { SpendingLimitEnforcer, createSpendingLimiter } from './spending-limits';
import bs58 from 'bs58';

export class OnyxBridge {
  private fromRpc: Rpc<SolanaRpcApi>;
  private toRpc: Rpc<SolanaRpcApi>;
  private spendingLimiter: SpendingLimitEnforcer;
  
  constructor(
    fromRpc: Rpc<SolanaRpcApi>,
    toRpc: Rpc<SolanaRpcApi>,
    spendingLimiter?: SpendingLimitEnforcer
  ) {
    this.fromRpc = fromRpc;
    this.toRpc = toRpc;
    this.spendingLimiter = spendingLimiter || createSpendingLimiter();
  }
  
  static async createBridge(options: {
    fromRpc: string;
    toRpc: string;
    spendingDbPath?: string;
  }): Promise<OnyxBridge> {
    const fromRpc = createSolanaRpc(options.fromRpc);
    const toRpc = createSolanaRpc(options.toRpc);
    const spendingLimiter = options.spendingDbPath 
      ? createSpendingLimiter({ dbPath: options.spendingDbPath })
      : undefined;
    
    return new OnyxBridge(fromRpc, toRpc, spendingLimiter);
  }
  
  async bridgeSign(options: CrossChainTransferOptions): Promise<string> {
    const {
      amountLamports,
      recipient,
      dwalletInfo,
      splToken,
      isNft,
    } = options;
    
    const dwalletId = dwalletInfo.pubkey.toString();
    
    await this.spendingLimiter.checkAndEnforce(dwalletId, amountLamports);
    
    let fromTokenMint: Address | null = null;
    if (splToken) {
      fromTokenMint = splToken;
    }
    
    const message = this.buildCrossChainMessage({
      amount: amountLamports,
      recipient: recipient,
      tokenMint: fromTokenMint || null,
      isNft: isNft || false,
      fromChain: 'solana',
      toChain: 'solana',
    });
    
    const callerProgramId = options.callerProgramId || address(IKA_PROGRAM_ID);
    
    const approveTxSig = await approveMessage({
      rpc: this.fromRpc,
      dwalletInfo,
      message,
      signatureScheme: 5,
      userPubkey: dwalletInfo.authority,
      payer: options.signer,
      callerProgramId,
    });
    
    const tx = await this.fromRpc.getTransaction(approveTxSig as any, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
      encoding: 'base64',
    }).send();
    
    const slot = tx?.slot || 0n;
    
    const signature = await signMessage({
      rpc: this.fromRpc,
      dwalletInfo,
      message,
      signatureScheme: 5,
      userPubkey: dwalletInfo.authority,
      signer: options.signer,
      approvalTxSig: bs58.decode(approveTxSig),
      slot: Number(slot),
    });
    
    this.spendingLimiter.recordSpend(dwalletId, amountLamports);
    
    if (splToken) {
      return this.executeSplTransfer({
        rpc: this.fromRpc,
        recipient,
        amountLamports,
        tokenMint: splToken,
        dwalletPda: dwalletInfo.pda,
        signature,
      });
    }
    
    return Buffer.from(signature).toString('base64');
  }
  
  private buildCrossChainMessage(params: {
    amount: bigint;
    recipient: string;
    tokenMint: string | null;
    isNft: boolean;
    fromChain: string;
    toChain: string;
  }): Uint8Array {
    const msg = JSON.stringify({
      type: 'cross_chain_transfer',
      amount: params.amount.toString(),
      recipient: params.recipient,
      token_mint: params.tokenMint,
      is_nft: params.isNft,
      from_chain: params.fromChain,
      to_chain: params.toChain,
      timestamp: Date.now(),
    });
    
    return new TextEncoder().encode(msg);
  }
  
  private async executeSplTransfer(options: {
    rpc: Rpc<SolanaRpcApi>;
    recipient: Address;
    amountLamports: bigint;
    tokenMint: Address;
    dwalletPda: Address;
    signature: Uint8Array;
  }): Promise<string> {
    const { rpc, recipient, amountLamports, tokenMint, dwalletPda, signature } = options;
    
    const { getProgramDerivedAddress, getAddressEncoder } = await import('@solana/addresses');
    const ataProgramId = address('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
    const tokenProgramIdBytes = getAddressEncoder().encode(address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'));
    
    const [fromTokenAccount] = await getProgramDerivedAddress({
        programAddress: ataProgramId,
        seeds: [
            getAddressEncoder().encode(dwalletPda),
            tokenProgramIdBytes,
            getAddressEncoder().encode(tokenMint),
        ],
    });
    
    const [toTokenAccount] = await getProgramDerivedAddress({
        programAddress: ataProgramId,
        seeds: [
            getAddressEncoder().encode(recipient),
            tokenProgramIdBytes,
            getAddressEncoder().encode(tokenMint),
        ],
    });
    
    const toAccount = await fetchEncodedAccount(rpc, toTokenAccount);

    const instructions: any[] = [];

    if (!toAccount.exists) {
        instructions.push(
            {
                programAddress: address('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
                accounts: [
                    { address: dwalletPda, role: 3 },
                    { address: toTokenAccount, role: 3 },
                    { address: recipient, role: 0 },
                    { address: tokenMint, role: 0 },
                    { address: address('11111111111111111111111111111111'), role: 0 },
                    { address: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), role: 0 },
                ],
                data: new Uint8Array([0]),
            }
        );
    }

    const u64 = getU64Codec();
    const amountBytes = u64.encode(amountLamports);

    instructions.push({
        programAddress: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        accounts: [
            { address: fromTokenAccount, role: 3 },
            { address: toTokenAccount, role: 3 },
            { address: dwalletPda, role: 1 },
        ],
        data: new Uint8Array([3, ...amountBytes]),
    });

    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
    
    const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
        (m) => appendTransactionMessageInstruction(instructions[0], m),
    );
    
    return "PENDING_MIGRATION_TO_TOKEN_PROGRAM_CLIENT";
  }
  
  async shieldAsset(options: CrossChainTransferOptions): Promise<{ transactionSignature: string; shieldedAmount: bigint }> {
    const { amountLamports } = options;
    const txSig = await this.bridgeSign(options);
    
    return {
      transactionSignature: txSig,
      shieldedAmount: amountLamports,
    };
  }

  async bridgeAsset(options: CrossChainTransferOptions): Promise<{ transactionSignature: string; bridgedAmount: bigint }> {
    return this.shieldAsset(options) as any;
  }
  
  async unshieldAsset(options: CrossChainTransferOptions): Promise<{ transactionSignature: string; unshieldedAmount: bigint }> {
    const { fromRpc, toRpc, amountLamports, recipient, dwalletInfo } = options;
    
    if (!dwalletInfo) {
      throw new Error('DWallet required for unshielding');
    }
    
    const message = this.buildCrossChainMessage({
      amount: amountLamports,
      recipient: recipient,
      tokenMint: null,
      isNft: false,
      fromChain: 'solana',
      toChain: 'solana',
    });
    
    const callerProgramId = options.callerProgramId || address(IKA_PROGRAM_ID);

    const approveTxSig = await approveMessage({
      rpc: fromRpc,
      dwalletInfo,
      message,
      signatureScheme: 5,
      userPubkey: dwalletInfo.authority,
      payer: options.signer,
      callerProgramId,
    });

    const tx = await fromRpc.getTransaction(approveTxSig as any, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
      encoding: 'base64',
    }).send();
    const slot = tx?.slot || 0n;

    const signature = await signMessage({
      rpc: fromRpc,
      dwalletInfo,
      message,
      signatureScheme: 5,
      userPubkey: dwalletInfo.authority,
      signer: options.signer,
      approvalTxSig: bs58.decode(approveTxSig),
      slot: Number(slot),
    });
    
    return {
      transactionSignature: Buffer.from(signature).toString('base64'),
      unshieldedAmount: amountLamports,
    };
  }
  
  setSpendingLimiter(limiter: SpendingLimitEnforcer): void {
    this.spendingLimiter = limiter;
  }
  
  getFromRpc(): Rpc<SolanaRpcApi> {
    return this.fromRpc;
  }
  
  getToRpc(): Rpc<SolanaRpcApi> {
    return this.toRpc;
  }
  
  close(): void {
    this.spendingLimiter.close();
  }
}

export async function bridgeSign(options: CrossChainTransferOptions): Promise<string> {
  const bridge = new OnyxBridge(options.fromRpc, options.toRpc);
  const result = await bridge.bridgeSign(options);
  bridge.close();
  return result;
}

export async function shieldAsset(options: CrossChainTransferOptions): Promise<string> {
  const bridge = new OnyxBridge(options.fromRpc, options.toRpc);
  const result = await bridge.shieldAsset(options);
  bridge.close();
  return result.transactionSignature;
}

export async function unshieldAsset(options: CrossChainTransferOptions): Promise<string> {
  const bridge = new OnyxBridge(options.fromRpc, options.toRpc);
  const result = await bridge.unshieldAsset(options);
  bridge.close();
  return result.transactionSignature;
}