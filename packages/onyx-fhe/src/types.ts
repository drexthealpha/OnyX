export type EBool   = { readonly _brand: 'EBool';   ciphertext: string }
export type EUint64 = { readonly _brand: 'EUint64';  ciphertext: string }
export type EUint128= { readonly _brand: 'EUint128'; ciphertext: string }
export type EUint256= { readonly _brand: 'EUint256'; ciphertext: string }

export function makeEBool   (ciphertext: string): EBool    { return { _brand: 'EBool',    ciphertext } }
export function makeEUint64 (ciphertext: string): EUint64  { return { _brand: 'EUint64',  ciphertext } }
export function makeEUint128(ciphertext: string): EUint128 { return { _brand: 'EUint128', ciphertext } }
export function makeEUint256(ciphertext: string): EUint256 { return { _brand: 'EUint256', ciphertext } }

export const FHE_TYPE = {
  EBool:    1,
  EUint8:   2,
  EUint16:  3,
  EUint32:  4,
  EUint64:  4,
  EUint128: 5,
  EUint256: 6,
} as const;

export type FheType = typeof FHE_TYPE[keyof typeof FHE_TYPE];

export interface CiphertextAccount {
  // Binary layout (100 bytes):
  // [0]      disc       1 byte
  // [1]      version    1 byte
  // [2..33]  ciphertext_digest  32 bytes
  // [34..65] authorized         32 bytes
  // [66..97] network_key        32 bytes
  // [98]     fhe_type   1 byte
  // [99]     status     1 byte  (0=Pending, 1=Verified)
  status:     0 | 1;       // 1 byte at offset 99
  ciphertext: Uint8Array;  // 32-byte digest at offset 2
}

export interface FeeParams {
  encPerInput:  bigint;
  encPerOutput: bigint;
  maxEncPerOp:  bigint;
}

export interface GraphFeeInput {
  numInputs:          number;
  numPlaintextInputs: number;
  numConstants:       number;
  numOutputs:         number;
  numOps:             number;
  feeParams:          FeeParams;
}