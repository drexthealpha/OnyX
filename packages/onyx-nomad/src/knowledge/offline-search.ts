// packages/onyx-nomad/src/knowledge/offline-search.ts
import Database from 'better-sqlite3';
import path from 'node:path';
import type { IntelBrief } from '../types';

const DB_PATH = path.resolve('./data/offline-knowledge.db');

/**
 * searchKnowledge — BM25 full-text search over preloaded IntelBriefs.
 *
 * Uses the FTS5 virtual table (knowledge_fts) created by preload.ts.
 * Results are ranked by SQLite's built-in BM25 rank function.
 *
 * Returns up to 10 matching IntelBrief objects.
 */
export function searchKnowledge(query: string): IntelBrief[] {
  let db: Database;
  try {
    db = new Database(DB_PATH, { readonly: true });
  } catch {
    // DB doesn't exist yet — nothing preloaded
    return [];
  }

  try {
    const rows = db
      .query<
        { topic: string; brief_json: string; rank: number },
        [string]
      >(
        `
        SELECT k.topic, k.brief_json, kf.rank
        FROM knowledge_fts kf
        JOIN knowledge k ON k.rowid = kf.rowid
        WHERE knowledge_fts MATCH ?
        ORDER BY kf.rank
        LIMIT 10
      `
      )
      .all(query);

    return rows.flatMap((row) => {
      try {
        return [JSON.parse(row.brief_json) as IntelBrief];
      } catch {
        return [];
      }
    });
  } catch {
    return [];
  } finally {
    db.close();
  }
}