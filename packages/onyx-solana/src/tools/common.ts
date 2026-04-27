/**
 * @onyx/solana — common
 */

const HELIUS_KEY = process.env.HELIUS_API_KEY ?? "";
export const HELIUS_RPC =
  process.env.HELIUS_RPC_URL ??
  (HELIUS_KEY
    ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`
    : "https://api.mainnet-beta.solana.com");

export async function rpc(method: string, params: unknown[]): Promise<unknown> {
  const res = await fetch(HELIUS_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const data = (await res.json()) as {
    result?: unknown;
    error?: { message: string };
  };
  if (data.error) throw new Error(`RPC ${method}: ${data.error.message}`);
  return data.result;
}