// packages/onyx-bridge/src/passkeys.ts

import { Connection, PublicKey, Keypair, Transaction, TransactionInstruction, sendAndConfirmTransaction, SystemProgram } from '@solana/web3.js';

export const WEBAUTHN_RP_ID = 'localhost';
export const WEBAUTHN_RP_NAME = 'ONYX';

export interface WebAuthnCredential {
  id: string;
  publicKey: Uint8Array;
  sign: (challenge: Uint8Array) => Promise<Uint8Array>;
}

export interface WebAuthnCredentialCreationOptions {
  rp: { id: string; name: string };
  user: { id: Uint8Array; name: string };
  challenge: Uint8Array;
  pubKeyCredParams: Array<{
    alg: number;
    type: string;
  }>;
  timeout?: number;
  attestation?: 'none' | 'indirect' | 'direct';
}

export interface WebAuthnCredentialRequestOptions {
  challenge: Uint8Array;
  rpId: string;
  allowCredentials: Array<{
    type: string;
    id: Uint8Array;
  }>;
  userVerification: 'required' | 'preferred' | 'discouraged';
}

function base64UrlEncode(data: Uint8Array): string {
  let base64 = Buffer.from(data).toString('base64');
  base64 = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return base64;
}

function base64UrlDecode(data: string): Uint8Array {
  let base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

export function derSignatureToRawRS(derSig: Uint8Array): Uint8Array {
  if (derSig.length < 8 || derSig[0] !== 0x30) {
    throw new Error('Invalid DER signature format');
  }
  
  let offset = 2;
  
  if (derSig[offset++] !== 0x02) {
    throw new Error('Invalid DER: expected r length marker');
  }
  const rLen = derSig[offset++];
  if (rLen === undefined) throw new Error('Invalid DER: missing r length');
  const rBytes = derSig.subarray(offset, offset + rLen);
  offset += rLen;
  
  if (derSig[offset++] !== 0x02) {
    throw new Error('Invalid DER: expected s length marker');
  }
  const sLen = derSig[offset++];
  if (sLen === undefined) throw new Error('Invalid DER: missing s length');
  const sBytes = derSig.subarray(offset, offset + sLen);
  
  const rPadded = new Uint8Array(32);
  const sPadded = new Uint8Array(32);
  
  const rStart = 32 - rBytes.length;
  const sStart = 32 - sBytes.length;
  
  const rFirst = rBytes[0];
  if (rFirst !== undefined && (rFirst & 0x80)) {
    rPadded[0] = 0x00;
  }
  const sFirst = sBytes[0];
  if (sFirst !== undefined && (sFirst & 0x80)) {
    sPadded[0] = 0x00;
  }
  
  rPadded.set(rBytes, rStart);
  sPadded.set(sBytes, sStart);
  
  const result = new Uint8Array(64);
  result.set(rPadded, 0);
  result.set(sPadded, 32);
  
  return result;
}

export async function createWebAuthnCredential(): Promise<WebAuthnCredential | null> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return null;
  }
  
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);
  
  const userId = new Uint8Array(64);
  crypto.getRandomValues(userId);
  
  const options: WebAuthnCredentialCreationOptions = {
    rp: { id: WEBAUTHN_RP_ID, name: WEBAUTHN_RP_NAME },
    user: { id: userId, name: 'ONYX User' },
    challenge,
    pubKeyCredParams: [
      { alg: -7, type: 'public-key' },
    ],
    timeout: 60000,
    attestation: 'none',
  };
  
  try {
    const credential = await navigator.credentials.create({
      publicKey: options as any,
    }) as PublicKeyCredential | null;
    
    if (!credential) {
      return null;
    }
    
    const rawId = new Uint8Array(credential.rawId);
    const clientDataJSON = new TextEncoder().encode(
      JSON.stringify({
        origin: `http://${WEBAUTHN_RP_ID}`,
        challenge: base64UrlEncode(challenge),
        hash_algorithm: 'SHA-256',
      })
    );
    
    const clientDataHash = new Uint8Array(32);
    const hashBuffer = await crypto.subtle.digest('SHA-256', clientDataJSON);
    clientDataHash.set(new Uint8Array(hashBuffer));
    
    const response = (credential as any).response;
    const authenticatorData = response.attestationObject ? new Uint8Array(response.attestationObject) : new Uint8Array(response.clientDataJSON);
    
    return {
      id: credential.id,
      publicKey: rawId,
      sign: async (challenge: Uint8Array): Promise<Uint8Array> => {
        return (credential as any).sign(challenge);
      },
    };
  } catch (error) {
    console.error('WebAuthn credential creation failed:', error);
    return null;
  }
}

export async function signWithWebAuthn(
  credential: WebAuthnCredential,
  message: Uint8Array
): Promise<Uint8Array> {
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);
  
  const options: WebAuthnCredentialRequestOptions = {
    challenge,
    rpId: WEBAUTHN_RP_ID,
    allowCredentials: [
      { type: 'public-key', id: credential.publicKey },
    ],
    userVerification: 'preferred',
  };
  
  try {
    const assertion = await navigator.credentials.get({
      publicKey: options as any,
    }) as PublicKeyCredential | null;
    
    if (!assertion) {
      throw new Error('WebAuthn signing failed');
    }
    
    const response = assertion.response as AuthenticatorAssertionResponse;
    
    let signature: Uint8Array;
    
    if (response.signature) {
      if (response.signature instanceof ArrayBuffer) {
        signature = new Uint8Array(response.signature);
      } else {
        signature = new Uint8Array(response.signature);
      }
      
      signature = derSignatureToRawRS(signature);
    } else {
      throw new Error('No signature in WebAuthn response');
    }
    
    return signature;
  } catch (error) {
    throw new Error(`WebAuthn sign failed: ${error}`);
  }
}

export function generateSignedKeypair(): Keypair {
  return Keypair.generate();
}

export async function signTransactionWithKeypair(
  connection: Connection,
  tx: Transaction,
  payer: Keypair,
  signers: Keypair[]
): Promise<string> {
  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = payer.publicKey;
  
  tx.sign(...signers);
  
  const txSig = await connection.sendTransaction(tx, signers);
  
  await connection.confirmTransaction(txSig);
  
  return txSig;
}

export function verifySignature(signature: Uint8Array, publicKey: Uint8Array, message: Uint8Array): boolean {
  try {
    if (signature.length !== 64) {
      return false;
    }
    
    const { Signature } = require('@solana/web3.js');
    const sig = Signature.populate(signature, publicKey);
    return sig.verify(message);
  } catch {
    return false;
  }
}

export function parseWebAuthnResponse(response: any): {
  signature: Uint8Array;
  clientDataJSON: string;
  authenticatorData: Uint8Array;
} {
  return {
    signature: new Uint8Array(response.signature),
    clientDataJSON: new TextDecoder().decode(response.clientDataJSON),
    authenticatorData: new Uint8Array(response.authenticatorData),
  };
}

export function encodeWebAuthnClientData(options: {
  challenge: Uint8Array;
  origin: string;
  type: 'webauthn.create' | 'webauthn.get';
}): string {
  return JSON.stringify({
    challenge: base64UrlEncode(options.challenge),
    origin: options.origin,
    type: options.type,
  });
}