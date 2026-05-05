import { createUmbraClient, shieldAsset, createAddress, createU64 } from '@onyx/privacy';

export async function umbraShield(
  mint: string,
  amount: bigint,
  destination: string,
): Promise<{ signature: string }> {
  const signer = (globalThis as any).umbraSigner;
  if (!signer) {
    throw new Error('Umbra signer not configured. Set globalThis.umbraSigner with a wallet adapter.');
  }
  
  const client = await createUmbraClient({ signer });
  const result = await shieldAsset(
    client,
    createAddress(mint),
    createU64(amount),
    createAddress(destination)
  );
  return { signature: result.queueSignature };
}