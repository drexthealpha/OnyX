/**
 * RL reporter — reports trade outcomes to the RL module for reinforcement learning
 * Computes Sharpe ratio over last 30 trades
 * Posts to POST http://localhost:${RL_PORT}/outcome
 */
import { CompletedTrade } from './types.js';
export declare function reportTrade(trade: CompletedTrade): Promise<void>;
//# sourceMappingURL=rl-reporter.d.ts.map