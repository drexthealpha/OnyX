import type { Address, U64, GiftCard, ClaimResult } from './types.js';
import type { UmbraClient } from './client.js';
export declare function issueGiftCard(client: UmbraClient, mint: Address, amount: U64): Promise<GiftCard>;
export declare function claimGiftCard(client: UmbraClient, claimCode: string): Promise<ClaimResult>;
//# sourceMappingURL=gift-card.d.ts.map