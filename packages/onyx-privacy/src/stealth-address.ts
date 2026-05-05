import { getUserAccountQuerierFunction } from '@umbra-privacy/sdk';
import type { StealthPayment } from './types.js';
import type { UmbraClient } from './client.js';

export interface StealthAddressResult {
  stealthAddress: string;
  ephemeralPublicKey: string;
  encryptedNote: string;
}

async function getRandomBytes(length: number): Promise<Uint8Array> {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return crypto.getRandomValues(new Uint8Array(length));
  }
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function generateStealthAddress(recipientPublicKey: string): Promise<StealthAddressResult> {
  const ephemeralPrivate = await getRandomBytes(32);
  const ephemeralPublic = await getRandomBytes(32);
  
  const sharedSecret = ephemeralPrivate.slice();
  for (let i = 0; i < 32 && i < recipientPublicKey.length / 2; i++) {
    const recipientByte = parseInt(recipientPublicKey.slice(i * 2, i * 2 + 2), 16);
    sharedSecret[i] ^= recipientByte;
  }
  
  const stealthAddressBytes = await getRandomBytes(32);
  const stealthAddress = bytesToHex(stealthAddressBytes);
  
  const encryptedNote = bytesToHex(sharedSecret);
  
  return {
    stealthAddress,
    ephemeralPublicKey: bytesToHex(ephemeralPublic),
    encryptedNote,
  };
}

export async function scanForStealthPayments(
  client: UmbraClient,
  _viewingKey: string,
  _startBlock?: number,
): Promise<StealthPayment[]> {
  const query = getUserAccountQuerierFunction({ client });
  const result = await query(client.signer.address);
  
  if (result.state !== 'exists') {
    return [];
  }
  
  return [];
}