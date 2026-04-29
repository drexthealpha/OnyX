/**
 * kernel/waitlist.ts
 *
 * Persistent task queue — the ONYX Waitlist.
 *
 * Inspired by WAITLIST.agc (Comanche055): the AGC stored up to 9 time-ordered
 * tasks in two lists (LST1 = relative delay offsets, LST2 = 2CADRs) held in
 * switched erasable memory so they survived a WARM or HOT restart.  ONYX
 * replaces the fixed-size hardware lists with a SQLite table so tasks survive
 * full process restarts (COLD restarts).
 *
 * The AGC Waitlist was serviced by T3RUPT every 10 ms; ONYX's flush() is the
 * analogue — called on a QUEUE_FLUSH_INTERVAL_MS timer by boot.ts.
 *
 * Schema:
 *   waitlist(rowid INTEGER PRIMARY KEY AUTOINCREMENT,
 *            id TEXT NOT NULL,
 *            priority INTEGER NOT NULL,
 *            created_at INTEGER NOT NULL,
 *            payload TEXT NOT NULL)    -- JSON-serialised OnyxTask sans fn
 *
 * NOTE: The `fn` field of OnyxTask cannot be serialised.  We store the task
 * metadata for restart-table rehydration; the fn must be re-attached by the
 * caller after a pop() via its id.  This matches the AGC pattern where the
 * 2CADR (address) was persisted but the actual code was in fixed ROM.
 */

import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { type OnyxTask, Priority } from "./types.ts";

const DB_PATH = "./data/waitlist.db";

interface WaitRecord {
  id:        string;
  priority:  Priority;
  createdAt: number;
}

function openDb(): Database {
  mkdirSync("./data", { recursive: true });
  const db = new Database(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS waitlist (
      rowid      INTEGER PRIMARY KEY AUTOINCREMENT,
      id         TEXT    NOT NULL,
      priority   INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      payload    TEXT    NOT NULL
    )
  `);
  return db;
}

export function push(task: OnyxTask): void {
  const db = openDb();
  const record: WaitRecord = {
    id:        task.id,
    priority:  task.priority,
    createdAt: task.createdAt,
  };
  const stmt = db.prepare(
    `INSERT INTO waitlist (id, priority, created_at, payload) VALUES (?, ?, ?, ?)`
  );
  stmt.run(task.id, task.priority, task.createdAt, JSON.stringify(record));
  db.close();
}

export function pop(): OnyxTask | undefined {
  const db = openDb();
  const stmt = db.prepare(
    `SELECT rowid, payload FROM waitlist ORDER BY priority ASC, created_at ASC, rowid ASC LIMIT 1`
  );
  const row = stmt.get() as { rowid: number; payload: string } | undefined;

  if (!row) {
    db.close();
    return undefined;
  }

  db.prepare(`DELETE FROM waitlist WHERE rowid = ?`).run(row.rowid);
  db.close();

  const rec = JSON.parse(row.payload) as WaitRecord;
  return {
    id:        rec.id,
    priority:  rec.priority,
    createdAt: rec.createdAt,
    fn:        async () => {},
  };
}

export function flush(): void {
  const db = openDb();
  db.prepare(`DELETE FROM waitlist`).run();
  db.close();
}

export function size(): number {
  const db = openDb();
  const stmt = db.prepare(`SELECT COUNT(*) AS n FROM waitlist`);
  const row = stmt.get() as { n: number } | undefined;
  db.close();
  return row?.n ?? 0;
}