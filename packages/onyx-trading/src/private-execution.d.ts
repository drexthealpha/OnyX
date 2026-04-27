/**
 * Private execution — routes all trades through @onyx/privacy (Umbra)
 * Operator cost: $0 — user provides their Umbra setup
 */
import { ExecutionResult } from './types.js';
export interface PrivateTradeParams {
    token: string;
    action: 'BUY' | 'SELL';
    amountUsd: number;
    slippageBps?: number;
}
export declare function executePrivate(params: PrivateTradeParams): Promise<ExecutionResult>;
//# sourceMappingURL=private-execution.d.ts.map