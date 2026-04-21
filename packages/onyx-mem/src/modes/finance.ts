// ─────────────────────────────────────────────
// onyx-mem · modes/finance.ts
// Finance / DeFi domain hints
// ─────────────────────────────────────────────

export const financeHints = `
Domain: Finance / DeFi / On-chain
Extra extraction rules:
- Capture on-chain program addresses, PDAs, and their purposes.
- Record token amounts, decimals, and any lamport/SOL conversions noted.
- Note fee structures, slippage tolerances, and priority fee decisions.
- Capture audit findings or security concerns as errors.
- Record protocol integrations (Jupiter, Raydium, Drift, etc.) and why chosen.
`.trim();