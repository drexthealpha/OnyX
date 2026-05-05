import { Address, Rpc, SolanaRpcApi, TransactionSigner } from '@solana/kit';

export enum Curve {
  Secp256k1 = 0,
  Secp256r1 = 1,
  Curve25519 = 2,
  Ristretto = 3,
}

export enum SignatureScheme {
  EcdsaKeccak256 = 0,
  EcdsaSha256 = 1,
  EcdsaDoubleSha256 = 2,
  TaprootSha256 = 3,
  EcdsaBlake2b256 = 4,
  EddsaSha512 = 5,
  SchnorrkelMerlin = 6,
}

export enum SignatureAlgorithm {
  ECDSASecp256k1 = 0,
  ECDSASecp256r1 = 1,
  Taproot = 2,
  EdDSA = 3,
  Schnorrkel = 4,
}

export const CPI_AUTHORITY_SEED = '__ika_cpi_authority';
export const IKA_PROGRAM_ID = '87W54kGYFQ1rgWqMeu4XTPHWXWmXSQCcjm8vCTfiq1oY';
export const IKA_GRPC_ENDPOINT = process.env['IKA_GRPC_ENDPOINT'] || 'pre-alpha-dev-1.ika.ika-network.net:443';
export const SOLANA_RPC_ENDPOINT = process.env['SOLANA_RPC_URL'] || 'https://api.devnet.solana.com';
export const BUDGET_CAP = BigInt(process.env['ONYX_DAILY_BUDGET_LAMPORTS'] || '5000000000');

export const STATUS_PENDING = 0;
export const STATUS_SIGNED = 1;
export const MSG_APPROVAL_STATUS_OFFSET = 172;
export const MSG_APPROVAL_SIG_LEN_OFFSET = 173;
export const MSG_APPROVAL_SIG_OFFSET = 175;

export const DISC_COORDINATOR = 1;
export const DISC_DWALLET = 2;
export const DISC_NEK = 3;
export const DISC_GAS_DEPOSIT = 4;
export const DISC_MESSAGE_APPROVAL = 14;

// Instruction discriminators per IKA docs
export const IX_CREATE_DWALLET = 0;
export const IX_APPROVE_MESSAGE = 8;

export const COORDINATOR_LEN = 116;
export const NEK_LEN = 164;
export const DWALLET_LEN = 153;
export const GAS_DEPOSIT_LEN = 139;
export const MESSAGE_APPROVAL_LEN = 312;

export interface DWalletInfo {
  pubkey: Uint8Array;
  curve: Curve;
  authority: Uint8Array;
  pda: Address;
  bump: number;
  state: number;
  createdEpoch: bigint;
}

export interface Presign {
  presignSessionIdentifier: Uint8Array;
  presignData: Uint8Array;
  curve: Curve;
  signatureAlgorithm: SignatureAlgorithm;
  epoch: bigint;
}

export interface VoteResult {
  approved: boolean;
  approvalCount: number;
  rejectionCount: number;
  threshold: number;
}

export interface MultisigConfig {
  programId: Uint8Array;
  threshold: number;
  members: Uint8Array[];
  nonce: bigint;
}

export interface SpendRecord {
  id: number;
  dwalletId: string;
  amountLamports: bigint;
  timestamp: number;
}

export interface PresignInfo {
  presignId: Uint8Array;
  dwalletId: Uint8Array;
  curve: number;
  signatureScheme: number;
  epoch: bigint;
}

export interface CreateDWalletOptions {
  rpc: Rpc<SolanaRpcApi>;
  curve?: Curve;
  signatureAlgorithm?: SignatureAlgorithm;
  authority?: Uint8Array;
  signer?: TransactionSigner;
}

export interface SignMessageOptions {
  rpc: Rpc<SolanaRpcApi>;
  dwalletInfo: DWalletInfo;
  message: Uint8Array;
  messageMetadata?: Uint8Array;
  signatureScheme: SignatureScheme;
  userPubkey: Uint8Array;
  signer: TransactionSigner;
  approvalTxSig: Uint8Array;
  slot: number;
}

export interface TransferOptions {
  rpc: Rpc<SolanaRpcApi>;
  dwalletPda: Address;
  newAuthority: Address;
  payer: TransactionSigner;
}

export interface GasDepositOptions {
  rpc: Rpc<SolanaRpcApi>;
  userPubkey: Uint8Array;
  amountLamports: bigint;
  isIkaBalance: boolean;
  payer: TransactionSigner;
}

export interface MultisigOptions {
  rpc: Rpc<SolanaRpcApi>;
  programId: Address;
  members: Address[];
  threshold: number;
  payer: TransactionSigner;
}

export interface VoteOptions {
  multisig: Address;
  voter: TransactionSigner;
  approve: boolean;
}

export interface CrossChainTransferOptions {
  fromRpc: Rpc<SolanaRpcApi>;
  toRpc: Rpc<SolanaRpcApi>;
  amountLamports: bigint;
  recipient: Address;
  dwalletInfo: DWalletInfo;
  splToken?: Address;
  isNft?: boolean;
  signer: TransactionSigner;
  callerProgramId?: Address;
}

export interface SharedAccessOptions {
  owner: Address;
  grantee: Address;
  rpc: Rpc<SolanaRpcApi>;
  durationSeconds?: number;
  maxAmountLamports?: bigint;
}