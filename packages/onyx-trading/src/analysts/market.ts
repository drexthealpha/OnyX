/**
 * Market analyst — fetches OHLCV from Birdeye, computes technical indicators
 * Operator cost: $0 — user provides BIRDEYE_API_KEY
 */

import { fetchOHLCV, fetchPrice } from '../data/birdeye.js';
import { MarketAnalysis, OHLCV } from '../types.js';

function sma(values: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) { result.push(NaN); continue; }
    const slice = values.slice(i - period + 1, i + 1);
    result.push(slice.reduce((s, v) => s + v, 0) / period);
  }
  return result;
}

function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const result: number[] = [];
  let prev = NaN;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) { result.push(NaN); continue; }
    if (i === period - 1) {
      prev = values.slice(0, period).reduce((s, v) => s + v, 0) / period;
      result.push(prev);
      continue;
    }
    prev = values[i] * k + prev * (1 - k);
    result.push(prev);
  }
  return result;
}

function rsi(closes: number[], period = 14): number[] {
  const result: number[] = new Array(period).fill(NaN);
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) avgGain += diff;
    else avgLoss += Math.abs(diff);
  }
  avgGain /= period;
  avgLoss /= period;
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result.push(100 - 100 / (1 + rs));

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const rs_ = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result.push(100 - 100 / (1 + rs_));
  }
  return result;
}

interface MACDResult {
  macd: number[];
  signal: number[];
  histogram: number[];
}

function macd(closes: number[], fast = 12, slow = 26, signal_ = 9): MACDResult {
  const emaFast = ema(closes, fast);
  const emaSlow = ema(closes, slow);
  const macdLine = emaFast.map((v, i) => (isNaN(v) || isNaN(emaSlow[i])) ? NaN : v - emaSlow[i]);
  const validMacd = macdLine.filter(v => !isNaN(v));
  const signalLine = ema(validMacd, signal_);

  const padLen = macdLine.length - signalLine.length;
  const signalPadded = [...new Array(padLen).fill(NaN), ...signalLine];
  const histogram = macdLine.map((v, i) =>
    (isNaN(v) || isNaN(signalPadded[i])) ? NaN : v - signalPadded[i]
  );

  return { macd: macdLine, signal: signalPadded, histogram };
}

interface BBResult {
  upper: number[];
  middle: number[];
  lower: number[];
}

function bollingerBands(closes: number[], period = 20, stdDev = 2): BBResult {
  const middle = sma(closes, period);
  const upper: number[] = [];
  const lower: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (isNaN(middle[i])) { upper.push(NaN); lower.push(NaN); continue; }
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = middle[i];
    const variance = slice.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / period;
    const sd = Math.sqrt(variance);
    upper.push(mean + stdDev * sd);
    lower.push(mean - stdDev * sd);
  }
  return { upper, middle, lower };
}

function computeSignal(indicators: MarketAnalysis['indicators'], price: number): {
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
} {
  let score = 0;
  let factors = 0;

  if (!isNaN(indicators.rsi14)) {
    factors++;
    if (indicators.rsi14 < 30) score += 1;
    else if (indicators.rsi14 > 70) score -= 1;
  }

  if (!isNaN(indicators.macdHistogram)) {
    factors++;
    score += indicators.macdHistogram > 0 ? 0.7 : -0.7;
  }

  if (!isNaN(indicators.sma20) && indicators.sma20 > 0) {
    factors++;
    score += price > indicators.sma20 ? 0.5 : -0.5;
  }

  if (!isNaN(indicators.ema9) && indicators.ema9 > 0) {
    factors++;
    score += price > indicators.ema9 ? 0.5 : -0.5;
  }

  if (!isNaN(indicators.bbLower) && !isNaN(indicators.bbUpper)) {
    factors++;
    if (price < indicators.bbLower) score += 1;
    else if (price > indicators.bbUpper) score -= 1;
  }

  const normalised = factors > 0 ? score / factors : 0;
  const confidence = Math.min(1, Math.abs(normalised));

  let signal: 'BUY' | 'SELL' | 'HOLD';
  if (normalised > 0.3) signal = 'BUY';
  else if (normalised < -0.3) signal = 'SELL';
  else signal = 'HOLD';

  return { signal, confidence };
}

export async function analyze(token: string): Promise<MarketAnalysis> {
  const [candles, price] = await Promise.all([
    fetchOHLCV({ address: token, type: '1H', limit: 200 }),
    fetchPrice(token),
  ]);

  if (candles.length < 26) {
    throw new Error(`Insufficient candles for analysis: ${candles.length} (need ≥26)`);
  }

  const closes = candles.map(c => c.close);

  const sma20Arr = sma(closes, 20);
  const ema9Arr = ema(closes, 9);
  const rsi14Arr = rsi(closes, 14);
  const macdResult = macd(closes, 12, 26, 9);
  const bbResult = bollingerBands(closes, 20, 2);

  const last = closes.length - 1;

  const indicators: MarketAnalysis['indicators'] = {
    sma20: sma20Arr[last] ?? NaN,
    ema9: ema9Arr[last] ?? NaN,
    rsi14: rsi14Arr[last] ?? NaN,
    macd: macdResult.macd[last] ?? NaN,
    macdSignal: macdResult.signal[last] ?? NaN,
    macdHistogram: macdResult.histogram[last] ?? NaN,
    bbUpper: bbResult.upper[last] ?? NaN,
    bbMiddle: bbResult.middle[last] ?? NaN,
    bbLower: bbResult.lower[last] ?? NaN,
  };

  const { signal, confidence } = computeSignal(indicators, price);

  return {
    token,
    price,
    signal,
    confidence,
    indicators,
    candles,
    timestamp: Date.now(),
  };
}