import type { Address, U64, DepositResult, WithdrawResult } from './types.js';
import type { UmbraClient } from './client.js';
export declare class OnyxAgentTreasury {
    private client;
    private autoshieldThreshold;
    constructor(client: UmbraClient, config?: {
        autoshieldThreshold?: bigint;
    });
    onReceive(mint: Address, amount: U64): Promise<DepositResult>;
    pay(mint: Address, amount: U64, destination: Address): Promise<WithdrawResult>;
    getEncryptedBalance(mint: Address): Promise<bigint>;
    shield(mint: Address, amount: U64): Promise<DepositResult>;
    unshield(mint: Address, amount: U64, destination: Address): Promise<WithdrawResult>;
}
//# sourceMappingURL=agent-treasury.d.ts.map