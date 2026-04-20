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

import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { type OnyxTask, Priority } from "./types.ts";

// ---------------------------------------------------------------------------
// Database path — written alongside the kernel data directory.
// ---------------------------------------------------------------------------
const DB_PATH = "./data/waitlist.db";

// ---------------------------------------------------------------------------
// Serialisable task record (fn stripped — code lives in ROM, not erasable)
// ---------------------------------------------------------------------------
interface WaitRecord {
  id:        string;
  priority:  Priority;
  createdAt: number;
}

// ---------------------------------------------------------------------------
// Open (or create) the database and ensure the schema exists.
// ---------------------------------------------------------------------------
function openDb(): Database {
  mkdirSync("./data", { recursive: true });
  const db = new Database(DB_PATH);
  db.run(`
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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * push — write a task to the persistent waitlist.
 * O(1) disk write. Mirrors AGC WAITLIST insertion into LST2.
 * The task's `fn` is not persisted; callers must re-attach it after pop().
 */
export function push(task: OnyxTask): void {
  const db = openDb();
  const record: WaitRecord = {
    id:        task.id,
    priority:  task.priority,
    createdAt: task.createdAt,
  };
  db.run(
    `INSERT INTO waitlist (id, priority, created_at, payload) VALUES (?, ?, ?, ?)`,
    [task.id, task.priority, task.createdAt, JSON.stringify(record)],
  );
  db.close();
}

/**
 * pop — remove and return the highest-priority (lowest rowid = FIFO) task.
 * Returns undefined when the queue is empty (mirrors AGC ENDTASK sentinel).
 * The returned task has fn set to a no-op placeholder; callers must replace it.
 */
export function pop(): OnyxTask | undefined {
  const db = openDb();
  const row = db
    .query<{ rowid: number; payload: string }, []>(
      `SELECT rowid, payload FROM waitlist ORDER BY priority ASC, created_at ASC, rowid ASC LIMIT 1`,
    )
    .get();

  if (!row) {
    db.close();
    return undefined;
  }

  db.run(`DELETE FROM waitlist WHERE rowid = ?`, [row.rowid]);
  db.close();

  const rec = JSON.parse(row.payload) as WaitRecord;
  return {
    id:        rec.id,
    priority:  rec.priority,
    createdAt: rec.createdAt,
    fn:        async () => {}, // placeholder — caller must replace
  };
}

/**
 * flush — remove all entries from the waitlist.
 * Mirrors AGC STARTSB2 replacing all waitlisted tasks with ENDTASK sentinels.
 */
export function flush(): void {
  const db = openDb();
  db.run(`DELETE FROM waitlist`);
  db.close();
}

/**
 * size — count of tasks currently persisted.
 * Mirrors AGC LST2 occupancy scan.
 */
export function size(): number {
  const db = openDb();
  const row = db
    .query<{ n: number }, []>(`SELECT COUNT(*) AS n FROM waitlist`)
    .get();
  db.close();
  return row?.n ?? 0;
}