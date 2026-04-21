/**
 * Collection: onyx_skills
 * Stores reusable skill definitions — tool specs, agent instructions, procedures.
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

const COLLECTION = 'onyx_skills';
const VECTOR_SIZE = 384;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SkillPoint {
  id: string;
  text: string;
  payload: {
    timestamp: number;
    name: string;
    version: string;
    category?: string;
    schema?: unknown;
    [key: string]: unknown;
  };
}

export interface SkillResult extends SearchResult {
  payload: SkillPoint['payload'];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function init(): Promise<void> {
  await createCollectionIfNotExists(COLLECTION, VECTOR_SIZE);
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function upsert(points: SkillPoint[]): Promise<void> {
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

async function searchSkills(query: string, topK = 5): Promise<SkillResult[]> {
  await init();
  const results = await rawSearch(query, COLLECTION, topK);
  return results as SkillResult[];
}

async function deleteSkills(ids: string[]): Promise<void> {
  await deletePoints(COLLECTION, ids);
}

async function get(id: string): Promise<SkillPoint['payload'] | null> {
  const payload = await getPoint(COLLECTION, id);
  return payload as SkillPoint['payload'] | null;
}

export const skills = { upsert, search: searchSkills, delete: deleteSkills, get };