import type { Address, U64 } from './types.js';
import type { UmbraClient } from './client.js';
export interface UTXOCreateParams {
    destinationAddress: Address;
    mint: Address;
    amount: U64;
}
export declare function createSelfClaimableUtxoFromEncryptedBalance(client: UmbraClient, zkProver: unknown, params: UTXOCreateParams): Promise<string[]>;
export declare function createReceiverClaimableUtxoFromEncryptedBalance(client: UmbraClient, zkProver: unknown, params: UTXOCreateParams): Promise<string[]>;
export declare function createSelfClaimableUtxoFromPublicBalance(client: UmbraClient, zkProver: unknown, params: UTXOCreateParams): Promise<string[]>;
export declare function createReceiverClaimableUtxoFromPublicBalance(client: UmbraClient, zkProver: unknown, params: UTXOCreateParams): Promise<string[]>;
//# sourceMappingURL=utxo-create.d.ts.map