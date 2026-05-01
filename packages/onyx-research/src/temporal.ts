// ─── Temporal scheduler — better-sqlite3 backed, polls every 5 minutes ───────────

// Uses better-sqlite3 (Node.js SQLite binding).

import Database, { type Database as DatabaseInstance } from "better-sqlite3";
import { randomUUID } from "crypto";
import { join } from "path";
import { mkdirSync, existsSync } from "fs";
import type { ScheduledJob } from "./types";
import { runResearch } from "./graph";

const DB_PATH = process.env["RESEARCH_DB_PATH"] ?? join(dirname(fileURLToPath(import.meta.url)), "..", "data", "scheduled-research.db");

function openDB(): DatabaseInstance {
  const dir = join(DB_PATH, "..");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const db = new Database(DB_PATH);
  db.exec("PRAGMA journal_mode=WAL;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS scheduled_jobs (
      id TEXT PRIMARY KEY,
      topic TEXT NOT NULL,
      deliver_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      result TEXT,
      error TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_status_deliver
      ON scheduled_jobs(status, deliver_at);
  `);
  return db;
}

export async function scheduleResearch(topic: string, deliverAt: Date): Promise<string> {
  const db = openDB();
  const id = randomUUID();
  const now = new Date().toISOString();

  const insert = db.prepare(
    `INSERT INTO scheduled_jobs (id, topic, deliver_at, status, created_at)
     VALUES ($id, $topic, $deliverAt, 'pending', $now)`,
  );
  insert.run({ $id: id, $topic: topic, $deliverAt: deliverAt.toISOString(), $now: now });
  db.close();

  return id;
}

export function getScheduledJob(id: string): ScheduledJob | null {
  const db = openDB();
  const row = db
    .prepare(`SELECT * FROM scheduled_jobs WHERE id = $id`)
    .get({ $id: id }) as RawRow | undefined;
  db.close();
  return row ? rowToJob(row) : null;
}

export function listScheduledJobs(status?: ScheduledJob["status"]): ScheduledJob[] {
  const db = openDB();
  const rows = status
    ? (db.prepare(`SELECT * FROM scheduled_jobs WHERE status = $status`).all({ $status: status }) as RawRow[])
    : (db.prepare(`SELECT * FROM scheduled_jobs`).all() as RawRow[]);
  db.close();
  return rows.map(rowToJob);
}

export async function runScheduledJobs(): Promise<void> {
  const db = openDB();
  const now = new Date().toISOString();

  const due = db
    .prepare(
      `SELECT * FROM scheduled_jobs
       WHERE status = 'pending' AND deliver_at <= $now`,
    )
    .all({ $now: now }) as RawRow[];

  db.close();

  for (const row of due) {
    const job = rowToJob(row);
    await runJob(job);
  }
}

export function startSchedulerWorker(): ReturnType<typeof setInterval> {
  const INTERVAL_MS = 5 * 60 * 1000;
  console.log("[onyx-research] Temporal scheduler worker started (5-min polling)");

  runScheduledJobs().catch(console.error);
  return setInterval(() => runScheduledJobs().catch(console.error), INTERVAL_MS);
}

async function runJob(job: ScheduledJob): Promise<void> {
  const db = openDB();

  db.prepare(`UPDATE scheduled_jobs SET status = 'running' WHERE id = $id`).run({ $id: job.id });
  db.close();

  try {
    const result = await runResearch(job.topic);
    const resultJson = JSON.stringify(result);

    const db2 = openDB();
    db2
      .prepare(
        `UPDATE scheduled_jobs SET status = 'complete', result = $result WHERE id = $id`,
      )
      .run({ $id: job.id, $result: resultJson });
    db2.close();

    console.log(`[onyx-research] Scheduled job ${job.id} complete for topic: "${job.topic}"`);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const db3 = openDB();
    db3
      .prepare(
        `UPDATE scheduled_jobs SET status = 'failed', error = $error WHERE id = $id`,
      )
      .run({ $id: job.id, $error: errorMsg });
    db3.close();

    console.error(`[onyx-research] Scheduled job ${job.id} failed:`, errorMsg);
  }
}

interface RawRow {
  id: string;
  topic: string;
  deliver_at: string;
  status: string;
  created_at: string;
  result?: string;
  error?: string;
}

function rowToJob(row: RawRow): ScheduledJob {
  return {
    id: row.id,
    topic: row.topic,
    deliverAt: row.deliver_at,
    status: row.status as ScheduledJob["status"],
    createdAt: row.created_at,
    result: row.result,
    error: row.error,
  };
}