// packages/onyx-intel/src/cache.ts
// better-sqlite3-backed TTL cache for IntelBrief results.
// TTL: 3600 seconds (1 hour).

import Database from "better-sqlite3";
import type { Database as DatabaseType } from "better-sqlite3";
import type { IntelBrief } from "./types.js";
import { mkdirSync, existsSync } from "fs";
import { dirname } from "path";

const DB_PATH = process.env.INTEL_CACHE_DB ?? "./data/intel-cache.db";
const TTL_MS = 3600 * 1000;

let _db: DatabaseType | null = null;

function db(): DatabaseType {
  if (_db) return _db;
  
  const dir = dirname(DB_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  
  _db = new Database(DB_PATH);
  _db.exec(`
    CREATE TABLE IF NOT EXISTS intel_cache (
      topic      TEXT PRIMARY KEY,
      brief_json TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);
  return _db;
}

export function get(topic: string): IntelBrief | null {
  const row = db()
    .prepare("SELECT brief_json, created_at FROM intel_cache WHERE topic = ?")
    .get(topic) as { brief_json: string; created_at: number } | undefined;

  if (!row) return null;
  if (isExpired(topic)) {
    db().prepare("DELETE FROM intel_cache WHERE topic = ?").run(topic);
    return null;
  }

  try {
    return JSON.parse(row.brief_json) as IntelBrief;
  } catch {
    return null;
  }
}

export function set(topic: string, brief: IntelBrief): void {
  const now = Date.now();
  db()
    .prepare(
      `INSERT INTO intel_cache (topic, brief_json, created_at)
       VALUES (?, ?, ?)
       ON CONFLICT(topic) DO UPDATE SET brief_json = excluded.brief_json, created_at = excluded.created_at`
    )
    .run(topic, JSON.stringify(brief), now);
}

export function isExpired(topic: string): boolean {
  const row = db()
    .prepare("SELECT created_at FROM intel_cache WHERE topic = ?")
    .get(topic) as { created_at: number } | undefined;

  if (!row) return true;
  return Date.now() - row.created_at > TTL_MS;
}

export function listCachedTopics(): string[] {
  const rows = db().prepare("SELECT topic FROM intel_cache").all() as { topic: string }[];
  return rows.map((r) => r.topic);
}

export function evictCache(topic: string): void {
  db().prepare("DELETE FROM intel_cache WHERE topic = ?").run(topic);
}
