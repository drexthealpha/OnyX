/**
 * Neutral risk profile — Kelly multiplier 0.5 (half Kelly)
 * Balanced risk/reward, the default
 */

import { ResearchReport, Portfolio, RiskDecision } from '../types.js';
import { adjudicate } from './manager.js';

export function adjudicateNeutral(
  bull: ResearchReport,
  bear: ResearchReport,
  portfolio: Portfolio,
): RiskDecision {
  return adjudicate(bull, bear, portfolio, 0.5);
}