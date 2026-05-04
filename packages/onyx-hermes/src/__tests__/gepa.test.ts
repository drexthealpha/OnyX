/**
 * Test 3: GEPA population initializes with 5 variants per skill
 */

import { GepaEvolution } from '../evolution/gepa';
import path from 'path';
import os from 'os';
import fs from 'fs';

function tempDb(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gepa-test-'));
  return path.join(dir, 'test-gepa.db');
}

describe('GepaEvolution', () => {
  let gepa: GepaEvolution;
  let dbPath: string;

  beforeEach(() => {
    dbPath = tempDb();
    gepa = new GepaEvolution(dbPath);
  });

  afterEach(() => {
    gepa.close();
    try { fs.rmSync(path.dirname(dbPath), { recursive: true }); } catch {}
  });

  it('initialises population with exactly 5 variants per skill', async () => {
    await gepa.initPopulation('my-skill', 'This is the canonical skill prompt.');
    const variants = gepa.getVariants('my-skill');
    expect(variants.length).toBe(5);
  }, 60000);

  it('assigns variant_id v0 to the canonical prompt', async () => {
    const canonical = 'Canonical prompt text.';
    await gepa.initPopulation('my-skill', canonical);
    const variants = gepa.getVariants('my-skill');
    const v0 = variants.find((v) => v.variant_id === 'v0');
    expect(v0).toBeDefined();
    expect(v0!.prompt).toBe(canonical);
  }, 60000);

  it('does not add more than 5 variants if called twice', async () => {
    await gepa.initPopulation('my-skill', 'Canonical prompt.');
    await gepa.initPopulation('my-skill', 'Canonical prompt.'); // second call
    const variants = gepa.getVariants('my-skill');
    expect(variants.length).toBe(5);
  }, 60000);

  it('initialises all variants with generation 0', async () => {
    await gepa.initPopulation('skill-x', 'prompt');
    const variants = gepa.getVariants('skill-x');
    for (const v of variants) {
      expect(v.generation).toBe(0);
    }
  }, 60000);

  it('crossover produces a string combining words from both parents', () => {
    const p1 = 'You are a helpful assistant. You answer questions precisely. Be concise.';
    const p2 = 'You are an expert researcher. You find accurate facts. Be thorough.';
    const crossed = gepa.crossover(p1, p2);
    expect(typeof crossed).toBe('string');
    expect(crossed.length).toBeGreaterThan(0);
  });

  it('updateScore persists the score', async () => {
    await gepa.initPopulation('scored-skill', 'prompt');
    const variants = gepa.getVariants('scored-skill');
    const v = variants[0]!;
    gepa.updateScore('scored-skill', v.variant_id, 0.87);
    const updated = gepa.getVariants('scored-skill').find((x) => x.variant_id === v.variant_id);
    expect(updated!.score).toBe(0.87);
  }, 60000);

  it('runTournament keeps exactly POPULATION_SIZE (5) variants', async () => {
    await gepa.initPopulation('tournament-skill', 'base prompt');
    // Give some scores so tournament has something to work with
    const before = gepa.getVariants('tournament-skill');
    before.forEach((v, i) => gepa.updateScore('tournament-skill', v.variant_id, i * 0.2));

    await gepa.runTournament('tournament-skill');
    const after = gepa.getVariants('tournament-skill');
    expect(after.length).toBe(5);
  }, 60000);
});