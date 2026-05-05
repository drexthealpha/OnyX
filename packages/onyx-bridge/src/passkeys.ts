import { 
  address, 
  appendTransactionMessageInstruction, 
  createSolanaRpc, 
  createTransactionMessage, 
  pipe, 
  setTransactionMessageFeePayerSigner, 
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  Address,
  Rpc,
  SolanaRpcApi,
  TransactionSigner,
  Instruction,
  appendTransactionMessageInstructions,
} from '@solana/kit';
import nacl from 'tweetnacl';

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

export async function generateSignedKeypair(): Promise<TransactionSigner> {
  const { createKeyPairSignerFromBytes } = await import('@solana/signers');
  const bytes = new Uint8Array(64);
  crypto.getRandomValues(bytes);
  return await createKeyPairSignerFromBytes(bytes);
}

export async function signTransactionMessage(
  rpc: Rpc<SolanaRpcApi>,
  instructions: Instruction[],
  payer: TransactionSigner,
  signers: TransactionSigner[]
): Promise<string> {
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (m) => setTransactionMessageFeePayerSigner(payer, m),
    (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
    (m) => appendTransactionMessageInstructions(instructions, m)
  );

  const fullySignedTransaction = await signTransactionMessageWithSigners(transactionMessage);
  const { getBase64EncodedWireTransaction } = await import('@solana/transactions');
  const wireTransaction = getBase64EncodedWireTransaction(fullySignedTransaction);
  
  return await rpc.sendTransaction(wireTransaction).send();
}

export async function verifySignature(signature: Uint8Array, publicKey: Address, message: Uint8Array): Promise<boolean> {
  try {
    const { getAddressEncoder } = await import('@solana/addresses');
    return nacl.sign.detached.verify(
      message, 
      signature, 
      new Uint8Array(getAddressEncoder().encode(publicKey))
    );
  } catch {
    return false;
  }
}

export function parseWebAuthnResponse(response: unknown): {
  signature: Uint8Array;
  clientDataJSON: string;
  authenticatorData: Uint8Array;
} {
  const r = response as { signature: ArrayBuffer; clientDataJSON: ArrayBuffer; authenticatorData: ArrayBuffer };
  return {
    signature: new Uint8Array(r.signature),
    clientDataJSON: new TextDecoder().decode(r.clientDataJSON),
    authenticatorData: new Uint8Array(r.authenticatorData),
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