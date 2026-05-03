// packages/onyx-bridge/src/dwallet.ts

import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { Curve, DWalletInfo, IKA_PROGRAM_ID, DISC_DWALLET, DWALLET_LEN, DISC_COORDINATOR, COORDINATOR_LEN, CreateDWalletOptions } from './types';
import { createGrpcClient, buildUserSignature, buildSignedRequestData, buildDkgRequest } from './grpc-client';
import { defineBcsTypes } from './bcs-types';

function dwalletPdaSeeds(curve: Curve, publicKey: Uint8Array): Buffer[] {
  const payload = Buffer.alloc(2 + publicKey.length);
  payload.writeUInt16LE(curve, 0);
  Buffer.from(publicKey).copy(payload, 2);
  
  const seeds: Buffer[] = [Buffer.from('dwallet')];
  for (let i = 0; i < payload.length; i += 32) {
    seeds.push(payload.subarray(i, Math.min(i + 32, payload.length)));
  }
  
  return seeds;
}

export function getDWalletPda(curve: Curve, publicKey: Uint8Array, programId?: string): [PublicKey, number] {
  const programIdObj = new PublicKey(programId || IKA_PROGRAM_ID);
  const seeds = dwalletPdaSeeds(curve, publicKey);
  return PublicKey.findProgramAddressSync(seeds, programIdObj);
}

export async function waitForCoordinator(
  connection: Connection,
  programId: PublicKey,
  timeoutMs: number = 30000
): Promise<void> {
  const coordinatorSeeds = [Buffer.from('dwallet_coordinator')];
  const [coordinatorPda] = PublicKey.findProgramAddressSync(coordinatorSeeds, programId);
  
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      const accountInfo = await connection.getAccountInfo(coordinatorPda);
      if (accountInfo && accountInfo.data.length >= COORDINATOR_LEN) {
        const discriminator = accountInfo.data[0];
        if (discriminator === DISC_COORDINATOR) {
          return;
        }
      }
    } catch {
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error('TIMEOUT: DWalletCoordinator not found on-chain');
}

export async function waitForDWalletOnChain(
  connection: Connection,
  dwalletPda: PublicKey,
  timeoutMs: number = 60000
): Promise<Buffer> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      const accountInfo = await connection.getAccountInfo(dwalletPda);
      if (accountInfo && accountInfo.data.length >= DWALLET_LEN) {
        const discriminator = accountInfo.data[0];
        if (discriminator === DISC_DWALLET) {
          return Buffer.from(accountInfo.data);
        }
      }
    } catch {
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  throw new Error('TIMEOUT: dWallet PDA not found on-chain');
}

export function readDWalletAccount(data: Buffer): {
  authority: Buffer;
  curve: number;
  state: number;
  publicKey: Buffer;
  createdEpoch: bigint;
  noaPublicKey: Buffer;
  isImported: boolean;
} {
  const discriminator = data[0];
  const version = data[1];
  
  if (discriminator !== DISC_DWALLET) {
    throw new Error(`Invalid discriminator: expected ${DISC_DWALLET}, got ${discriminator}`);
  }
  
  const authority = data.subarray(2, 34);
  const curve = data.readUInt16LE(34);
  const state = data[36];
  const publicKeyLen = data[37];
  if (publicKeyLen === undefined) throw new Error('Missing public key length');
  const publicKey = data.subarray(38, 38 + publicKeyLen);
  const createdEpoch = data.readBigUInt64LE(103);
  const noaPublicKey = data.subarray(111, 143);
  const isImported = data[143] === 1;
  
  return {
    authority,
    curve,
    state: data[36] ?? 0,
    publicKey,
    createdEpoch,
    noaPublicKey,
    isImported,
  };
}

export async function createDWallet(options: CreateDWalletOptions): Promise<DWalletInfo> {
  const {
    connection,
    curve = Curve.Curve25519,
    signatureAlgorithm = 3,
    authority,
  } = options;
  
  const programId = new PublicKey(IKA_PROGRAM_ID);
  
  await waitForCoordinator(connection, programId);
  
  const grpcClient = createGrpcClient();
  
  try {
    const userPublicKey = new Uint8Array(32);
    if (authority) {
      userPublicKey.set(authority);
    }
    
    const { signer } = options;
    const dkgRequest = buildDkgRequest(curve, userPublicKey);
    const signedData = buildSignedRequestData(userPublicKey, dkgRequest, 0n);
    
    let signature = new Uint8Array(64);
    if (signer) {
      const nacl = (await import('tweetnacl')).default;
      signature = new Uint8Array(nacl.sign.detached(signedData, signer.secretKey));
    }
    
    const userSig = buildUserSignature(signature, userPublicKey);
    
    const responseData = await grpcClient.submitTransaction(userSig, signedData);
    
    const { TransactionResponseData, VersionedDWalletDataAttestation } = defineBcsTypes();
    const parsed = TransactionResponseData.parse(new Uint8Array(responseData));
    
    let attestationData: Uint8Array;
    
    if ('Signature' in parsed) {
      throw new Error('Unexpected Signature response, expected Attestation');
    } else if ('Error' in parsed) {
      throw new Error(`DKG Error: ${parsed.Error.message}`);
    } else {
      attestationData = new Uint8Array(parsed.Attestation.attestation_data);
    }
    
    const versionedAttestation = VersionedDWalletDataAttestation.parse(new Uint8Array(attestationData));
    
    let publicKey: Uint8Array;
    
    if ('V1' in versionedAttestation) {
      publicKey = new Uint8Array(versionedAttestation.V1.public_key);
    } else {
      throw new Error('Unknown attestation version');
    }
    
    const [pda, bump] = getDWalletPda(curve, publicKey);
    
    const dwalletData = await waitForDWalletOnChain(connection, pda);
    
    const parsedDWallet = readDWalletAccount(dwalletData);
    
    return {
      pubkey: publicKey,
      curve,
      authority: authority || new Uint8Array(32),
      pda: new Uint8Array(pda.toBuffer()),
      bump,
      state: parsedDWallet.state,
      createdEpoch: parsedDWallet.createdEpoch,
    };
  } finally {
    grpcClient.close();
  }
}

export function getCoordinatorPda(programId: PublicKey): [PublicKey, number] {
  const seeds = [Buffer.from('dwallet_coordinator')];
  return PublicKey.findProgramAddressSync(seeds, programId);
}

export async function readCoordinatorAccount(connection: Connection, programId: PublicKey): Promise<{
  version: number;
  nonce: number;
  createdEpoch: bigint;
  activeDwallets: number;
} | null> {
  const [pda] = getCoordinatorPda(programId);
  
  try {
    const accountInfo = await connection.getAccountInfo(pda);
    if (!accountInfo || accountInfo.data.length < COORDINATOR_LEN) {
      return null;
    }
    
    const data = Buffer.from(accountInfo.data);
    const discriminator = data[0];
    
    if (discriminator !== DISC_COORDINATOR) {
      return null;
    }
    
    return {
      version: data[1] ?? 0,
      nonce: data[2] ?? 0,
      createdEpoch: data.readBigUInt64LE(8),
      activeDwallets: data.readUInt16LE(16),
    };
  } catch {
    return null;
  }
}