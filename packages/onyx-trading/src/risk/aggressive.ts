/**
 * Aggressive risk profile — Kelly multiplier 1.0 (full Kelly)
 * Higher returns, higher variance
 */

import { ResearchReport, Portfolio, RiskDecision } from '../types.js';
import { adjudicate } from './manager.js';

export function adjudicateAggressive(
  bull: ResearchReport,
  bear: ResearchReport,
  portfolio: Portfolio,
): RiskDecision {
  return adjudicate(bull, bear, portfolio, 1.0);
}