import type { ClaimResult } from './types.js';
export interface OnyxRelayer {
    apiEndpoint: string;
}
export declare function getOnyxRelayer(endpoint: string): OnyxRelayer;
export declare function pollUntilComplete(relayer: OnyxRelayer, requestId: string): Promise<ClaimResult>;
//# sourceMappingURL=relayer.d.ts.map