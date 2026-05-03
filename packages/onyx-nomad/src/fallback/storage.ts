// packages/onyx-nomad/src/fallback/storage.ts
import Database from 'better-sqlite3';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import type { SearchResult } from '../types';

const DB_PATH = path.resolve('./data/offline-storage.db');

/**
 * Lazily-initialized SQLite database for offline vector-search replacement.
 * Uses FTS5 virtual table for BM25-ranked full-text search.
 *
 * Performance note: not as accurate as Qdrant vector search,
 * but works completely offline with zero external dependencies.
 */
let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;

  mkdirSync(path.dirname(DB_PATH), { recursive: true });
  _db = new Database(DB_PATH);

  // Enable WAL for concurrent reads
  _db.exec('PRAGMA journal_mode=WAL;');

  // FTS5 virtual table — content is the searchable field
  _db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS fts_docs USING fts5(
      id UNINDEXED,
      collection UNINDEXED,
      content,
      tokenize = 'porter unicode61'
    );
  `);

  return _db;
}

/**
 * Upsert a document into the offline FTS index.
 */
export function indexDocument(
  id: string,
  collection: string,
  content: string
): void {
  const db = getDb();
  // Delete existing entry then re-insert (FTS5 does not support UPDATE)
  db.prepare(`DELETE FROM fts_docs WHERE id = ?`).run(id);
  db.prepare(
    `INSERT INTO fts_docs (id, collection, content) VALUES (?, ?, ?)`
  ).run(id, collection, content);
}

/**
 * searchOffline — BM25 full-text search over the offline FTS index.
 *
 * Replaces Qdrant vector search when the device is offline.
 * Returns up to 10 results ranked by BM25 relevance (rank column).
 */
export function searchOffline(
  query: string,
  collection: string
): SearchResult[] {
  const db = getDb();

  try {
    const rows = db
      .prepare(
        `
        SELECT id, collection, content, rank
        FROM fts_docs
        WHERE fts_docs MATCH ?
          AND collection = ?
        ORDER BY rank
        LIMIT 10
      `
      )
      .all(query, collection) as any[];

    return rows.map((row: any) => ({
      id: row.id,
      collection: row.collection,
      content: row.content,
      // FTS5 rank is negative (lower = better). Normalise to 0–1 score.
      score: Math.max(0, 1 + (row.rank || 0) / 10),
    }));
  } catch {
    return [];
  }
}

/** Close the database connection (useful in tests). */
export function closeStorageDb(): void {
  _db?.close();
  _db = null;
}