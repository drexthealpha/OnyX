/**
 * Skill metadata store — holds variant info (prompt, score, generation)
 * for smart routing and GEPA evolution.
 * Backed by SQLite for persistence across restarts.
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export interface SkillMeta {
  skillName: string;
  variantId: string;
  prompt: string;
  score: number;
  generation: number;
  createdAt: number;
}

export class SkillMetadataStore {
  private readonly db: Database.Database;

  constructor(dbPath?: string) {
    const resolvedPath =
      dbPath ?? path.resolve(process.cwd(), '.agents', 'hermes-metadata.db');
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
    this.db = new Database(resolvedPath);
    this.initSchema();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS skill_variants (
        skill_name  TEXT NOT NULL,
        variant_id  TEXT NOT NULL,
        prompt      TEXT NOT NULL,
        score       REAL NOT NULL DEFAULT 0.0,
        generation  INTEGER NOT NULL DEFAULT 0,
        created_at  INTEGER NOT NULL,
        PRIMARY KEY (skill_name, variant_id)
      );
      CREATE INDEX IF NOT EXISTS idx_sv_skill ON skill_variants(skill_name);
    `);
  }

  /** Upsert a variant. */
  upsertVariant(meta: SkillMeta): void {
    this.db.prepare(`
      INSERT INTO skill_variants (skill_name, variant_id, prompt, score, generation, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(skill_name, variant_id) DO UPDATE SET
        prompt     = excluded.prompt,
        score      = excluded.score,
        generation = excluded.generation
    `).run(meta.skillName, meta.variantId, meta.prompt, meta.score, meta.generation, meta.createdAt);
  }

  /** Update score for a variant. */
  updateScore(skillName: string, variantId: string, score: number): void {
    this.db.prepare(
      'UPDATE skill_variants SET score = ? WHERE skill_name = ? AND variant_id = ?'
    ).run(score, skillName, variantId);
  }

  /** Get all variants for a skill sorted by score descending. */
  getVariants(skillName: string): SkillMeta[] {
    return this.db.prepare(
      'SELECT * FROM skill_variants WHERE skill_name = ? ORDER BY score DESC'
    ).all(skillName) as SkillMeta[];
  }

  /** Delete a variant. */
  deleteVariant(skillName: string, variantId: string): void {
    this.db.prepare(
      'DELETE FROM skill_variants WHERE skill_name = ? AND variant_id = ?'
    ).run(skillName, variantId);
  }

  /** List all distinct skill names. */
  listAll(): string[] {
    const rows = this.db.prepare(
      'SELECT DISTINCT skill_name FROM skill_variants ORDER BY skill_name'
    ).all() as { skill_name: string }[];
    return rows.map((r) => r.skill_name);
  }

  close(): void {
    this.db.close();
  }
}