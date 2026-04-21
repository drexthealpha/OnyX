import { Database } from 'bun:sqlite';
import { mkdirSync } from 'node:fs';
import type { LearnerProfile, DomainRecord } from '../types.ts';
import { DomainLevel } from '../types.ts';

const DB_PATH = './data/learner-profiles.db';

// Ensure data directory exists
mkdirSync('./data', { recursive: true });

export class ProfileStore {
  private db: Database;

  constructor(dbPath: string = DB_PATH) {
    this.db = new Database(dbPath);
    this.init();
  }

  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS profiles (
        user_id     TEXT PRIMARY KEY,
        domains     TEXT NOT NULL DEFAULT '{}',
        style      TEXT NOT NULL DEFAULT 'verbal',
        goals      TEXT NOT NULL DEFAULT '[]',
        preferences TEXT NOT NULL DEFAULT '{}'
      );
    `);
  }

  // ── Read ─────────────────────────────────────────────────────────────────

  getProfile(userId: string): LearnerProfile {
    const row = this.db
      .query('SELECT * FROM profiles WHERE user_id = ?')
      .get(userId) as Record<string, string> | null;

    if (!row) {
      return {
        userId,
        domains: {},
        style: 'verbal',
        goals: [],
        preferences: {},
      };
    }

    return {
      userId: row.user_id,
      domains: JSON.parse(row.domains),
      style: row.style as LearnerProfile['style'],
      goals: JSON.parse(row.goals),
      preferences: JSON.parse(row.preferences),
    };
  }

  // ── Write ─────────────────────────────────────────────────────────────────

  private upsert(profile: LearnerProfile): void {
    this.db.run(
      `INSERT INTO profiles (user_id, domains, style, goals, preferences)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         domains     = excluded.domains,
         style       = excluded.style,
         goals       = excluded.goals,
         preferences = excluded.preferences`,
      [
        profile.userId,
        JSON.stringify(profile.domains),
        profile.style,
        JSON.stringify(profile.goals),
        JSON.stringify(profile.preferences),
      ],
    );
  }

  updateFromQuiz(userId: string, domain: string, score: number): void {
    const profile = this.getProfile(userId);
    const existing: DomainRecord = profile.domains[domain] ?? {
      level: DomainLevel.BEGINNER,
      confidence: 0.5,
      lastUpdated: Date.now(),
    };

    let nextLevel = existing.level;

    if (score < 0.5) {
      nextLevel = Math.max(DomainLevel.BEGINNER, existing.level - 1) as DomainLevel;
    } else if (score > 0.8) {
      nextLevel = Math.min(DomainLevel.EXPERT, existing.level + 1) as DomainLevel;
    }

    profile.domains[domain] = {
      level: nextLevel,
      confidence: score,
      lastUpdated: Date.now(),
    };

    this.upsert(profile);
  }

  setGoal(userId: string, goal: string): void {
    const profile = this.getProfile(userId);
    if (!profile.goals.includes(goal)) {
      profile.goals.push(goal);
    }
    this.upsert(profile);
  }

  setStyle(userId: string, style: LearnerProfile['style']): void {
    const profile = this.getProfile(userId);
    profile.style = style;
    this.upsert(profile);
  }

  setPreference(userId: string, key: string, value: string): void {
    const profile = this.getProfile(userId);
    profile.preferences[key] = value;
    this.upsert(profile);
  }

  close(): void {
    this.db.close();
  }
}