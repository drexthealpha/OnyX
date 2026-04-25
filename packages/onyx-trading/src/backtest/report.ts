/**
 * Backtest report — formatted ASCII report of backtest results
 */

import { BacktestResult } from '../types.js';

export function formatReport(result: BacktestResult, title = 'Onyx Backtest Report'): string {
  const lines: string[] = [];
  const bar = '═'.repeat(60);

  lines.push('');
  lines.push(bar);
  lines.push(`  ${title}`);
  lines.push(bar);

  lines.push('');
  lines.push('  PERFORMANCE SUMMARY');
  lines.push('  ─────────────────────────────────────────────────');
  lines.push(`  Starting Equity:    $${result.startEquity.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  lines.push(`  Ending Equity:      $${result.endEquity.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  lines.push(`  Total Return:       ${(result.totalReturn * 100).toFixed(2)}%`);
  lines.push(`  Max Drawdown:       ${(result.maxDrawdown * 100).toFixed(2)}%`);

  lines.push('');
  lines.push('  RISK METRICS');
  lines.push('  ─────────────────────────────────────────────────');
  lines.push(`  Sharpe Ratio:       ${result.sharpe.toFixed(3)}`);
  lines.push(`  Sortino Ratio:      ${result.sortino.toFixed(3)}`);

  lines.push('');
  lines.push('  TRADE STATISTICS');
  lines.push('  ─────────────────────────────────────────────────');
  lines.push(`  Total Trades:       ${result.totalTrades}`);
  lines.push(`  Win Rate:           ${(result.winRate * 100).toFixed(1)}%`);

  if (result.equityCurve.length > 0) {
    const peak = Math.max(...result.equityCurve);
    const trough = Math.min(...result.equityCurve);
    lines.push('');
    lines.push('  EQUITY CURVE SUMMARY');
    lines.push('  ─────────────────────────────────────────────────');
    lines.push(`  Peak Equity:        $${peak.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    lines.push(`  Trough Equity:      $${trough.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    lines.push(`  Data Points:        ${result.equityCurve.length}`);

    lines.push('');
    lines.push('  EQUITY CURVE (normalised)');
    const chartWidth = 50;
    const step = Math.max(1, Math.floor(result.equityCurve.length / chartWidth));
    const sampled = result.equityCurve.filter((_, i) => i % step === 0);
    const min = Math.min(...sampled);
    const max = Math.max(...sampled);
    const range = max - min || 1;

    const chartLines: string[] = [];
    const chartHeight = 8;
    for (let row = chartHeight - 1; row >= 0; row--) {
      const threshold = min + (row / (chartHeight - 1)) * range;
      const label = `$${(min + (row / (chartHeight - 1)) * range).toFixed(0).padStart(7)}  `;
      const bar_ = sampled.map(v => (v >= threshold ? '█' : ' ')).join('');
      chartLines.push(`  ${label}${bar_}`);
    }
    lines.push(...chartLines);
  }

  lines.push('');
  lines.push(bar);
  lines.push('');

  return lines.join('\n');
}