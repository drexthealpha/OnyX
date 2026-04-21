/**
 * Benchmark runner — evaluates skill quality against a fixed test suite.
 * Stores results to SQLite for GEPA tournament scoring.
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export interface BenchmarkCase {
  input: string;
  expectedKeywords: string[];
}

export interface BenchmarkResult {
  skillName: string;
  variantId: string;
  score: number;
  passCount: number;
  totalCount: number;
  runAt: number;
}

export class BenchmarkRunner {
  private readonly db: Database.Database;

  constructor(dbPath?: string) {
    const resolvedPath =
      dbPath ?? path.resolve(process.cwd(), '.agents', 'hermes-benchmarks.db');
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
    this.db = new Database(resolvedPath);
    this.initSchema();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS benchmark_results (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        skill_name TEXT    NOT NULL,
        variant_id TEXT    NOT NULL,
        score      REAL    NOT NULL,
        pass_count INTEGER NOT NULL,
        total      INTEGER NOT NULL,
        run_at     INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_br_skill ON benchmark_results(skill_name);
    `);
  }

  /**
   * Run benchmark cases against a skill output function.
   * The executor fn takes (input) and returns output string.
   */
  async run(
    skillName: string,
    variantId: string,
    cases: BenchmarkCase[],
    executor: (input: string) => Promise<string>
  ): Promise<BenchmarkResult> {
    let passCount = 0;

    for (const testCase of cases) {
      try {
        const output = await executor(testCase.input);
        const lower = output.toLowerCase();
        const passed = testCase.expectedKeywords.every((kw) => lower.includes(kw.toLowerCase()));
        if (passed) passCount++;
      } catch {
        // Count as failure
      }
    }

    const score = cases.length > 0 ? passCount / cases.length : 0;

    const result: BenchmarkResult = {
      skillName,
      variantId,
      score,
      passCount,
      totalCount: cases.length,
      runAt: Date.now(),
    };

    this.db.prepare(
      'INSERT INTO benchmark_results (skill_name, variant_id, score, pass_count, total, run_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(skillName, variantId, score, passCount, cases.length, result.runAt);

    return result;
  }

  /** Get latest benchmark result for a skill+variant. */
  getLatest(skillName: string, variantId: string): BenchmarkResult | null {
    const row = this.db.prepare(
      'SELECT * FROM benchmark_results WHERE skill_name = ? AND variant_id = ? ORDER BY run_at DESC LIMIT 1'
    ).get(skillName, variantId) as BenchmarkResult | undefined;
    return row ?? null;
  }

  close(): void {
    this.db.close();
  }
}