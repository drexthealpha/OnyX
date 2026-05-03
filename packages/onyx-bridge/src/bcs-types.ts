// packages/onyx-bridge/src/bcs-types.ts

import { bcs } from '@mysten/bcs';

export function defineBcsTypes() {
  const ChainId = bcs.enum('ChainId', {
    Solana: null,
    Sui: null,
  });

  const DWalletCurve = bcs.enum('DWalletCurve', {
    Secp256k1: null,
    Secp256r1: null,
    Curve25519: null,
    Ristretto: null,
  });

  const DWalletSignatureAlgorithm = bcs.enum('DWalletSignatureAlgorithm', {
    ECDSASecp256k1: null,
    ECDSASecp256r1: null,
    Taproot: null,
    EdDSA: null,
    SchnorrkelSubstrate: null,
  });

  const DWalletSignatureScheme = bcs.enum('DWalletSignatureScheme', {
    EcdsaKeccak256: null,
    EcdsaSha256: null,
    EcdsaDoubleSha256: null,
    TaprootSha256: null,
    EcdsaBlake2b256: null,
    EddsaSha512: null,
    SchnorrkelMerlin: null,
  });

  const ApprovalProof = bcs.enum('ApprovalProof', {
    Solana: bcs.struct('APS', {
      transaction_signature: bcs.vector(bcs.u8()),
      slot: bcs.u64(),
    }),
    Sui: bcs.struct('APSui', {
      effects_certificate: bcs.vector(bcs.u8()),
    }),
  });

  const UserSignature = bcs.enum('UserSignature', {
    Ed25519: bcs.struct('USE', {
      signature: bcs.vector(bcs.u8()),
      public_key: bcs.vector(bcs.u8()),
    }),
    Secp256k1: bcs.struct('USS', {
      signature: bcs.vector(bcs.u8()),
      public_key: bcs.vector(bcs.u8()),
    }),
    Secp256r1: bcs.struct('USR', {
      signature: bcs.vector(bcs.u8()),
      public_key: bcs.vector(bcs.u8()),
    }),
  });

  const NetworkSignedAttestation = bcs.struct('NetworkSignedAttestation', {
    attestation_data: bcs.vector(bcs.u8()),
    network_signature: bcs.vector(bcs.u8()),
    network_pubkey: bcs.vector(bcs.u8()),
    epoch: bcs.u64(),
  });

  const UserSecretKeyShare = bcs.enum('UserSecretKeyShare', {
    Encrypted: bcs.struct('USKSEnc', {
      encrypted_centralized_secret_share_and_proof: bcs.vector(bcs.u8()),
      encryption_key: bcs.vector(bcs.u8()),
      signer_public_key: bcs.vector(bcs.u8()),
    }),
    Public: bcs.struct('USKSPub', {
      public_user_secret_key_share: bcs.vector(bcs.u8()),
    }),
  });

  const SignDuringDKGRequest = bcs.struct('SignDuringDKGRequest', {
    presign_session_identifier: bcs.vector(bcs.u8()),
    presign: bcs.vector(bcs.u8()),
    signature_scheme: DWalletSignatureScheme,
    message: bcs.vector(bcs.u8()),
    message_metadata: bcs.vector(bcs.u8()),
    message_centralized_signature: bcs.vector(bcs.u8()),
  });

  const DWalletRequestDKG = bcs.struct('DKG', {
    dwallet_network_encryption_public_key: bcs.vector(bcs.u8()),
    curve: DWalletCurve,
    centralized_public_key_share_and_proof: bcs.vector(bcs.u8()),
    user_secret_key_share: UserSecretKeyShare,
    user_public_output: bcs.vector(bcs.u8()),
    sign_during_dkg_request: bcs.option(SignDuringDKGRequest),
  });

  const DWalletRequestSign = bcs.struct('Sign', {
    message: bcs.vector(bcs.u8()),
    message_metadata: bcs.vector(bcs.u8()),
    presign_session_identifier: bcs.vector(bcs.u8()),
    message_centralized_signature: bcs.vector(bcs.u8()),
    dwallet_attestation: NetworkSignedAttestation,
    approval_proof: ApprovalProof,
  });

  const DWalletRequestImportedKeySign = bcs.struct('IKS', {
    message: bcs.vector(bcs.u8()),
    message_metadata: bcs.vector(bcs.u8()),
    presign_session_identifier: bcs.vector(bcs.u8()),
    message_centralized_signature: bcs.vector(bcs.u8()),
    dwallet_attestation: NetworkSignedAttestation,
    approval_proof: ApprovalProof,
  });

  const DWalletRequestPresign = bcs.struct('Presign', {
    dwallet_network_encryption_public_key: bcs.vector(bcs.u8()),
    curve: DWalletCurve,
    signature_algorithm: DWalletSignatureAlgorithm,
  });

  const DWalletRequestPresignForDWallet = bcs.struct('PFD', {
    dwallet_network_encryption_public_key: bcs.vector(bcs.u8()),
    dwallet_public_key: bcs.vector(bcs.u8()),
    dwallet_attestation: NetworkSignedAttestation,
    curve: DWalletCurve,
    signature_algorithm: DWalletSignatureAlgorithm,
  });

  const DWalletRequestImportedKeyVerification = bcs.struct('IKV', {
    dwallet_network_encryption_public_key: bcs.vector(bcs.u8()),
    curve: DWalletCurve,
    centralized_party_message: bcs.vector(bcs.u8()),
    user_secret_key_share: UserSecretKeyShare,
    user_public_output: bcs.vector(bcs.u8()),
  });

  const DWalletRequestReEncryptShare = bcs.struct('ReEncryptShare', {
    dwallet_network_encryption_public_key: bcs.vector(bcs.u8()),
    dwallet_public_key: bcs.vector(bcs.u8()),
    dwallet_attestation: NetworkSignedAttestation,
    encrypted_centralized_secret_share_and_proof: bcs.vector(bcs.u8()),
    encryption_key: bcs.vector(bcs.u8()),
  });

  const DWalletRequestMakeSharePublic = bcs.struct('MakeSharePublic', {
    dwallet_public_key: bcs.vector(bcs.u8()),
    dwallet_attestation: NetworkSignedAttestation,
    public_user_secret_key_share: bcs.vector(bcs.u8()),
  });

  const DWalletRequestFutureSign = bcs.struct('FutureSign', {
    dwallet_public_key: bcs.vector(bcs.u8()),
    dwallet_attestation: NetworkSignedAttestation,
    presign_session_identifier: bcs.vector(bcs.u8()),
    message: bcs.vector(bcs.u8()),
    message_metadata: bcs.vector(bcs.u8()),
    message_centralized_signature: bcs.vector(bcs.u8()),
    signature_scheme: DWalletSignatureScheme,
  });

  const DWalletRequestSignWithPartialUserSig = bcs.struct('SWPUS', {
    partial_user_signature_attestation: NetworkSignedAttestation,
    dwallet_attestation: NetworkSignedAttestation,
    approval_proof: ApprovalProof,
  });

  const DWalletRequestImportedKeySignWithPartialUserSig = bcs.struct('IKSWPUS', {
    partial_user_signature_attestation: NetworkSignedAttestation,
    dwallet_attestation: NetworkSignedAttestation,
    approval_proof: ApprovalProof,
  });

  const DWalletRequest = bcs.enum('DWalletRequest', {
    DKG: DWalletRequestDKG,
    Sign: DWalletRequestSign,
    ImportedKeySign: DWalletRequestImportedKeySign,
    Presign: DWalletRequestPresign,
    PresignForDWallet: DWalletRequestPresignForDWallet,
    ImportedKeyVerification: DWalletRequestImportedKeyVerification,
    ReEncryptShare: DWalletRequestReEncryptShare,
    MakeSharePublic: DWalletRequestMakeSharePublic,
    FutureSign: DWalletRequestFutureSign,
    SignWithPartialUserSig: DWalletRequestSignWithPartialUserSig,
    ImportedKeySignWithPartialUserSig: DWalletRequestImportedKeySignWithPartialUserSig,
  });

  const SignedRequestData = bcs.struct('SignedRequestData', {
    session_identifier_preimage: bcs.fixedArray(32, bcs.u8()),
    epoch: bcs.u64(),
    chain_id: ChainId,
    intended_chain_sender: bcs.vector(bcs.u8()),
    request: DWalletRequest,
  });

  const TransactionResponseError = bcs.struct('ErrResp', {
    message: bcs.string(),
  });

  const TransactionResponseSignature = bcs.struct('SigResp', {
    signature: bcs.vector(bcs.u8()),
  });

  const TransactionResponseData = bcs.enum('TransactionResponseData', {
    Signature: TransactionResponseSignature,
    Attestation: NetworkSignedAttestation,
    Error: TransactionResponseError,
  });

  const VersionedDWalletDataAttestationV1 = bcs.struct('DWalletDataAttestationV1', {
    session_identifier: bcs.fixedArray(32, bcs.u8()),
    intended_chain_sender: bcs.vector(bcs.u8()),
    curve: DWalletCurve,
    public_key: bcs.vector(bcs.u8()),
    public_output: bcs.vector(bcs.u8()),
    is_imported_key: bcs.bool(),
    sign_during_dkg_signature: bcs.option(bcs.vector(bcs.u8())),
  });

  const VersionedDWalletDataAttestation = bcs.enum('VersionedDWalletDataAttestation', {
    V1: VersionedDWalletDataAttestationV1,
  });

  const VersionedPresignDataAttestationV1 = bcs.struct('PresignDataAttestationV1', {
    session_identifier: bcs.fixedArray(32, bcs.u8()),
    epoch: bcs.u64(),
    presign_session_identifier: bcs.vector(bcs.u8()),
    presign_data: bcs.vector(bcs.u8()),
    curve: DWalletCurve,
    signature_algorithm: DWalletSignatureAlgorithm,
    dwallet_public_key: bcs.option(bcs.vector(bcs.u8())),
    user_pubkey: bcs.vector(bcs.u8()),
  });

  const VersionedPresignDataAttestation = bcs.enum('VersionedPresignDataAttestation', {
    V1: VersionedPresignDataAttestationV1,
  });

  return {
    ChainId,
    DWalletCurve,
    DWalletSignatureAlgorithm,
    DWalletSignatureScheme,
    ApprovalProof,
    UserSignature,
    NetworkSignedAttestation,
    UserSecretKeyShare,
    SignDuringDKGRequest,
    DWalletRequest,
    SignedRequestData,
    TransactionResponseData,
    VersionedDWalletDataAttestation,
    VersionedPresignDataAttestation,
  };
}

export type BcsTypes = ReturnType<typeof defineBcsTypes>;

export function serializeUserSignatureEd25519(signature: Uint8Array, publicKey: Uint8Array): Uint8Array {
  const { UserSignature } = defineBcsTypes();
  return UserSignature.serialize({
    Ed25519: {
      signature: Array.from(signature),
      public_key: Array.from(publicKey),
    },
  }).toBytes();
}

export function serializeSignedRequestData(
  request: object,
  epoch: bigint,
  chainId: 'Solana' | 'Sui' = 'Solana',
  sender: Uint8Array = new Uint8Array(32)
): Uint8Array {
  const { SignedRequestData } = defineBcsTypes();
  const sessionId = new Uint8Array(32);
  
  return SignedRequestData.serialize({
    session_identifier_preimage: Array.from(sessionId),
    epoch: epoch.toString(),
    chain_id: (chainId === 'Solana' ? { Solana: null } : { Sui: null }),
    intended_chain_sender: Array.from(sender),
    request: request as any,
  }).toBytes();
}