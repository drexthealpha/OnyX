/**
 * Collection: onyx_markets
 * Stores market signals — price events, news, on-chain data, trade alerts.
 *
 * Vector size: 384 (all-MiniLM-L6-v2)
 */

import {
  createCollectionIfNotExists,
  upsert as rawUpsert,
  deletePoints,
  getPoint,
} from '../client.js';
import { embed } from '../embed.js';
import { search as rawSearch, type SearchResult } from '../search.js';

const COLLECTION = 'onyx_markets';
const VECTOR_SIZE = 384;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MarketSignalPoint {
  id: string;
  text: string;
  payload: {
    timestamp: number;
    symbol: string;
    signalType: string;
    value?: number;
    direction?: 'up' | 'down' | 'neutral';
    confidence?: number;
    source?: string;
    [key: string]: unknown;
  };
}

export interface MarketSignalResult extends SearchResult {
  payload: MarketSignalPoint['payload'];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function init(): Promise<void> {
  await createCollectionIfNotExists(COLLECTION, VECTOR_SIZE);
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function upsert(points: MarketSignalPoint[]): Promise<void> {
  await init();
  const embedded = await Promise.all(
    points.map(async (p) => ({
      id: p.id,
      vector: Array.from(await embed(p.text)),
      payload: { ...p.payload, text: p.text },
    })),
  );
  await rawUpsert(COLLECTION, embedded);
}

async function searchSignals(
  query: string,
  topK = 5,
): Promise<MarketSignalResult[]> {
  await init();
  const results = await rawSearch(query, COLLECTION, topK);
  return results as MarketSignalResult[];
}

async function deleteSignals(ids: string[]): Promise<void> {
  await deletePoints(COLLECTION, ids);
}

async function get(id: string): Promise<MarketSignalPoint['payload'] | null> {
  const payload = await getPoint(COLLECTION, id);
  return payload as MarketSignalPoint['payload'] | null;
}

export const marketSignals = { upsert, search: searchSignals, delete: deleteSignals, get };