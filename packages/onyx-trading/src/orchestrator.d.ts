/**
 * Main orchestrator — runs the full multi-agent trading pipeline
 * Bull + Bear researchers run in parallel (Promise.all)
 * Risk manager adjudicates
 */
import { TradeDecision } from './types.js';
export type RiskProfile = 'aggressive' | 'neutral' | 'conservative';
export interface OrchestratorConfig {
    riskProfile: RiskProfile;
    runAllAnalysts: boolean;
}
export declare function runAnalysis(token: string, config?: Partial<OrchestratorConfig>): Promise<TradeDecision>;
//# sourceMappingURL=orchestrator.d.ts.map