/**
 * Risk manager — adjudicates bull vs bear debate using Kelly Criterion
 * Kelly: f* = (b*p - q) / b
 *   b = odds (bullConfidence / bearConfidence ratio)
 *   p = probability of win (bull.confidence)
 *   q = 1 - p
 * Position size = Kelly fraction * kellyMultiplier * 0.5 (half-Kelly safety)
 * Clamped to [0, 0.25] of portfolio
 */
import { ResearchReport, Portfolio, RiskDecision } from '../types.js';
export declare function adjudicate(bull: ResearchReport, bear: ResearchReport, portfolio: Portfolio, kellyMultiplier?: number): RiskDecision;
//# sourceMappingURL=manager.d.ts.map