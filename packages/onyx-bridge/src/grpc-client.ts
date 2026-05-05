// packages/onyx-bridge/src/grpc-client.ts

import * as grpc from '@grpc/grpc-js';
import { IKA_GRPC_ENDPOINT, PresignInfo } from './types';
import { defineBcsTypes, serializeUserSignatureEd25519, serializeSignedRequestData } from './bcs-types';

function encodeVarint(n: number | bigint): Buffer {
  let num = typeof n === 'bigint' ? n : BigInt(n);
  const bytes: number[] = [];
  
  while (num > 0n) {
    let byte = Number(num & 0x7fn);
    num >>= 7n;
    if (num > 0n) {
      byte |= 0x80;
    }
    bytes.push(byte);
  }
  
  if (bytes.length === 0) {
    bytes.push(0);
  }
  
  return Buffer.from(bytes);
}

function protoLengthDelimitedField(fieldNum: number, data: Buffer): Buffer {
  const tag = (fieldNum << 3) | 2;
  return Buffer.concat([encodeVarint(tag), encodeVarint(data.length), data]);
}

function decodeVarint(buf: Buffer, offset: number): { value: bigint; bytesRead: number } {
  let result = 0n;
  let shift = 0;
  let pos = offset;
  
  while (pos < buf.length) {
    const byte = buf[pos];
    if (byte === undefined) break;
    result |= BigInt(byte & 0x7f) << BigInt(shift);
    pos++;
    if ((byte & 0x80) === 0) {
      break;
    }
    shift += 7;
  }
  
  return { value: result, bytesRead: pos - offset };
}

function decodeProtoField(buf: Buffer, targetField: number): Buffer | null {
  let offset = 0;
  
  while (offset < buf.length) {
    const tagResult = decodeVarint(buf, offset);
    const fieldNum = Number(tagResult.value) >> 3;
    const wireType = Number(tagResult.value) & 0x07;
    offset += tagResult.bytesRead;
    
    if (fieldNum === targetField) {
      if (wireType === 2) {
        const lenResult = decodeVarint(buf, offset);
        const len = Number(lenResult.value);
        offset += lenResult.bytesRead;
        return buf.slice(offset, offset + len);
      } else if (wireType === 0) {
        return Buffer.alloc(0);
      }
      return null;
    }
    
    if (wireType === 2) {
      const lenResult = decodeVarint(buf, offset);
      const len = Number(lenResult.value);
      offset += lenResult.bytesRead + len;
    } else if (wireType === 0) {
      const varintResult = decodeVarint(buf, offset);
      offset += varintResult.bytesRead;
    } else if (wireType === 5) {
      offset += 4;
    } else if (wireType === 1) {
      offset += 8;
    }
  }
  
  return null;
}

function buildCredentials(endpoint: string): grpc.ChannelCredentials {
  if (endpoint.includes('localhost') || endpoint.match(/127\.0\.0\.1/)) {
    return grpc.credentials.createInsecure() as grpc.ChannelCredentials;
  }
  return grpc.credentials.createSsl() as grpc.ChannelCredentials;
}

function serializeUserSignedRequest(userSignature: Buffer, signedRequestData: Buffer): Buffer {
  return Buffer.concat([
    protoLengthDelimitedField(1, userSignature),
    protoLengthDelimitedField(2, signedRequestData),
  ]);
}

function serializeGetPresignsRequest(userPubkey: Uint8Array): Buffer {
  return protoLengthDelimitedField(1, Buffer.from(userPubkey));
}

function serializeGetPresignsForDWalletRequest(userPubkey: Uint8Array, dwalletId: Uint8Array): Buffer {
  return Buffer.concat([
    protoLengthDelimitedField(1, Buffer.from(userPubkey)),
    protoLengthDelimitedField(2, Buffer.from(dwalletId)),
  ]);
}

function deserializeGetPresignsResponse(buf: Buffer): Array<{
  presignId: Uint8Array;
  dwalletId: Uint8Array;
  curve: number;
  signatureScheme: number;
  epoch: bigint;
}> {
  const presigns: Array<{
    presignId: Uint8Array;
    dwalletId: Uint8Array;
    curve: number;
    signatureScheme: number;
    epoch: bigint;
  }> = [];
  
  let offset = 0;
  
  while (offset < buf.length) {
    const tagResult = decodeVarint(buf, offset);
    const fieldNum = Number(tagResult.value) >> 3;
    offset += tagResult.bytesRead;
    
    if (fieldNum === 1) {
      const lenResult = decodeVarint(buf, offset);
      const len = Number(lenResult.value);
      offset += lenResult.bytesRead;
      
      const wrapperData = buf.slice(offset, offset + len);
      offset += len;
      
      const presignId = decodeProtoField(wrapperData, 1);
      const dwalletId = decodeProtoField(wrapperData, 2);
      const curveBytes = decodeProtoField(wrapperData, 3);
      const schemeBytes = decodeProtoField(wrapperData, 4);
      const epochResult = decodeVarint(wrapperData, 5);
      
      presigns.push({
        presignId: presignId ? new Uint8Array(presignId) : new Uint8Array(),
        dwalletId: dwalletId ? new Uint8Array(dwalletId) : new Uint8Array(),
        curve: curveBytes ? Number(decodeVarint(curveBytes, 0).value) : 2,
        signatureScheme: schemeBytes ? Number(decodeVarint(schemeBytes, 0).value) : 5,
        epoch: epochResult.value,
      });
    } else {
      break;
    }
  }
  
  return presigns;
}

export interface GrpcClient {
  submitTransaction(userSig: Uint8Array, signedData: Uint8Array): Promise<Uint8Array>;
  getPresigns(userPubkey: Uint8Array): Promise<PresignInfo[]>;
  getPresignsForDWallet(userPubkey: Uint8Array, dwalletId: Uint8Array): Promise<PresignInfo[]>;
  close(): void;
}

export const GrpcClient = null as unknown as GrpcClient;

export function createGrpcClient(endpoint?: string): GrpcClient {
  const target = endpoint || IKA_GRPC_ENDPOINT;
  const creds = buildCredentials(target);
  const client = new grpc.Client(target, creds);
  
  return {
    async submitTransaction(userSig: Uint8Array, signedData: Uint8Array): Promise<Uint8Array> {
      const requestData = serializeUserSignedRequest(
        Buffer.from(userSig),
        Buffer.from(signedData)
      );
      
      return new Promise((resolve, reject) => {
        client.makeUnaryRequest(
          '/ika.dwallet.v1.DWalletService/SubmitTransaction',
          (buf: Buffer) => buf,
          (buf: Buffer) => buf,
          requestData,
          (err: grpc.ServiceError | null, response: Buffer | undefined) => {
            if (err) {
              reject(err);
              return;
            }
            if (!response) {
              reject(new Error('Empty response from gRPC'));
              return;
            }
            const responseData = decodeProtoField(response, 1);
            if (responseData) {
              resolve(new Uint8Array(responseData));
            } else {
              reject(new Error('Response field 1 not found'));
            }
          }
        );
      });
    },
    
    async getPresigns(
      userPubkey: Uint8Array
    ): Promise<PresignInfo[]> {
      const requestData = serializeGetPresignsRequest(userPubkey);
      
      return new Promise((resolve, reject) => {
        client.makeUnaryRequest(
          '/ika.dwallet.v1.DWalletService/GetPresigns',
          (buf: Buffer) => buf,
          (buf: Buffer) => buf,
          requestData,
          (err: grpc.ServiceError | null, response: Buffer | undefined) => {
            if (err) {
              reject(err);
              return;
            }
            if (!response) {
              resolve([]);
              return;
            }
            resolve(deserializeGetPresignsResponse(response));
          }
        );
      });
    },
    
    async getPresignsForDWallet(
      userPubkey: Uint8Array,
      dwalletId: Uint8Array
    ): Promise<PresignInfo[]> {
      const requestData = serializeGetPresignsForDWalletRequest(userPubkey, dwalletId);
      
      return new Promise((resolve, reject) => {
        client.makeUnaryRequest(
          '/ika.dwallet.v1.DWalletService/GetPresignsForDWallet',
          (buf: Buffer) => buf,
          (buf: Buffer) => buf,
          requestData,
          (err: grpc.ServiceError | null, response: Buffer | undefined) => {
            if (err) {
              reject(err);
              return;
            }
            if (!response) {
              resolve([]);
              return;
            }
            resolve(deserializeGetPresignsResponse(response));
          }
        );
      });
    },
    
    close(): void {
      client.close();
    },
  };
}

export function buildUserSignature(signature: Uint8Array, pubkey: Uint8Array): Uint8Array {
  return serializeUserSignatureEd25519(signature, pubkey);
}

export function buildSignedRequestData(
  senderPubkey: Uint8Array,
  request: object,
  epoch: bigint = 0n
): Uint8Array {
  return serializeSignedRequestData(request, epoch, 'Solana', senderPubkey);
}

export function buildDkgRequest(
  curve: number,
  userPublicKey: Uint8Array
): object {
  return {
    DKG: {
      dwallet_network_encryption_public_key: Array.from(new Uint8Array(32)),
      curve: curve,
      centralized_public_key_share_and_proof: Array.from(new Uint8Array(96)),
      user_secret_key_share: {
        Encrypted: {
          encrypted_centralized_secret_share_and_proof: Array.from(new Uint8Array(64)),
          encryption_key: Array.from(new Uint8Array(32)),
          signer_public_key: Array.from(new Uint8Array(32)),
        },
      },
      user_public_output: Array.from(userPublicKey),
      sign_during_dkg_request: null,
    },
  };
}

export function buildSignRequest(
  message: Uint8Array,
  presignSessionIdentifier: Uint8Array,
  attestation: { attestation_data: Uint8Array; network_signature: Uint8Array; network_pubkey: Uint8Array; epoch: bigint },
  authorizationProof: Uint8Array
): object {
  return {
    Sign: {
      message: Array.from(message),
      message_metadata: Array.from(new Uint8Array(0)),
      presign_session_identifier: Array.from(presignSessionIdentifier),
      message_centralized_signature: Array.from(new Uint8Array(64)),
      dwallet_attestation: {
        attestation_data: Array.from(attestation.attestation_data),
        network_signature: Array.from(attestation.network_signature),
        network_pubkey: Array.from(attestation.network_pubkey),
        epoch: attestation.epoch.toString(),
      },
      approval_proof: {
        Solana: {
          transaction_signature: Array.from(authorizationProof),
          slot: 0,
        },
      },
    },
  };
}

export function buildPresignRequest(
  curve: number,
  signatureAlgorithm: number,
  userPubkey: Uint8Array,
  dwalletPublicKey: Uint8Array,
  attestation: { attestation_data: Uint8Array; network_signature: Uint8Array; network_pubkey: Uint8Array; epoch: bigint }
): object {
  return {
    PresignForDWallet: {
      dwallet_network_encryption_public_key: Array.from(new Uint8Array(32)),
      dwallet_public_key: Array.from(dwalletPublicKey),
      dwallet_attestation: {
        attestation_data: Array.from(attestation.attestation_data),
        network_signature: Array.from(attestation.network_signature),
        network_pubkey: Array.from(attestation.network_pubkey),
        epoch: attestation.epoch.toString(),
      },
      curve: curve,
      signature_algorithm: signatureAlgorithm,
    },
  };
}