// packages/onyx-nomad/src/knowledge/preload.ts
import Database from 'better-sqlite3';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import type { IntelBrief } from '../types';

const DB_PATH = path.resolve('./data/offline-knowledge.db');

let _db: Database | null = null;

function getDb(): Database {
  if (_db) return _db;

  mkdirSync(path.dirname(DB_PATH), { recursive: true });
  _db = new Database(DB_PATH);
  _db.run('PRAGMA journal_mode=WAL;');

  // Structured table for IntelBrief blobs
  _db.run(`
    CREATE TABLE IF NOT EXISTS knowledge (
      topic     TEXT PRIMARY KEY,
      brief_json TEXT NOT NULL,
      fetched_at INTEGER NOT NULL
    );
  `);

  // FTS5 index over summaries for BM25 search (see offline-search.ts)
  _db.run(`
    CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_fts USING fts5(
      topic,
      summary,
      content = 'knowledge',
      tokenize = 'porter unicode61'
    );
  `);

  // Keep FTS in sync with the main table via triggers
  _db.run(`
    CREATE TRIGGER IF NOT EXISTS knowledge_ai AFTER INSERT ON knowledge BEGIN
      INSERT INTO knowledge_fts (rowid, topic, summary)
      VALUES (new.rowid, new.topic, json_extract(new.brief_json, '$.summary'));
    END;
  `);
  _db.run(`
    CREATE TRIGGER IF NOT EXISTS knowledge_ad AFTER DELETE ON knowledge BEGIN
      INSERT INTO knowledge_fts (knowledge_fts, rowid, topic, summary)
      VALUES ('delete', old.rowid, old.topic, json_extract(old.brief_json, '$.summary'));
    END;
  `);

  return _db;
}

/**
 * preload — fetches IntelBrief for each topic via @onyx/intel
 * and stores the result locally in SQLite for offline access.
 *
 * Topics already stored (and < 24h old) are skipped to avoid
 * redundant API calls.
 */
export async function preload(topics: string[]): Promise<void> {
  const { runIntel } = await import('@onyx/intel');
  const db = getDb();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const now = Date.now();

  for (const topic of topics) {
    // Check freshness
    const existing = db
      .query<{ fetched_at: number }, [string]>(
        'SELECT fetched_at FROM knowledge WHERE topic = ?'
      )
      .get(topic);

    if (existing && now - existing.fetched_at < ONE_DAY_MS) {
      continue; // Still fresh — skip
    }

    try {
      const brief = await runIntel(topic);

      db.run(
        `INSERT INTO knowledge (topic, brief_json, fetched_at)
         VALUES (?, ?, ?)
         ON CONFLICT(topic) DO UPDATE SET
           brief_json = excluded.brief_json,
           fetched_at = excluded.fetched_at`,
        [topic, JSON.stringify(brief), now]
      );
    } catch (err) {
      console.warn(`[nomad:preload] Failed to fetch intel for "${topic}":`, err);
    }
  }
}

/**
 * getOfflineKnowledge — retrieves a stored IntelBrief by topic.
 * Returns null if the topic has not been preloaded.
 */
export function getOfflineKnowledge(topic: string): IntelBrief | null {
  const db = getDb();
  const row = db
    .query<{ brief_json: string }, [string]>(
      'SELECT brief_json FROM knowledge WHERE topic = ?'
    )
    .get(topic);

  if (!row) return null;

  try {
    return JSON.parse(row.brief_json) as IntelBrief;
  } catch {
    return null;
  }
}

/** Close the knowledge DB (useful in tests). */
export function closeKnowledgeDb(): void {
  _db?.close();
  _db = null;
}