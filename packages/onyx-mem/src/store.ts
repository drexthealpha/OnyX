// ─────────────────────────────────────────────
// onyx-mem · store.ts
// In-memory store with JSON file persistence + optional Qdrant REST API
// ─────────────────────────────────────────────

import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import type { MemoryCrystal } from './types.js';
import { QDRANT_BASE_URL, QDRANT_COLLECTION, EMBEDDING_DIM } from './constants.js';

// ── In-memory store with JSON persistence ────────────────────────────────

interface StoreData {
  crystals: Record<string, MemoryCrystal>;
}

const DB_PATH = './data/memories.json';

function loadStore(): StoreData {
  if (!existsSync('./data')) {
    mkdirSync('./data', { recursive: true });
  }
  if (existsSync(DB_PATH)) {
    try {
      const data = readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(data);
    } catch {
      return { crystals: {} };
    }
  }
  return { crystals: {} };
}

function saveStore(data: StoreData): void {
  if (!existsSync('./data')) {
    mkdirSync('./data', { recursive: true });
  }
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function getStore(): StoreData {
  if (!('_storeCache' in getStore)) {
    (getStore as unknown as Record<string, unknown>)._storeCache = loadStore();
  }
  return (getStore as unknown as Record<string, unknown>)._storeCache as StoreData;
}

getStore._storeCache = loadStore();

// ── Zero-vector placeholder ──────────────────────────────────────────────────

function zeroVector(): number[] {
  return new Array(EMBEDDING_DIM).fill(0);
}

// ── Qdrant helpers ───────────────────────────────────────────────────────────

async function qdrantUpsert(crystal: MemoryCrystal): Promise<void> {
  const url = `${QDRANT_BASE_URL}/collections/${QDRANT_COLLECTION}/points`;

  const body = {
    points: [
      {
        id: crystal.id,
        vector: zeroVector(),
        payload: {
          sessionId: crystal.sessionId,
          timestamp: crystal.timestamp,
          mode: crystal.mode,
          decisions: crystal.decisions,
          facts: crystal.facts,
          preferences: crystal.preferences,
          errors: crystal.errors,
          rawTokenCount: crystal.rawTokenCount,
          compressedTokenCount: crystal.compressedTokenCount,
        },
      },
    ],
  };

  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`[onyx-mem:store] Qdrant upsert failed ${res.status}: ${errText}`);
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('Qdrant')) {
      throw err;
    }
  }
}

async function ensureQdrantCollection(): Promise<void> {
  const url = `${QDRANT_BASE_URL}/collections/${QDRANT_COLLECTION}`;

  try {
    const checkRes = await fetch(url);
    if (checkRes.ok) return;
  } catch {
    return;
  }

  const createRes = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vectors: {
        size: EMBEDDING_DIM,
        distance: 'Cosine',
      },
    }),
  });

  if (!createRes.ok && createRes.status !== 409) {
    const errText = await createRes.text();
    throw new Error(
      `[onyx-mem:store] Failed to create Qdrant collection: ${errText}`,
    );
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Persist a MemoryCrystal to store and optionally Qdrant.
 * Qdrant errors are logged but do NOT fail the write.
 */
export async function saveCrystal(crystal: MemoryCrystal): Promise<void> {
  const store = getStore();
  store.crystals[crystal.id] = crystal;
  saveStore(store);

  try {
    await ensureQdrantCollection();
    await qdrantUpsert(crystal);
  } catch (err) {
    console.warn('[onyx-mem:store] Qdrant write failed (store write succeeded):', err);
  }
}

/**
 * Retrieve a single crystal by its UUID.
 * Returns null if not found.
 */
export function getCrystal(id: string): MemoryCrystal | null {
  const store = getStore();
  return store.crystals[id] ?? null;
}

/**
 * List crystals ordered by timestamp descending.
 * @param limit - Max results (default 50)
 */
export function listCrystals(limit = 50): MemoryCrystal[] {
  const store = getStore();
  return Object.values(store.crystals)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}