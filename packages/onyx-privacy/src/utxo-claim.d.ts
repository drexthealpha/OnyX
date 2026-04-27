import type { ClaimResult } from './types.js';
import type { UmbraClient } from './client.js';
type UTXO = {
    [key: string]: unknown;
};
export declare function claimSelfClaimableToEncryptedBalance(client: UmbraClient, zkProver: unknown, relayer: unknown, utxos: UTXO[]): Promise<ClaimResult>;
export declare function claimReceiverClaimableToEncryptedBalance(client: UmbraClient, zkProver: unknown, relayer: unknown, utxos: UTXO[]): Promise<ClaimResult>;
export declare function claimSelfClaimableToPublicBalance(client: UmbraClient, zkProver: unknown, relayer: unknown, utxos: UTXO[]): Promise<ClaimResult>;
export {};
//# sourceMappingURL=utxo-claim.d.ts.map