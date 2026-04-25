/**
 * revenue.ts — Route content revenue to ONYX treasury
 * Converts USD → USDC lamports and calls @onyx/privacy agentTreasury.receiveRevenue()
 *
 * USDC uses 6 decimal places:
 *   1 USD = 1_000_000 USDC lamports (micro-USDC)
 */

const USDC_DECIMALS = 6;
const LAMPORTS_PER_USD = 10 ** USDC_DECIMALS;

function usdToLamports(amountUSD: number): bigint {
  return BigInt(Math.round(amountUSD * LAMPORTS_PER_USD));
}

export async function routeRevenue(amountUSD: number, source: string): Promise<void> {
  if (amountUSD <= 0) throw new Error(`routeRevenue: amountUSD must be positive, got ${amountUSD}`);

  const lamports = usdToLamports(amountUSD);

  console.log(`[revenue] Routing $${amountUSD} USD from "${source}" → ${lamports} USDC lamports`);

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const privacy = await import('@onyx/privacy' as any);
    const treasury = privacy.agentTreasury ?? privacy.default?.agentTreasury;

    if (treasury && typeof treasury.receiveRevenue === 'function') {
      await treasury.receiveRevenue(lamports);
      console.log(`[revenue] Treasury credited ${lamports} lamports from ${source}`);
    } else {
      console.warn('[revenue] @onyx/privacy agentTreasury.receiveRevenue not found — skipping on-chain credit');
    }
  } catch (err) {
    console.warn(`[revenue] @onyx/privacy unavailable: ${(err as Error).message}`);
    console.log(`[revenue] Dry-run: would credit ${lamports} lamports (source: ${source})`);
  }
}

export function usdToUsdcLamports(amountUSD: number): bigint {
  return usdToLamports(amountUSD);
}