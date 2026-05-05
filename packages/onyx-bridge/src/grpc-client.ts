// packages/onyx-bridge/src/grpc-client.ts

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';
import { IKA_GRPC_ENDPOINT, PresignInfo } from './types';
import { defineBcsTypes, serializeUserSignatureEd25519, serializeSignedRequestData } from './bcs-types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadGrpcClient(url: string) {
  const PROTO_PATH = path.resolve(__dirname, '../proto/ika_dwallet.proto');
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  const proto = (grpc as any).loadPackageDefinition(packageDefinition) as any;
  return new proto.ika.dwallet.v1.DWalletService(
    url.replace(/^https?:\/\//, ''),
    (grpc as any).credentials.createInsecure()
  );
}

export interface GrpcClient {
  submitTransaction(userSig: Uint8Array, signedData: Uint8Array): Promise<Uint8Array>;
  getPresigns(userPubkey: Uint8Array): Promise<PresignInfo[]>;
  getPresignsForDWallet(userPubkey: Uint8Array, dwalletId: Uint8Array): Promise<PresignInfo[]>;
  close(): void;
}

export function createGrpcClient(endpoint?: string): GrpcClient {
  const target = endpoint || IKA_GRPC_ENDPOINT;
  const client = loadGrpcClient(target);
  
  return {
    async submitTransaction(userSig: Uint8Array, signedData: Uint8Array): Promise<Uint8Array> {
      return new Promise((resolve, reject) => {
        client.SubmitTransaction(
          { 
            user_signature: Buffer.from(userSig), 
            signed_request_data: Buffer.from(signedData) 
          },
          (err: grpc.ServiceError | null, response: any) => {
            if (err) {
              reject(err);
              return;
            }
            if (!response || !response.response_data) {
              reject(new Error('Empty response or missing response_data from gRPC'));
              return;
            }
            resolve(new Uint8Array(response.response_data));
          }
        );
      });
    },
    
    async getPresigns(userPubkey: Uint8Array): Promise<PresignInfo[]> {
      return new Promise((resolve, reject) => {
        client.GetPresigns(
          { user_pubkey: Buffer.from(userPubkey) },
          (err: grpc.ServiceError | null, response: any) => {
            if (err) {
              reject(err);
              return;
            }
            if (!response || !response.presigns) {
              resolve([]);
              return;
            }
            resolve(response.presigns.map((p: any) => ({
              presignId: new Uint8Array(p.presign_id),
              dwalletId: new Uint8Array(p.dwallet_id),
              curve: p.curve,
              signatureScheme: p.signature_scheme,
              epoch: BigInt(p.epoch),
            })));
          }
        );
      });
    },
    
    async getPresignsForDWallet(userPubkey: Uint8Array, dwalletId: Uint8Array): Promise<PresignInfo[]> {
      return new Promise((resolve, reject) => {
        client.GetPresignsForDWallet(
          { 
            user_pubkey: Buffer.from(userPubkey), 
            dwallet_id: Buffer.from(dwalletId) 
          },
          (err: grpc.ServiceError | null, response: any) => {
            if (err) {
              reject(err);
              return;
            }
            if (!response || !response.presigns) {
              resolve([]);
              return;
            }
            resolve(response.presigns.map((p: any) => ({
              presignId: new Uint8Array(p.presign_id),
              dwalletId: new Uint8Array(p.dwallet_id),
              curve: p.curve,
              signatureScheme: p.signature_scheme,
              epoch: BigInt(p.epoch),
            })));
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
  epoch: bigint = 1n
): Uint8Array {
  return serializeSignedRequestData(request, epoch, 'Solana', senderPubkey);
}

export function buildDkgRequest(
  curve: number,
  userPublicKey: Uint8Array,
  nekPublicKey: Uint8Array = new Uint8Array(32)
): object {
  return {
    DKG: {
      dwallet_network_encryption_public_key: Array.from(nekPublicKey),
      curve: curve,
      centralized_public_key_share_and_proof: Array.from(new Uint8Array(32)),
      user_secret_key_share: {
        Encrypted: {
          encrypted_centralized_secret_share_and_proof: Array.from(new Uint8Array(32)),
          encryption_key: Array.from(new Uint8Array(32)),
          signer_public_key: Array.from(userPublicKey),
        },
      },
      user_public_output: Array.from(new Uint8Array(32)),
      sign_during_dkg_request: null,
    },
  };
}

export function buildSignRequest(
  message: Uint8Array,
  presignSessionIdentifier: Uint8Array,
  attestation: { attestation_data: Uint8Array; network_signature: Uint8Array; network_pubkey: Uint8Array; epoch: bigint },
  authorizationProof: Uint8Array,
  slot: number = 0
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
          slot: slot,
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