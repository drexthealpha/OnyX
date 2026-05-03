import DatabaseConstructor from 'better-sqlite3';
import type { Database } from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import type { ProgressRecord } from '../types.js';
import { DomainLevel } from '../types.js';

const DB_PATH = './data/learner-profiles.db';
mkdirSync('./data', { recursive: true });

export class ProgressTracker {
  private db: Database;

  constructor(dbPath: string = DB_PATH) {
    this.db = new DatabaseConstructor(dbPath);
    this.init();
  }

  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS progress (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id       TEXT    NOT NULL,
        domain        TEXT    NOT NULL,
        session_date  INTEGER NOT NULL,
        topics        TEXT    NOT NULL DEFAULT '[]',
        quiz_score    REAL    NOT NULL DEFAULT 0,
        level_at_time INTEGER NOT NULL DEFAULT 1
      );
      CREATE INDEX IF NOT EXISTS idx_progress_user ON progress(user_id);
    `);
  }

  recordSession(record: Omit<ProgressRecord, 'sessionDate'>): void {
    this.db.prepare(
      `INSERT INTO progress (user_id, domain, session_date, topics, quiz_score, level_at_time)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      [
        record.userId,
        record.domain,
        Date.now(),
        JSON.stringify(record.topicsCovered),
        record.quizScore,
        record.levelAtTime,
      ],
    );
  }

  getHistory(userId: string, limit = 20): ProgressRecord[] {
    const rows = this.db
      .prepare(
        `SELECT * FROM progress WHERE user_id = ?
         ORDER BY session_date DESC LIMIT ?`,
      )
      .all(userId, limit) as Array<Record<string, unknown>>;

    return rows.map((r) => ({
      userId: r['user_id'] as string,
      domain: r['domain'] as string,
      sessionDate: r['session_date'] as number,
      topicsCovered: JSON.parse(r['topics'] as string) as string[],
      quizScore: r['quiz_score'] as number,
      levelAtTime: r['level_at_time'] as DomainLevel,
    }));
  }

  getStats(userId: string): {
    totalSessions: number;
    averageScore: number;
    domainsStudied: string[];
  } {
    const row = this.db
      .prepare(
        `SELECT
           COUNT(*) as total,
           AVG(quiz_score) as avg_score
         FROM progress WHERE user_id = ?`,
      )
      .get(userId) as { total: number; avg_score: number | null } | null;

    const domainRows = this.db
      .prepare(`SELECT DISTINCT domain FROM progress WHERE user_id = ?`)
      .all(userId) as Array<{ domain: string }>;

    return {
      totalSessions: row?.total ?? 0,
      averageScore: row?.avg_score ?? 0,
      domainsStudied: domainRows.map((r) => r.domain),
    };
  }

  close(): void {
    this.db.close();
  }
}
