import type { StealthPayment } from './types.js';
import type { UmbraClient } from './client.js';
export interface StealthAddressResult {
    stealthAddress: string;
    ephemeralPublicKey: string;
    encryptedNote: string;
}
export declare function generateStealthAddress(recipientPublicKey: string): Promise<StealthAddressResult>;
export declare function scanForStealthPayments(client: UmbraClient, viewingKey: string, startBlock?: number): Promise<StealthPayment[]>;
//# sourceMappingURL=stealth-address.d.ts.map