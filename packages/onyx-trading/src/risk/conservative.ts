/**
 * Conservative risk profile — Kelly multiplier 0.25 (quarter Kelly)
 * Much lower position sizes, capital preservation focus
 */

import { ResearchReport, Portfolio, RiskDecision } from '../types.js';
import { adjudicate } from './manager.js';

export function adjudicateConservative(
  bull: ResearchReport,
  bear: ResearchReport,
  portfolio: Portfolio,
): RiskDecision {
  return adjudicate(bull, bear, portfolio, 0.25);
}