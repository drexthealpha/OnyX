// packages/onyx-bridge/src/sign.ts

import { Connection, PublicKey } from '@solana/web3.js';
import { DWalletInfo, SignatureScheme, IKA_PROGRAM_ID, MSG_APPROVAL_STATUS_OFFSET, MSG_APPROVAL_SIG_LEN_OFFSET, MSG_APPROVAL_SIG_OFFSET, MESSAGE_APPROVAL_LEN, DISC_MESSAGE_APPROVAL, SignMessageOptions } from './types';
import { defineBcsTypes } from './bcs-types';
import { createGrpcClient, buildUserSignature, buildSignedRequestData, buildSignRequest, buildPresignRequest } from './grpc-client';
import { getDWalletPda } from './dwallet';
import { createHash } from 'crypto';

export function computeMessageDigest(message: Uint8Array): Uint8Array {
  const hash = createHash('sha256');
  hash.update(Buffer.from(message));
  return new Uint8Array(hash.digest());
}

export function computeMessageApprovalPda(
  dwalletInfo: DWalletInfo,
  scheme: SignatureScheme,
  messageDigest: Uint8Array,
  programId?: string
): [PublicKey, number] {
  const seeds: Buffer[] = [];
  
  const payload = Buffer.alloc(2 + dwalletInfo.pubkey.length);
  payload.writeUInt16LE(dwalletInfo.curve, 0);
  Buffer.from(dwalletInfo.pubkey).copy(payload, 2);
  
  for (let i = 0; i < payload.length; i += 32) {
    seeds.push(payload.subarray(i, Math.min(i + 32, payload.length)));
  }
  
  seeds.push(Buffer.from('message_approval'));
  seeds.push(Buffer.alloc(2));
  seeds[seeds.length - 1].writeUInt16LE(scheme, 0);
  seeds.push(Buffer.from(messageDigest));
  
  const programIdObj = new PublicKey(programId || IKA_PROGRAM_ID);
  return PublicKey.findProgramAddressSync(seeds, programIdObj);
}

export async function pollMessageApproval(
  connection: Connection,
  pda: PublicKey,
  timeoutMs: number = 30000
): Promise<Uint8Array> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      const accountInfo = await connection.getAccountInfo(pda);
      if (accountInfo && accountInfo.data.length >= MESSAGE_APPROVAL_LEN) {
        const data = Buffer.from(accountInfo.data);
        const status = data[MSG_APPROVAL_STATUS_OFFSET];
        
        if (status === 1) {
          const sigLen = data.readUInt16LE(MSG_APPROVAL_SIG_LEN_OFFSET);
          const signature = data.subarray(MSG_APPROVAL_SIG_OFFSET, MSG_APPROVAL_SIG_OFFSET + sigLen);
          return new Uint8Array(signature);
        }
      }
    } catch {
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error('TIMEOUT: MessageApproval not signed');
}

export async function requestPresign(options: {
  connection: Connection;
  dwalletInfo: DWalletInfo;
  userPubkey: Uint8Array;
  signatureAlgorithm?: number;
}): Promise<Uint8Array> {
  const { connection, dwalletInfo, userPubkey, signatureAlgorithm = 3 } = options;
  
  const programId = new PublicKey(IKA_PROGRAM_ID);
  
  const [pda] = getDWalletPda(dwalletInfo.curve, dwalletInfo.pubkey);
  
  try {
    const accountInfo = await connection.getAccountInfo(pda);
    if (!accountInfo || accountInfo.data.length < 153) {
      throw new Error('DWallet not found');
    }
  } catch {
    throw new Error('DWallet not found');
  }
  
  const grpcClient = createGrpcClient();
  
  try {
    const presignRequest = buildPresignRequest(
      dwalletInfo.curve,
      signatureAlgorithm,
      userPubkey,
      dwalletInfo.pubkey,
      {
        attestation_data: new Uint8Array(32),
        network_signature: new Uint8Array(64),
        network_pubkey: new Uint8Array(32),
        epoch: 0n,
      }
    );
    
    const userSig = buildUserSignature(userPubkey);
    const signedData = buildSignedRequestData(userPubkey, presignRequest, 0n);
    
    const responseData = await grpcClient.submitTransaction(userSig, signedData);
    
    const { TransactionResponseData, VersionedPresignDataAttestation } = defineBcsTypes();
    const parsed = TransactionResponseData.parse(Array.from(responseData));
    
    let attestationData: Uint8Array;
    
    if ('Signature' in parsed) {
      throw new Error('Unexpected Signature response');
    } else if ('Error' in parsed) {
      throw new Error(`Presign Error: ${parsed.Error.message}`);
    } else {
      attestationData = new Uint8Array(parsed.Attestation.attestation_data);
    }
    
    const versionedPresign = VersionedPresignDataAttestation.parse(Array.from(attestationData));
    
    let presignSessionIdentifier: Uint8Array;
    
    if ('V1' in versionedPresign) {
      presignSessionIdentifier = new Uint8Array(versionedPresign.V1.presign_session_identifier);
    } else {
      throw new Error('Unknown presign version');
    }
    
    return presignSessionIdentifier;
  } finally {
    grpcClient.close();
  }
}

export async function signMessage(options: SignMessageOptions): Promise<Uint8Array> {
  const {
    connection,
    dwalletInfo,
    message,
    messageMetadata = new Uint8Array(0),
    signatureScheme,
    userPubkey,
  } = options;
  
  const messageDigest = computeMessageDigest(message);
  
  const [approvalPda, approvalBump] = computeMessageApprovalPda(
    dwalletInfo,
    signatureScheme,
    messageDigest
  );
  
  const grpcClient = createGrpcClient();
  
  try {
    const presignSessionIdentifier = await requestPresign({
      connection,
      dwalletInfo,
      userPubkey,
      signatureAlgorithm: 3,
    });
    
    const signRequest = buildSignRequest(
      message,
      presignSessionIdentifier,
      {
        attestation_data: new Uint8Array(32),
        network_signature: new Uint8Array(64),
        network_pubkey: new Uint8Array(32),
        epoch: 0n,
      },
      new Uint8Array(64)
    );
    
    const userSig = buildUserSignature(userPubkey);
    const signedData = buildSignedRequestData(userPubkey, signRequest, 0n);
    
    const responseData = await grpcClient.submitTransaction(userSig, signedData);
    
    const { TransactionResponseData } = defineBcsTypes();
    const parsed = TransactionResponseData.parse(Array.from(responseData));
    
    if ('Signature' in parsed) {
      return new Uint8Array(parsed.Signature.signature);
    } else if ('Error' in parsed) {
      throw new Error(`Sign Error: ${parsed.Error.message}`);
    } else {
      throw new Error('Unexpected Attestation response');
    }
  } finally {
    grpcClient.close();
  }
}

export async function approveMessage(options: {
  connection: Connection;
  dwalletInfo: DWalletInfo;
  message: Uint8Array;
  signatureScheme: SignatureScheme;
  userPubkey: Uint8Array;
  payer: import('@solana/web3.js').Keypair;
}): Promise<string> {
  const { connection, dwalletInfo, message, signatureScheme, userPubkey, payer } = options;
  
  const messageDigest = computeMessageDigest(message);
  
  const [approvalPda, approvalBump] = computeMessageApprovalPda(
    dwalletInfo,
    signatureScheme,
    messageDigest
  );
  
  const instructionData = Buffer.alloc(100);
  instructionData.writeUInt8(8, 0);
  instructionData.writeUInt8(approvalBump, 1);
  instructionData.write(messageDigest.toString('hex'), 32, 'hex');
  instructionData.write(new Uint8Array(32).toString('hex'), 64, 'hex');
  instructionData.write(userPubkey.toString('hex'), 96, 'hex');
  instructionData.writeUInt16LE(signatureScheme, 128);
  
  const programId = new PublicKey(IKA_PROGRAM_ID);
  
  const { TransactionInstruction, SystemProgram } = await import('@solana/web3.js');
  
  const approveIx = new TransactionInstruction({
    programId,
    keys: [
      { pubkey: new PublicKey(dwalletInfo.pda), isSigner: false, isWritable: true },
      { pubkey: approvalPda, isSigner: false, isWritable: true },
      { pubkey: payer.publicKey, isSigner: true, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: instructionData,
  });
  
  const { Transaction } = await import('@solana/web3.js');
  const tx = new Transaction().add(approveIx);
  
  const { sendAndConfirmTransaction } = await import('@solana/web3.js');
  const txSig = await sendAndConfirmTransaction(connection, tx, [payer]);
  
  return txSig;
}