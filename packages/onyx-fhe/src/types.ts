export type EBool   = { readonly _brand: 'EBool';   ciphertext: string }
export type EUint64 = { readonly _brand: 'EUint64';  ciphertext: string }
export type EUint128= { readonly _brand: 'EUint128'; ciphertext: string }
export type EUint256= { readonly _brand: 'EUint256'; ciphertext: string }

export function makeEBool   (ciphertext: string): EBool    { return { _brand: 'EBool',    ciphertext } }
export function makeEUint64 (ciphertext: string): EUint64  { return { _brand: 'EUint64',  ciphertext } }
export function makeEUint128(ciphertext: string): EUint128 { return { _brand: 'EUint128', ciphertext } }
export function makeEUint256(ciphertext: string): EUint256 { return { _brand: 'EUint256', ciphertext } }

export const FHE_TYPE = {
  EBool:    0,
  EUint8:   1,
  EUint16:  2,
  EUint32:  3,
  EUint64:  4,
  EUint128: 5,
  EUint256: 6,
} as const;

export type FheType = typeof FHE_TYPE[keyof typeof FHE_TYPE];

export interface CiphertextAccount {
  digest:     Uint8Array;  // 32 bytes offset 2
  authorized: Uint8Array;  // 32 bytes offset 34
  networkKey: Uint8Array;  // 32 bytes offset 66
  fheType:    FheType;     // 1 byte  offset 98
  status:     0 | 1;       // 1 byte  offset 99 (0=Pending, 1=Verified)
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