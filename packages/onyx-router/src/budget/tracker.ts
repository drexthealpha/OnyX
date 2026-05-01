/**
 * @onyx/router — Budget Tracker
 *
 * SQLite-backed spend tracking at ./data/budget.db
 * Records per-user USD spend and provides daily/monthly rollups.
 */

import path from "path";
import fs from "fs";
import Database from "better-sqlite3";

const DB_PATH = process.env.ONYX_BUDGET_DB ?? path.join("data", "budget.db");

let _db: Database | null = null;

function getDb(): Database {
  if (_db) return _db;

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");

  _db.exec(`
    CREATE TABLE IF NOT EXISTS spend_events (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id   TEXT    NOT NULL,
      amount_usd REAL   NOT NULL CHECK(amount_usd >= 0),
      provider  TEXT,
      model     TEXT,
      ts        INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
    );

    CREATE INDEX IF NOT EXISTS idx_spend_user_ts
      ON spend_events(user_id, ts);
  `);

  return _db;
}

export function recordSpend(
  userId: string,
  usdAmount: number,
  provider?: string,
  model?: string,
): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO spend_events (user_id, amount_usd, provider, model)
     VALUES (?, ?, ?, ?)`,
  ).run(userId, usdAmount, provider ?? null, model ?? null);
}

export function getDailySpend(userId: string): number {
  const db = getDb();
  const since = Date.now() - 24 * 60 * 60 * 1000;
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(amount_usd), 0) AS total
       FROM spend_events
       WHERE user_id = ? AND ts >= ?`,
    )
    .get(userId, since) as { total: number };
  return row.total;
}

export function getMonthlySpend(userId: string): number {
  const db = getDb();
  const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(amount_usd), 0) AS total
       FROM spend_events
       WHERE user_id = ? AND ts >= ?`,
    )
    .get(userId, since) as { total: number };
  return row.total;
}

export function getHourlySpend(userId: string, hours = 1): number {
  const db = getDb();
  const since = Date.now() - hours * 60 * 60 * 1000;
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(amount_usd), 0) AS total
       FROM spend_events
       WHERE user_id = ? AND ts >= ?`,
    )
    .get(userId, since) as { total: number };
  return row.total;
}

export function getSpendBreakdown(userId: string): {
  daily: number;
  monthly: number;
  total: number;
} {
  return {
    daily: getDailySpend(userId),
    monthly: getMonthlySpend(userId),
    total: (() => {
      const row = getDb()
        .prepare(`SELECT COALESCE(SUM(amount_usd), 0) AS total FROM spend_events WHERE user_id = ?`)
        .get(userId) as { total: number };
      return row.total;
    })(),
  };
}

export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}