// packages/onyx-intel/src/cache.ts
// bun:sqlite-backed TTL cache for IntelBrief results.
// TTL: 3600 seconds (1 hour).

import { Database } from "bun:sqlite";
import type { IntelBrief } from "./types.ts";

const DB_PATH = process.env.INTEL_CACHE_DB ?? "./data/intel-cache.db";
const TTL_MS = 3600 * 1000; // 1 hour

let _db: Database | null = null;

function db(): Database {
  if (_db) return _db;
  // Ensure data directory exists
  const dir = DB_PATH.substring(0, DB_PATH.lastIndexOf("/"));
  if (dir) {
    try {
      const fs = require("fs");
      fs.mkdirSync(dir, { recursive: true });
    } catch {
      // ignore — dir may already exist or we may be in-memory
    }
  }
  _db = new Database(DB_PATH, { create: true });
  _db.run(`
    CREATE TABLE IF NOT EXISTS intel_cache (
      topic      TEXT PRIMARY KEY,
      brief_json TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);
  return _db;
}

/**
 * Retrieve a cached IntelBrief for a topic.
 * Returns null if not found or if TTL has expired.
 */
export function get(topic: string): IntelBrief | null {
  const row = db()
    .query<{ brief_json: string; created_at: number }, [string]>(
      "SELECT brief_json, created_at FROM intel_cache WHERE topic = ?"
    )
    .get(topic);

  if (!row) return null;
  if (isExpired(topic)) {
    db().run("DELETE FROM intel_cache WHERE topic = ?", [topic]);
    return null;
  }

  try {
    return JSON.parse(row.brief_json) as IntelBrief;
  } catch {
    return null;
  }
}

/**
 * Store an IntelBrief in the cache.
 */
export function set(topic: string, brief: IntelBrief): void {
  const now = Date.now();
  db().run(
    `INSERT INTO intel_cache (topic, brief_json, created_at)
     VALUES (?, ?, ?)
     ON CONFLICT(topic) DO UPDATE SET brief_json = excluded.brief_json, created_at = excluded.created_at`,
    [topic, JSON.stringify(brief), now]
  );
}

/**
 * Check whether a cached entry for a topic has expired (age > TTL).
 * Returns true if entry does not exist (treat missing as expired).
 */
export function isExpired(topic: string): boolean {
  const row = db()
    .query<{ created_at: number }, [string]>(
      "SELECT created_at FROM intel_cache WHERE topic = ?"
    )
    .get(topic);

  if (!row) return true;
  return Date.now() - row.created_at > TTL_MS;
}