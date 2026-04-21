// ─────────────────────────────────────────────
// onyx-mem · modes/trading.ts
// Trading / Quant domain hints
// ─────────────────────────────────────────────

export const tradingHints = `
Domain: Trading / Quantitative finance
Extra extraction rules:
- Capture strategy parameters (entry/exit conditions, timeframes, indicators).
- Record backtesting results summary (Sharpe, max drawdown, win rate).
- Note risk management decisions (position sizing, stop-loss rules).
- Capture market regime assumptions made.
- Flag overfitting concerns or data-snooping biases as errors.
`.trim();