import type { Address, WithdrawResult, U64 } from './types.js';
import type { UmbraClient } from './client.js';
export declare function unshieldAsset(client: UmbraClient, mint: Address, amount: U64, destination: Address): Promise<WithdrawResult>;
//# sourceMappingURL=unshield.d.ts.map