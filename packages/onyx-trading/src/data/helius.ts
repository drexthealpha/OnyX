/**
 * Helius on-chain token data
 * API key: user's HELIUS_API_KEY env var (operator cost $0)
 * Docs: https://docs.helius.dev/
 */

import axios from 'axios';

function getApiKey(): string {
  const key = process.env['HELIUS_API_KEY'];
  if (!key) throw new Error('HELIUS_API_KEY env var not set');
  return key;
}

const BASE = 'https://mainnet.helius-rpc.com';

export interface TokenMetadata {
  mint: string;
  name: string;
  symbol: string;
  decimals: number;
  supply: number;
  holders: number;
  mintAuthority: string | null;
  freezeAuthority: string | null;
  updateAuthority: string | null;
}

export async function fetchTokenMetadata(mint: string): Promise<TokenMetadata> {
  const key = getApiKey();
  const res = await axios.post(
    `${BASE}/?api-key=${key}`,
    {
      jsonrpc: '2.0',
      id: 'onyx-helius',
      method: 'getAsset',
      params: { id: mint },
    },
    { headers: { 'Content-Type': 'application/json' } },
  );

  const d = res.data?.result ?? {};
  const content = d.content ?? {};
  const token = d.token_info ?? {};

  return {
    mint,
    name: content.metadata?.name ?? '',
    symbol: content.metadata?.symbol ?? '',
    decimals: token.decimals ?? 9,
    supply: token.supply ?? 0,
    holders: d.ownership?.delegate_count ?? 0,
    mintAuthority: d.authorities?.find((a: { scopes: string[] }) => a.scopes.includes('mint'))?.address ?? null,
    freezeAuthority: d.authorities?.find((a: { scopes: string[] }) => a.scopes.includes('freeze'))?.address ?? null,
    updateAuthority: d.authorities?.find((a: { scopes: string[] }) => a.scopes.includes('update'))?.address ?? null,
  };
}

export interface TransactionStats {
  mint: string;
  count24h: number;
  uniqueSigners24h: number;
  volumeSol24h: number;
}

export async function fetchTransactionStats(mint: string): Promise<TransactionStats> {
  const key = getApiKey();
  const timeSince = Math.floor(Date.now() / 1000) - 86400;
  const res = await axios.get(
    `https://api.helius.xyz/v0/addresses/${mint}/transactions`,
    {
      params: {
        'api-key': key,
        limit: 100,
        type: 'SWAP',
      },
    },
  );

  const txns: Array<{ timestamp: number; feePayer: string; nativeTransfers?: Array<{ amount: number }> }> =
    res.data ?? [];
  const recent = txns.filter(t => t.timestamp >= timeSince);
  const signers = new Set(recent.map(t => t.feePayer));
  const volSol = recent.reduce((sum, t) => {
    const native = t.nativeTransfers ?? [];
    return sum + native.reduce((s, n) => s + n.amount, 0) / 1e9;
  }, 0);

  return {
    mint,
    count24h: recent.length,
    uniqueSigners24h: signers.size,
    volumeSol24h: volSol,
  };
}