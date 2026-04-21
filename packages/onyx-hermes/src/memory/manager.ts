/**
 * Skill performance memory manager.
 * Stores execution scores keyed by skill name in SQLite.
 * Provides rolling average scores used by SkillImprover.
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export interface SkillScore {
  skillName: string;
  score: number;
  timestamp: number;
}

export interface SkillPerformance {
  skillName: string;
  avgScore: number;
  sampleCount: number;
  lastScore: number;
  lastUpdated: number;
}

export class SkillMemoryManager {
  private readonly db: Database.Database;

  constructor(dbPath?: string) {
    const resolvedPath = dbPath ?? path.resolve(process.cwd(), '.agents', 'hermes-memory.db');
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
    this.db = new Database(resolvedPath);
    this.initSchema();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS skill_scores (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        skill_name TEXT NOT NULL,
        score      REAL NOT NULL CHECK(score >= 0.0 AND score <= 1.0),
        timestamp  INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_skill_scores_name ON skill_scores(skill_name);
      CREATE INDEX IF NOT EXISTS idx_skill_scores_ts ON skill_scores(timestamp);
    `);
  }

  /** Record a new score for a skill (0.0–1.0). */
  record(skillName: string, score: number): void {
    const clampedScore = Math.max(0, Math.min(1, score));
    this.db.prepare(
      'INSERT INTO skill_scores (skill_name, score, timestamp) VALUES (?, ?, ?)'
    ).run(skillName, clampedScore, Date.now());
  }

  /** Get rolling performance for a skill (last N samples). */
  getPerformance(skillName: string, lastN = 20): SkillPerformance | null {
    const rows = this.db.prepare(
      'SELECT score, timestamp FROM skill_scores WHERE skill_name = ? ORDER BY timestamp DESC LIMIT ?'
    ).all(skillName, lastN) as { score: number; timestamp: number }[];

    if (rows.length === 0) return null;

    const avgScore = rows.reduce((sum, r) => sum + r.score, 0) / rows.length;
    return {
      skillName,
      avgScore,
      sampleCount: rows.length,
      lastScore: rows[0]!.score,
      lastUpdated: rows[0]!.timestamp,
    };
  }

  /** List all skills with recorded performance. */
  listSkills(): string[] {
    const rows = this.db.prepare(
      'SELECT DISTINCT skill_name FROM skill_scores ORDER BY skill_name'
    ).all() as { skill_name: string }[];
    return rows.map((r) => r.skill_name);
  }

  /** Delete all scores older than maxAgeMs. */
  purgeOld(maxAgeMs = 30 * 24 * 60 * 60 * 1000): number {
    const cutoff = Date.now() - maxAgeMs;
    const result = this.db.prepare('DELETE FROM skill_scores WHERE timestamp < ?').run(cutoff);
    return result.changes;
  }

  close(): void {
    this.db.close();
  }
}