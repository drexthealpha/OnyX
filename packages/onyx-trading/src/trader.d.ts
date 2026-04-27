/**
 * Trader — executes RiskDecision by routing through @onyx/solana swapTokens
 * and @onyx/privacy for position privacy
 */
import { RiskDecision, ExecutionResult, Portfolio } from './types.js';
export interface TraderConfig {
    usePrivacy: boolean;
    maxSlippageBps: number;
    dryRun: boolean;
}
export declare function execute(token: string, decision: RiskDecision, portfolio: Portfolio, config?: Partial<TraderConfig>): Promise<ExecutionResult>;
//# sourceMappingURL=trader.d.ts.map