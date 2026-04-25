/**
 * onyx-trading test suite
 * Tests:
 * 1. Risk manager Kelly size is between 0 and 0.25
 * 2. Backtest runs 100 candles without error and returns equity curve
 */

import { describe, it, expect } from '@jest/globals';
import { adjudicate } from '../src/risk/manager';
import { run as runBacktest } from '../src/backtest/engine';

describe('Risk Manager — Kelly Criterion sizing', () => {
  it('should always return Kelly size between 0 and 0.25', () => {
    const portfolio = {
      totalValueUsd: 10000,
      positions: {},
      cashUsd: 10000,
      timestamp: Date.now(),
    };

    const testCases = [
      { bullConf: 0.9, bearConf: 0.1 },
      { bullConf: 0.5, bearConf: 0.5 },
      { bullConf: 0.1, bearConf: 0.9 },
      { bullConf: 0.7, bearConf: 0.3 },
      { bullConf: 0.3, bearConf: 0.8 },
      { bullConf: 1.0, bearConf: 0.0 },
      { bullConf: 0.0, bearConf: 1.0 },
    ];

    for (const tc of testCases) {
      const bull = {
        thesis: 'Bull thesis',
        supportingPoints: [] as string[],
        risks: [] as string[],
        confidence: tc.bullConf,
        stance: 'BULL' as 'BULL',
      };
      const bear = {
        thesis: 'Bear thesis',
        supportingPoints: [] as string[],
        risks: [] as string[],
        confidence: tc.bearConf,
        stance: 'BEAR' as 'BEAR',
      };

      for (const mult of [0.25, 0.5, 1.0]) {
        const decision = adjudicate(bull, bear, portfolio, mult);

        expect(decision.size).toBeGreaterThanOrEqual(0);
        expect(decision.size).toBeLessThanOrEqual(0.25);
        expect(['BUY', 'SELL', 'HOLD']).toContain(decision.action);
        expect(decision.confidence).toBeGreaterThanOrEqual(0);
        expect(decision.confidence).toBeLessThanOrEqual(1);
        expect(typeof decision.reasoning).toBe('string');
      }
    }
  });

  it('should return HOLD when bull and bear are equally confident', () => {
    const portfolio = {
      totalValueUsd: 10000,
      positions: {},
      cashUsd: 10000,
      timestamp: Date.now(),
    };

    const equalBull = { thesis: 'Equal', supportingPoints: [] as string[], risks: [] as string[], confidence: 0.5, stance: 'BULL' as 'BULL' };
    const equalBear = { thesis: 'Equal', supportingPoints: [] as string[], risks: [] as string[], confidence: 0.5, stance: 'BEAR' as 'BEAR' };
    const decision = adjudicate(equalBull, equalBear, portfolio, 0.5);

    expect(decision.action).toBe('HOLD');
    expect(decision.size).toBeGreaterThanOrEqual(0);
    expect(decision.size).toBeLessThanOrEqual(0.25);
  });
});

describe('Backtest Engine — 100 candle run', () => {
  it('should run 100 candles and return a valid equity curve', async () => {
    const candles = Array.from({ length: 100 }, (_, i) => {
      const price = 1.0 + 0.001 * i + 0.01 * Math.sin(i * 0.3);
      return {
        timestamp: Date.now() - (100 - i) * 3600000,
        open: price * 0.999,
        high: price * 1.003,
        low: price * 0.997,
        close: price,
        volume: 5000,
      };
    });

    const prices: number[] = [];
    const strategy = (candle: { close: number }): { action: 'BUY' | 'SELL' | 'HOLD'; size: number } => {
      prices.push(candle.close);
      if (prices.length < 15) return { action: 'HOLD', size: 0 };

      const recent = prices.slice(-15);
      let gains = 0;
      let losses = 0;
      for (let j = 1; j < recent.length; j++) {
        const diff = recent[j] - recent[j - 1];
        if (diff > 0) gains += diff;
        else losses += Math.abs(diff);
      }
      const avgGain = gains / 14;
      const avgLoss = losses / 14;
      const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

      if (rsi < 40) return { action: 'BUY' as 'BUY', size: 0.3 };
      if (rsi > 60) return { action: 'SELL' as 'SELL', size: 1.0 };
      return { action: 'HOLD' as 'HOLD', size: 0 };
    };

    const result = await runBacktest(strategy, candles, { startingEquity: 10000 });

    expect(result).toBeDefined();
    expect(result.equityCurve).toHaveLength(candles.length);
    expect(result.startEquity).toBe(10000);
    expect(result.endEquity).toBeGreaterThan(0);
    expect(result.totalReturn).toBeDefined();
    expect(typeof result.sharpe).toBe('number');
    expect(typeof result.sortino).toBe('number');
    expect(result.maxDrawdown).toBeLessThanOrEqual(0);
    expect(result.winRate).toBeGreaterThanOrEqual(0);
    expect(result.winRate).toBeLessThanOrEqual(1);

    for (const eq of result.equityCurve) {
      expect(isNaN(eq)).toBe(false);
      expect(eq).toBeGreaterThan(0);
    }
  });

  it('should handle HOLD-only strategy (no trades)', async () => {
    const candles = Array.from({ length: 100 }, (_, i) => ({
      timestamp: Date.now() - (100 - i) * 3600000,
      open: 1.0,
      high: 1.01,
      low: 0.99,
      close: 1.0,
      volume: 1000,
    }));

    const holdStrategy = () => ({ action: 'HOLD' as const, size: 0 });
    const result = await runBacktest(holdStrategy, candles, { startingEquity: 10000 });

    expect(result.totalTrades).toBe(0);
    expect(result.endEquity).toBeCloseTo(10000, 0);
    expect(result.equityCurve).toHaveLength(100);
  });
});