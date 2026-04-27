import type { Address, U64, DepositResult, WithdrawResult, ComplianceReport } from './types.js';
import type { UmbraClient } from './client.js';
export declare class OnyxNeobank {
    private client;
    constructor(client: UmbraClient);
    getPrivateBalance(mint: Address): Promise<bigint>;
    deposit(mint: Address, amount: U64): Promise<DepositResult>;
    withdraw(mint: Address, amount: U64, destination: Address): Promise<WithdrawResult>;
    transfer(mint: Address, amount: U64, recipient: Address): Promise<string[]>;
    getStatement(startTs: number, endTs: number): Promise<ComplianceReport>;
}
//# sourceMappingURL=neobank.d.ts.map