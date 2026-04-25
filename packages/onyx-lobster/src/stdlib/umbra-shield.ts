export async function umbraShield(
  mint: string,
  amount: bigint,
): Promise<{ signature: string }> {
  const privacy = await import('@onyx/privacy');
  const result = await privacy.shieldAsset(mint, amount);
  return { signature: result.signature };
}