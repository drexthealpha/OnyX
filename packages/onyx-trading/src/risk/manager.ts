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

export function adjudicate(
  bull: ResearchReport,
  bear: ResearchReport,
  portfolio: Portfolio,
  kellyMultiplier = 0.5,
): RiskDecision {
  const p = bull.confidence;
  const q = 1 - p;

  const b = bear.confidence > 0 ? bull.confidence / bear.confidence : bull.confidence;

  const kellyFull = b > 0 ? (b * p - q) / b : 0;

  const kellyFraction = kellyFull * kellyMultiplier * 0.5;

  const size = Math.max(0, Math.min(0.25, kellyFraction));

  let action: 'BUY' | 'SELL' | 'HOLD';
  const netScore = bull.confidence - bear.confidence;

  if (netScore > 0.1 && size > 0.01) {
    action = 'BUY';
  } else if (netScore < -0.1) {
    action = 'SELL';
  } else {
    action = 'HOLD';
  }

  const confidence = Math.min(1, Math.abs(netScore) + size * 0.5);

  const reasoning = [
    `Bull thesis (confidence ${(bull.confidence * 100).toFixed(1)}%): ${bull.thesis}`,
    `Bear thesis (confidence ${(bear.confidence * 100).toFixed(1)}%): ${bear.thesis}`,
    `Kelly fraction: ${(kellyFull * 100).toFixed(2)}% → applied: ${(kellyFraction * 100).toFixed(2)}%`,
    `Position size: ${(size * 100).toFixed(2)}% of portfolio ($${(portfolio.totalValueUsd * size).toFixed(2)})`,
    `Decision: ${action}`,
  ].join('\n');

  return {
    action,
    size,
    confidence,
    reasoning,
    kellyFraction: kellyFull,
  };
}