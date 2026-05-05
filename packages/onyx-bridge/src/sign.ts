import { 
  address, 
  appendTransactionMessageInstruction, 
  createSolanaRpc, 
  createTransactionMessage, 
  fetchEncodedAccount, 
  getU16Codec, 
  getU8Codec, 
  pipe, 
  setTransactionMessageFeePayerSigner, 
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  Address,
  Rpc,
  SolanaRpcApi,
  KeyPairSigner,
  TransactionSigner,
} from '@solana/kit';
import { getStructCodec, getBytesCodec } from '@solana/codecs';
import nacl from 'tweetnacl';
import { 
  DWalletInfo, 
  SignatureScheme, 
  IKA_PROGRAM_ID, 
  MSG_APPROVAL_STATUS_OFFSET, 
  MSG_APPROVAL_SIG_LEN_OFFSET, 
  MSG_APPROVAL_SIG_OFFSET, 
  MESSAGE_APPROVAL_LEN, 
  IX_APPROVE_MESSAGE, 
  SignMessageOptions 
} from './types';
import { defineBcsTypes } from './bcs-types';
import { createGrpcClient, buildUserSignature, buildSignedRequestData, buildSignRequest, buildPresignRequest } from './grpc-client';
import { getDWalletPda } from './dwallet';
import { keccak_256 } from 'js-sha3';

export function computeMessageDigest(message: Uint8Array): Uint8Array {
  return new Uint8Array(keccak_256.arrayBuffer(message));
}

export function computeMessageApprovalPda(
  dwalletInfo: DWalletInfo,
  scheme: SignatureScheme,
  messageDigest: Uint8Array,
  metadataDigest?: Uint8Array,
  programId?: string
): Promise<[Address, number]> {
  const dwalletProgramId = address(programId || IKA_PROGRAM_ID);
  
  // seeds: ["dwallet", curve_as_u16, pubkey_chunks, "message_approval", scheme_as_u16, digest]
  const curveCodec = getU16Codec();
  const schemeCodec = getU16Codec();
  
  const payload = new Uint8Array(2 + dwalletInfo.pubkey.length);
  payload.set(curveCodec.encode(dwalletInfo.curve), 0);
  payload.set(dwalletInfo.pubkey, 2);
  
  const seeds: Uint8Array[] = [new TextEncoder().encode('dwallet')];
  
  for (let i = 0; i < payload.length; i += 32) {
    seeds.push(payload.subarray(i, Math.min(i + 32, payload.length)));
  }
  
  seeds.push(new TextEncoder().encode('message_approval'));
  seeds.push(new Uint8Array(schemeCodec.encode(scheme)));
  seeds.push(messageDigest);
  
  if (metadataDigest && metadataDigest.some(b => b !== 0)) {
    seeds.push(metadataDigest);
  }
  
  return (async () => {
     const { getProgramDerivedAddress } = await import('@solana/addresses');
     const [pda, bump] = await getProgramDerivedAddress({
       programAddress: dwalletProgramId,
       seeds,
     });
     return [pda, bump];
  })();
}

export async function pollMessageApproval(
  rpc: Rpc<SolanaRpcApi>,
  pda: Address,
  timeoutMs: number = 30000
): Promise<Uint8Array> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      const account = await fetchEncodedAccount(rpc, pda);
      if (account.exists && account.data.length >= MESSAGE_APPROVAL_LEN) {
        const data = account.data;
        const status = data[MSG_APPROVAL_STATUS_OFFSET];
        
        if (status === 1) {
          const sigLenCodec = getU16Codec();
          const sigLen = Number(sigLenCodec.decode(data.subarray(MSG_APPROVAL_SIG_LEN_OFFSET, MSG_APPROVAL_SIG_LEN_OFFSET + 2)));
          const signature = data.subarray(MSG_APPROVAL_SIG_OFFSET, MSG_APPROVAL_SIG_OFFSET + Number(sigLen));
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
  rpc: Rpc<SolanaRpcApi>;
  dwalletInfo: DWalletInfo;
  userPubkey: Uint8Array;
  signer: TransactionSigner;
  signatureAlgorithm?: number;
}): Promise<Uint8Array> {
  const { rpc, dwalletInfo, userPubkey, signer, signatureAlgorithm = 3 } = options;
  
  const account = await fetchEncodedAccount(rpc, dwalletInfo.pda);
  if (!account.exists || account.data.length < 153) {
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
        epoch: 1n,
      }
    );
    
    const signedData = buildSignedRequestData(userPubkey, presignRequest, 1n);
    
    // signMessageWithSigners or direct signing if it's a KeyPairSigner
    let signature: Uint8Array;
    if ('signMessages' in signer) {
        const [signedMessage] = await (signer as any).signMessages([{ content: signedData }]);
        signature = signedMessage.signature;
    } else {
        // Fallback or error
        throw new Error('Signer does not support message signing');
    }
    
    const userSig = buildUserSignature(signature, userPubkey);
    
    const responseData = await grpcClient.submitTransaction(userSig, signedData);
    
    const { TransactionResponseData, VersionedPresignDataAttestation } = defineBcsTypes();
    const parsed = TransactionResponseData.parse(new Uint8Array(responseData));
    
    let attestationData: Uint8Array;
    
    if ('Signature' in parsed) {
      throw new Error('Unexpected Signature response');
    } else if ('Error' in parsed) {
      throw new Error(`Presign Error: ${parsed.Error.message}`);
    } else {
      attestationData = new Uint8Array(parsed.Attestation.attestation_data);
    }
    
    const versionedPresign = VersionedPresignDataAttestation.parse(new Uint8Array(attestationData));
    
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
    rpc,
    dwalletInfo,
    message,
    messageMetadata = new Uint8Array(0),
    signatureScheme,
    userPubkey,
    signer,
    approvalTxSig,
    slot,
  } = options;
  
  const grpcClient = createGrpcClient();
  
  try {
    const presignSessionIdentifier = await requestPresign({
      rpc,
      dwalletInfo,
      userPubkey,
      signer,
      signatureAlgorithm: 3,
    });
    
    const signRequest = buildSignRequest(
      message,
      presignSessionIdentifier,
      {
        attestation_data: new Uint8Array(32),
        network_signature: new Uint8Array(64),
        network_pubkey: new Uint8Array(32),
        epoch: 1n,
      },
      approvalTxSig,
      slot
    );
    
    const signedData = buildSignedRequestData(userPubkey, signRequest, 1n);
    
    let signature: Uint8Array;
    if ('signMessages' in signer) {
        const [signedMessage] = await (signer as any).signMessages([{ content: signedData }]);
        signature = signedMessage.signature;
    } else {
        throw new Error('Signer does not support message signing');
    }
    
    const userSig = buildUserSignature(signature, userPubkey);
    
    const responseData = await grpcClient.submitTransaction(userSig, signedData);
    
    const { TransactionResponseData } = defineBcsTypes();
    const parsed = TransactionResponseData.parse(new Uint8Array(responseData));
    
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
  rpc: Rpc<SolanaRpcApi>;
  dwalletInfo: DWalletInfo;
  message: Uint8Array;
  signatureScheme: SignatureScheme;
  userPubkey: Uint8Array;
  payer: TransactionSigner;
  callerProgramId: Address;
  metadataDigest?: Uint8Array;
}): Promise<string> {
  const { rpc, dwalletInfo, message, signatureScheme, userPubkey, payer, callerProgramId, metadataDigest } = options;
  
  const messageDigest = computeMessageDigest(message);
  
  const [approvalPda, approvalBump] = await computeMessageApprovalPda(
    dwalletInfo,
    signatureScheme,
    messageDigest,
    metadataDigest
  );
  
  const dwalletProgramId = address(IKA_PROGRAM_ID);
  
  const { getProgramDerivedAddress } = await import('@solana/addresses');
  const [coordinatorPda] = await getProgramDerivedAddress({
    programAddress: dwalletProgramId,
    seeds: [new TextEncoder().encode('dwallet_coordinator')],
  });

  const [cpiAuthority] = await getProgramDerivedAddress({
    programAddress: callerProgramId,
    seeds: [new TextEncoder().encode('__ika_cpi_authority')],
  });

  // Build instruction data using codecs per IKA docs
  const { fixCodecSize } = await import('@solana/codecs');
  const approveMessageIxCodec = getStructCodec([
    ['discriminator', getU8Codec()],
    ['bump', getU8Codec()],
    ['messageDigest', fixCodecSize(getBytesCodec(), 32)],
    ['metadataDigest', fixCodecSize(getBytesCodec(), 32)],
    ['userPubkey', fixCodecSize(getBytesCodec(), 32)],
    ['signatureScheme', getU16Codec()],
  ]);

  const instructionData = approveMessageIxCodec.encode({
    discriminator: IX_APPROVE_MESSAGE,
    bump: approvalBump,
    messageDigest: messageDigest,
    metadataDigest: metadataDigest || new Uint8Array(32),
    userPubkey: userPubkey,
    signatureScheme: signatureScheme,
  });
  
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (m) => setTransactionMessageFeePayerSigner(payer, m),
    (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
    (m) =>
      appendTransactionMessageInstruction(
        {
          programAddress: dwalletProgramId,
          accounts: [
            // Per IKA docs: [coordinator, message_approval, dwallet, caller_program,
            //                cpi_authority, payer, system_program]
            { address: coordinatorPda,  role: 0 }, // ReadOnly
            { address: approvalPda,     role: 1 }, // Writable
            { address: dwalletInfo.pda, role: 0 }, // ReadOnly
            { address: callerProgramId, role: 0 }, // ReadOnly (executable)
            { address: cpiAuthority,    role: 0 }, // ReadOnly (program signs via invoke_signed)
            { address: payer.address,   role: 3 }, // WritableSigner
            { address: address('11111111111111111111111111111111'), role: 0 }, // SystemProgram ReadOnly
          ],
          data: instructionData,
        },
        m,
      ),
  );
  
  const fullySignedTransaction = await signTransactionMessageWithSigners(transactionMessage);
  const { getBase64EncodedWireTransaction } = await import('@solana/transactions');
  const wireTransaction = getBase64EncodedWireTransaction(fullySignedTransaction);
  
  const txSig = await rpc.sendTransaction(wireTransaction).send();
  
  return txSig;
}