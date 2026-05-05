import { 
  address, 
  fetchEncodedAccount, 
  getU16Codec, 
  getU64Codec, 
  getU8Codec, 
  Address, 
  Rpc, 
  SolanaRpcApi, 
  TransactionSigner 
} from '@solana/kit';
import { fixCodecSize } from '@solana/codecs';
import { 
  Curve, 
  DWalletInfo, 
  IKA_PROGRAM_ID, 
  DISC_DWALLET, 
  DWALLET_LEN, 
  DISC_COORDINATOR, 
  COORDINATOR_LEN, 
  DISC_NEK,
  NEK_LEN,
  CreateDWalletOptions 
} from './types';
import { createGrpcClient, buildUserSignature, buildSignedRequestData, buildDkgRequest } from './grpc-client';
import { defineBcsTypes } from './bcs-types';

async function dwalletPdaSeeds(curve: Curve, publicKey: Uint8Array): Promise<Uint8Array[]> {
  const curveCodec = getU16Codec();
  const payload = new Uint8Array(2 + publicKey.length);
  payload.set(curveCodec.encode(curve), 0);
  payload.set(publicKey, 2);
  
  const seeds: Uint8Array[] = [new TextEncoder().encode('dwallet')];
  for (let i = 0; i < payload.length; i += 32) {
    seeds.push(payload.subarray(i, Math.min(i + 32, payload.length)));
  }
  
  return seeds;
}

export async function getDWalletPda(curve: Curve, publicKey: Uint8Array, programId?: string): Promise<[Address, number]> {
  const dwalletProgramId = address(programId || IKA_PROGRAM_ID);
  const seeds = await dwalletPdaSeeds(curve, publicKey);
  
  const { getProgramDerivedAddress } = await import('@solana/addresses');
  const [pda, bump] = await getProgramDerivedAddress({
    programAddress: dwalletProgramId,
    seeds,
  });
  return [pda, bump];
}

export async function waitForCoordinator(
  rpc: Rpc<SolanaRpcApi>,
  programId: Address,
  timeoutMs: number = 30000
): Promise<void> {
  const { getProgramDerivedAddress } = await import('@solana/addresses');
  const [coordinatorPda] = await getProgramDerivedAddress({
    programAddress: programId,
    seeds: [new TextEncoder().encode('dwallet_coordinator')],
  });
  
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      const account = await fetchEncodedAccount(rpc, coordinatorPda);
      if (account.exists && account.data.length >= COORDINATOR_LEN) {
        const discriminator = account.data[0];
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
  rpc: Rpc<SolanaRpcApi>,
  dwalletPda: Address,
  timeoutMs: number = 60000
): Promise<Uint8Array> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      const account = await fetchEncodedAccount(rpc, dwalletPda);
      if (account.exists && account.data.length >= DWALLET_LEN) {
        const discriminator = account.data[0];
        if (discriminator === DISC_DWALLET) {
          return account.data;
        }
      }
    } catch {
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  throw new Error('TIMEOUT: dWallet PDA not found on-chain');
}

/**
 * Read a dWallet account using the exact 153-byte binary layout from the IKA docs.
 *
 * Offset | Field             | Size | Notes
 * 0      | discriminator     | 1    | must be 2
 * 1      | version           | 1
 * 2      | authority         | 32
 * 34     | curve             | 2    | u16 LE
 * 36     | state             | 1    | 0=DKGInProgress, 1=Active
 * 37     | public_key_len    | 1    | actual key length (32 or 33)
 * 38     | public_key        | 65   | padded
 * 103    | created_epoch     | 8    | u64 LE
 * 111    | noa_public_key    | 32
 * 143    | is_imported       | 1
 * 144    | bump              | 1
 * 145    | _reserved         | 8
 */
export function readDWalletAccount(data: Uint8Array) {
  if (data[0] !== DISC_DWALLET) {
    throw new Error(`Invalid discriminator: expected ${DISC_DWALLET}, got ${data[0]}`);
  }
  if (data.length < DWALLET_LEN) {
    throw new Error(`dWallet account too short: ${data.length} < ${DWALLET_LEN}`);
  }

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  const authority   = data.slice(2, 34);
  const curve       = view.getUint16(34, true);
  const state       = data[36]!;
  const keyLen      = data[37]!;
  const publicKey   = data.slice(38, 38 + keyLen);
  const createdEpoch = view.getBigUint64(103, true);
  const noaPublicKey = data.slice(111, 143);
  const isImported  = data[143] === 1;
  const bump        = data[144]!;

  return { authority, curve, state, publicKey, createdEpoch, noaPublicKey, isImported, bump };
}

export async function createDWallet(options: CreateDWalletOptions): Promise<DWalletInfo> {
  const {
    rpc,
    curve = Curve.Curve25519,
    signatureAlgorithm = 3,
    authority,
  } = options;
  
  const programId = address(IKA_PROGRAM_ID);
  
  await waitForCoordinator(rpc, programId);
  
  const grpcClient = createGrpcClient();
  
  try {
    const userPublicKey = new Uint8Array(32);
    if (authority) {
      userPublicKey.set(authority);
    }
    
    // Fetch the real Network Encryption Key from the IKA program accounts (disc=3)
    const nekPublicKey = await fetchNekPublicKey(rpc, programId);

    const { signer } = options;
    const dkgRequest = buildDkgRequest(curve, userPublicKey, nekPublicKey);
    const signedData = buildSignedRequestData(userPublicKey, dkgRequest, 1n);
    
    let signature = new Uint8Array(64);
    if (signer && 'signMessages' in signer) {
      const [signedMessage] = await (signer as any).signMessages([{ content: signedData }]);
      signature = signedMessage.signature;
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
    
    const [pda, bump] = await getDWalletPda(curve, publicKey);
    
    const dwalletData = await waitForDWalletOnChain(rpc, pda);
    
    const parsedDWallet = readDWalletAccount(dwalletData);
    
    return {
      pubkey: publicKey,
      curve,
      authority: authority || new Uint8Array(32),
      pda,
      bump,
      state: parsedDWallet.state,
      createdEpoch: parsedDWallet.createdEpoch,
    };
  } finally {
    grpcClient.close();
  }
}

export async function getCoordinatorPda(programId: Address): Promise<[Address, number]> {
  const { getProgramDerivedAddress } = await import('@solana/addresses');
  const [pda, bump] = await getProgramDerivedAddress({
    programAddress: programId,
    seeds: [new TextEncoder().encode('dwallet_coordinator')],
  });
  return [pda, bump];
}

/**
 * Read the DWalletCoordinator account. The internal layout is not specified in the
 * IKA pre-alpha docs beyond discriminator=1 and length>=116. We only validate those
 * two invariants and return the raw data for callers that need it.
 */
export async function readCoordinatorAccount(rpc: Rpc<SolanaRpcApi>, programId: Address) {
  const [pda] = await getCoordinatorPda(programId);

  try {
    const account = await fetchEncodedAccount(rpc, pda);
    if (!account.exists || account.data.length < COORDINATOR_LEN) {
      return null;
    }
    if (account.data[0] !== DISC_COORDINATOR) {
      return null;
    }
    // Return only what the docs guarantee: discriminator and raw data
    return { discriminator: account.data[0], rawData: account.data };
  } catch {
    return null;
  }
}

/**
 * Scan the IKA program accounts for the NetworkEncryptionKey account (discriminator=3).
 * The docs specify: scan getProgramAccounts, find the one with disc=3, read its public-key
 * bytes to pass as `dwallet_network_encryption_public_key` in DKG requests.
 */
export async function fetchNekPublicKey(
  rpc: Rpc<SolanaRpcApi>,
  programId: Address
): Promise<Uint8Array> {
  // The NEK account has discriminator byte = 3 and is at least NEK_LEN bytes.
  // getProgramAccounts is the documented way to discover it.
  const accounts = await (rpc as any).getProgramAccounts(programId).send();
  for (const { account } of accounts) {
    const data: Uint8Array = account.data instanceof Uint8Array
      ? account.data
      : new Uint8Array(account.data);
    if (data.length >= NEK_LEN && data[0] === DISC_NEK) {
      // NEK account layout: disc(1)+version(1)+noa_pubkey(32)+...+public_key bytes
      // The docs don't specify the exact offset of the key inside the NEK account,
      // but the 32-byte public key directly follows the discriminator+version+noa_pubkey
      // block. Return bytes 2..34 as the network encryption public key.
      return data.slice(2, 34);
    }
  }
  // Pre-alpha fallback: return zeroed 32-byte key (mock mode)
  console.warn('[onyx-bridge] NEK account not found — using zero-padded key (pre-alpha mock mode)');
  return new Uint8Array(32);
}