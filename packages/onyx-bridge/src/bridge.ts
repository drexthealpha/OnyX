// packages/onyx-bridge/src/bridge.ts

import { Connection, PublicKey, Keypair, Transaction, TransactionInstruction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';
import { DWalletInfo, CrossChainTransferOptions, IKA_PROGRAM_ID, Curve } from './types';
import { createDWallet, getDWalletPda } from './dwallet';
import { signMessage, computeMessageDigest } from './sign';
import { SpendingLimitEnforcer } from './spending-limits';
import { createSpendingLimiter } from './spending-limits';

export class OnyxBridge {
  private fromConnection: Connection;
  private toConnection: Connection;
  private spendingLimiter: SpendingLimitEnforcer;
  
  constructor(
    fromConnection: Connection,
    toConnection: Connection,
    spendingLimiter?: SpendingLimitEnforcer
  ) {
    this.fromConnection = fromConnection;
    this.toConnection = toConnection;
    this.spendingLimiter = spendingLimiter || createSpendingLimiter();
  }
  
  static async createBridge(options: {
    fromRpc: string;
    toRpc: string;
    spendingDbPath?: string;
  }): Promise<OnyxBridge> {
    const fromConnection = new Connection(options.fromRpc);
    const toConnection = new Connection(options.toRpc);
    const spendingLimiter = options.spendingDbPath 
      ? createSpendingLimiter({ dbPath: options.spendingDbPath })
      : undefined;
    
    return new OnyxBridge(fromConnection, toConnection, spendingLimiter);
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
    
    let fromTokenMint: PublicKey | null = null;
    if (splToken) {
      fromTokenMint = splToken;
    }
    
    const message = this.buildCrossChainMessage({
      amount: amountLamports,
      recipient: recipient.toBase58(),
      tokenMint: fromTokenMint?.toBase58() || null,
      isNft: isNft || false,
      fromChain: 'solana',
      toChain: 'solana',
    });
    
    const signature = await signMessage({
      connection: this.fromConnection,
      dwalletInfo,
      message,
      signatureScheme: 5,
      userPubkey: dwalletInfo.authority,
      signer: options.signer,
    });
    
    this.spendingLimiter.recordSpend(dwalletId, amountLamports);
    
    if (splToken) {
      return this.executeSplTransfer({
        connection: this.fromConnection,
        recipient,
        amountLamports,
        tokenMint: splToken,
        dwalletPda: new PublicKey(dwalletInfo.pda),
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
    connection: Connection;
    recipient: PublicKey;
    amountLamports: bigint;
    tokenMint: PublicKey;
    dwalletPda: PublicKey;
    signature: Uint8Array;
  }): Promise<string> {
    const { connection, recipient, amountLamports, tokenMint, dwalletPda, signature } = options;
    
    const { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createTransferInstruction, TOKEN_PROGRAM_ID } = await import('@solana/spl-token');
    
    const fromTokenAccount = await getAssociatedTokenAddress(
      tokenMint,
      dwalletPda,
      true
    );
    
    const toTokenAccount = await getAssociatedTokenAddress(
      tokenMint,
      recipient,
      true
    );
    
    // Functional API used below, no need for Token instance
    
    try {
      const toAccountInfo = await connection.getAccountInfo(toTokenAccount);
      if (!toAccountInfo) {
        const createIx = createAssociatedTokenAccountInstruction(
          dwalletPda,
          toTokenAccount,
          dwalletPda,
          tokenMint
        );
        
        const transferIx = createTransferInstruction(
          fromTokenAccount,
          toTokenAccount,
          dwalletPda,
          amountLamports
        );
        
        const tx = new Transaction().add(createIx).add(transferIx);
        const payer = Keypair.generate();
        
        return await sendAndConfirmTransaction(connection, tx, [payer]);
      }
    } catch {
    }
    
    const transferIx = createTransferInstruction(
      fromTokenAccount,
      toTokenAccount,
      dwalletPda,
      amountLamports
    );
    
    const tx = new Transaction().add(transferIx);
    const payer = Keypair.generate();
    
    return await sendAndConfirmTransaction(connection, tx, [payer]);
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
    const { fromConnection, toConnection, amountLamports, recipient, dwalletInfo } = options;
    
    if (!dwalletInfo) {
      throw new Error('DWallet required for unshielding');
    }
    
    const message = this.buildCrossChainMessage({
      amount: amountLamports,
      recipient: recipient.toBase58(),
      tokenMint: null,
      isNft: false,
      fromChain: 'solana',
      toChain: 'solana',
    });
    
    const signature = await signMessage({
      connection: fromConnection,
      dwalletInfo,
      message,
      signatureScheme: 5,
      userPubkey: dwalletInfo.authority,
      signer: options.signer,
    });
    
    return {
      transactionSignature: Buffer.from(signature).toString('base64'),
      unshieldedAmount: amountLamports,
    };
  }
  
  setSpendingLimiter(limiter: SpendingLimitEnforcer): void {
    this.spendingLimiter = limiter;
  }
  
  getFromConnection(): Connection {
    return this.fromConnection;
  }
  
  getToConnection(): Connection {
    return this.toConnection;
  }
  
  close(): void {
    this.spendingLimiter.close();
  }
}

export async function bridgeSign(options: CrossChainTransferOptions): Promise<string> {
  const bridge = new OnyxBridge(options.fromConnection, options.toConnection);
  const result = await bridge.bridgeSign(options);
  bridge.close();
  return result;
}

export async function shieldAsset(options: CrossChainTransferOptions): Promise<string> {
  const bridge = new OnyxBridge(options.fromConnection, options.toConnection);
  const result = await bridge.shieldAsset(options);
  bridge.close();
  return result.transactionSignature;
}

export async function unshieldAsset(options: CrossChainTransferOptions): Promise<string> {
  const bridge = new OnyxBridge(options.fromConnection, options.toConnection);
  const result = await bridge.unshieldAsset(options);
  bridge.close();
  return result.transactionSignature;
}