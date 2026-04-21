// ─────────────────────────────────────────────
// Test 3: inject.ts — context string format
// ─────────────────────────────────────────────

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { saveCrystal, listCrystals } from '../store.js';
import type { MemoryCrystal } from '../types.js';

// ── Seed some crystals before testing inject ─────────────────────────────────

const SEED_CRYSTAL: MemoryCrystal = {
  id: crypto.randomUUID(),
  sessionId: 'past-session-001',
  timestamp: Date.now() - 86_400_000,
  mode: 'code--ts',
  decisions: ['Use onyx-gateway for all API routing'],
  facts: ['Hermes uses herald pub/sub for inter-package comms'],
  preferences: ['User prefers Bun over Node for all ONYX packages'],
  errors: ['Herald subscription failed when gateway starts after mem'],
  rawTokenCount: 1200,
  compressedTokenCount: 87,
};

describe('inject — context string format', () => {
  beforeAll(async () => {
    await saveCrystal(SEED_CRYSTAL);
  });

  it('returns string starting with "From previous sessions" when memories exist', async () => {
    const { inject } = await import('../inject.js');
    const result = await inject('onyx-gateway herald pub-sub routing');
    expect(result).toBeTypeOf('string');
    expect(result.startsWith('From previous sessions')).toBe(true);
  });

  it('returns a non-empty context that includes seeded data', async () => {
    const { inject } = await import('../inject.js');
    const result = await inject('gateway routing hermes');
    const containsKnownFact =
      result.includes('gateway') ||
      result.includes('hermes') ||
      result.includes('herald') ||
      result.includes('Bun');
    expect(containsKnownFact).toBe(true);
  });

  it('returns "From previous sessions" prefix even when no matches', async () => {
    const { inject } = await import('../inject.js');
    const result = await inject('xyzzyfoobarbaz');
    expect(result.startsWith('From previous sessions')).toBe(true);
  });
});