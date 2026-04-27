/**
 * Conservative risk profile — Kelly multiplier 0.25 (quarter Kelly)
 * Much lower position sizes, capital preservation focus
 */
import { ResearchReport, Portfolio, RiskDecision } from '../types.js';
export declare function adjudicateConservative(bull: ResearchReport, bear: ResearchReport, portfolio: Portfolio): RiskDecision;
//# sourceMappingURL=conservative.d.ts.map