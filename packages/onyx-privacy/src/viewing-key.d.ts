import type { Address } from './types.js';
export declare function deriveMVK(wallet: {
    publicKey: Uint8Array;
}): string;
export declare function deriveMintKey(mvk: string, mint: Address): string;
export declare function deriveYearlyKey(mintKey: string, year: number): string;
export declare function deriveMonthlyKey(yearlyKey: string, month: number): string;
export declare function deriveDailyKey(monthlyKey: string, day: number): string;
//# sourceMappingURL=viewing-key.d.ts.map