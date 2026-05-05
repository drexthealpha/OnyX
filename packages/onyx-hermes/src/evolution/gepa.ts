/**
 * GEPA — Genetic Evolution of Prompt Architectures.
 *
 * Maintains a SQLite table: skill_name, variant_id, prompt, score, generation.
 * Population size: 5 per skill.
 * Weekly tournament selection:
 *   - Top 2 variants survive
 *   - 3 new variants generated via crossover + mutation from top 2
 *
 * mutate(prompt): slight rephrasing via Claude API (through @onyx/router)
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

const POPULATION_SIZE = 5;
const SURVIVORS = 2;
const NEW_OFFSPRING = POPULATION_SIZE - SURVIVORS;

interface GepaVariant {
  skill_name: string;
  variant_id: string;
  prompt: string;
  score: number;
  generation: number;
}

let _router: { complete: (messages: { role: string; content: string }[]) => Promise<string> } | null = null;

async function callRouterComplete(prompt: string): Promise<string> {
  try {
    if (!_router) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      _router = require('@onyx/router');
    }
    return await _router!.complete([{ role: 'user', content: prompt }]);
  } catch {
    // Fallback: return prompt unchanged if router unavailable
    return prompt;
  }
}

export class GepaEvolution {
  private readonly db: Database.Database;

  constructor(dbPath?: string) {
    const resolvedPath =
      dbPath ?? path.resolve(process.cwd(), '.agents', 'hermes-gepa.db');
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
    this.db = new Database(resolvedPath);
    this.initSchema();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS gepa_variants (
        skill_name  TEXT    NOT NULL,
        variant_id  TEXT    NOT NULL,
        prompt      TEXT    NOT NULL,
        score       REAL    NOT NULL DEFAULT 0.0,
        generation  INTEGER NOT NULL DEFAULT 0,
        created_at  INTEGER NOT NULL,
        PRIMARY KEY (skill_name, variant_id)
      );
      CREATE INDEX IF NOT EXISTS idx_gepa_skill ON gepa_variants(skill_name);
    `);
  }

  /**
   * Initialise population for a skill if it has fewer than POPULATION_SIZE variants.
   * Seeds with the canonical prompt and POPULATION_SIZE-1 mutations.
   */
  async initPopulation(skillName: string, canonicalPrompt: string): Promise<void> {
    const existing = this.getVariants(skillName);
    let currentCount = existing.length;

    // Always insert canonical prompt as variant_id='v0' if not present
    if (!existing.find((v) => v.variant_id === 'v0')) {
      this.upsertVariant({
        skill_name: skillName,
        variant_id: 'v0',
        prompt: canonicalPrompt,
        score: 0,
        generation: 0,
      });
      currentCount++;
    }

    const needed = POPULATION_SIZE - currentCount;
    if (needed <= 0) return;

    // Generate mutations to fill up the population
    for (let i = 0; i < POPULATION_SIZE; i++) {
      const variantId = `v${i}`;
      if (existing.find((v) => v.variant_id === variantId)) {
        continue;
      }
      if (variantId === 'v0') {
        // Already handled above
        continue;
      }

      const mutated = await this.mutate(canonicalPrompt);
      this.upsertVariant({
        skill_name: skillName,
        variant_id: variantId,
        prompt: mutated,
        score: 0,
        generation: 0,
      });
    }
  }

  /**
   * Run one tournament generation for a skill.
   * Top 2 survive; 3 new offspring are generated via crossover + mutation.
   */
  async runTournament(skillName: string): Promise<void> {
    const variants = this.getVariants(skillName);
    if (variants.length < 2) return;

    // Sort by score descending
    const ranked = [...variants].sort((a, b) => b.score - a.score);
    const survivors = ranked.slice(0, SURVIVORS);

    // Delete non-survivors
    const survivorIds = new Set(survivors.map((v) => v.variant_id));
    for (const v of variants) {
      if (!survivorIds.has(v.variant_id)) {
        this.db.prepare(
          'DELETE FROM gepa_variants WHERE skill_name = ? AND variant_id = ?'
        ).run(skillName, v.variant_id);
      }
    }

    const nextGeneration = (ranked[0]?.generation ?? 0) + 1;

    // Generate offspring via crossover + mutation
    for (let i = 0; i < NEW_OFFSPRING; i++) {
      const parent1 = survivors[i % SURVIVORS]!;
      const parent2 = survivors[(i + 1) % SURVIVORS]!;
      const crossed = this.crossover(parent1.prompt, parent2.prompt);
      const mutated = await this.mutate(crossed);

      this.upsertVariant({
        skill_name: skillName,
        variant_id: randomUUID().slice(0, 8),
        prompt: mutated,
        score: 0,
        generation: nextGeneration,
      });
    }
  }

  /**
   * Crossover two prompts: interleave sentences from each parent.
   */
  crossover(prompt1: string, prompt2: string): string {
    const sentences1 = prompt1.split(/[.!?]\s+/).filter(Boolean);
    const sentences2 = prompt2.split(/[.!?]\s+/).filter(Boolean);
    const maxLen = Math.max(sentences1.length, sentences2.length);

    const mixed: string[] = [];
    for (let i = 0; i < maxLen; i++) {
      if (i % 2 === 0 && i < sentences1.length) {
        mixed.push(sentences1[i]!);
      } else if (i < sentences2.length) {
        mixed.push(sentences2[i]!);
      }
    }
    return mixed.join('. ').trim();
  }

  /**
   * Mutate a prompt via slight rephrasing through Claude API.
   */
  async mutate(prompt: string): Promise<string> {
    const mutateInstruction = `Slightly rephrase the following skill prompt to be clearer and more effective. 
Keep the same intent and structure. Change 20–40% of the wording.
Output ONLY the rephrased prompt — no explanation.

--- PROMPT ---
${prompt}`;

    try {
      const result = await callRouterComplete(mutateInstruction);
      const trimmed = result.trim();
      // If result is the same as the instruction (fallback) or too short, return original
      if (trimmed === mutateInstruction || trimmed.includes('--- PROMPT ---') || trimmed.length < 10) {
        return prompt;
      }
      return trimmed;
    } catch {
      return prompt;
    }
  }

  /** Update score for a variant. */
  updateScore(skillName: string, variantId: string, score: number): void {
    this.db.prepare(
      'UPDATE gepa_variants SET score = ? WHERE skill_name = ? AND variant_id = ?'
    ).run(score, skillName, variantId);
  }

  /** Get all variants for a skill. */
  getVariants(skillName: string): GepaVariant[] {
    return this.db.prepare(
      'SELECT * FROM gepa_variants WHERE skill_name = ? ORDER BY score DESC'
    ).all(skillName) as GepaVariant[];
  }

  /** List all skills with populations. */
  listSkills(): string[] {
    const rows = this.db.prepare(
      'SELECT DISTINCT skill_name FROM gepa_variants ORDER BY skill_name'
    ).all() as { skill_name: string }[];
    return rows.map((r) => r.skill_name);
  }

  private upsertVariant(v: Omit<GepaVariant, never>): void {
    this.db.prepare(`
      INSERT INTO gepa_variants (skill_name, variant_id, prompt, score, generation, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(skill_name, variant_id) DO UPDATE SET
        prompt     = excluded.prompt,
        score      = excluded.score,
        generation = excluded.generation
    `).run(v.skill_name, v.variant_id, v.prompt, v.score, v.generation, Date.now());
  }

  close(): void {
    this.db.close();
  }
}