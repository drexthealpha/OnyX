/**
 * @onyx/router — Budget Tracker
 *
 * SQLite-backed spend tracking at ./data/budget.db
 * Records per-user USD spend and provides daily/monthly rollups.
 */

import path from "path";
import fs from "fs";
import Database from "better-sqlite3";
import type { Database as DatabaseType } from "better-sqlite3";

const DB_PATH = process.env.ONYX_BUDGET_DB ?? path.join("data", "budget.db");

let _db: DatabaseType | null = null;

function getDb(): DatabaseType {
  if (_db) return _db;

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(DB_PATH) as any;
  db.pragma("journal_mode = WAL");

  db.exec(`
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

  _db = db as any;
  return _db as any;
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
      `SELECT COALESCE(SUM(amount_usd), 0) AS total FROM spend_events WHERE user_id = ? AND ts >= ?`,
    )
    .get(userId, since) as { total: number };
  return row.total;
}

export function getMonthlySpend(userId: string): number {
  const db = getDb();
  const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(amount_usd), 0) AS total FROM spend_events WHERE user_id = ? AND ts >= ?`,
    )
    .get(userId, since) as { total: number };
  return row.total;
}

export function getHourlySpend(userId: string, hours = 1): number {
  const db = getDb();
  const since = Date.now() - hours * 60 * 60 * 1000;
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(amount_usd), 0) AS total FROM spend_events WHERE user_id = ? AND ts >= ?`,
    )
    .get(userId, since) as { total: number };
  return row.total;
}

/** Added for nerve cockpit integration */
export function getSpent(userId: string): number {
  const db = getDb();
  const row = db
    .prepare(`SELECT COALESCE(SUM(amount_usd), 0) AS total FROM spend_events WHERE user_id = ?`)
    .get(userId) as { total: number };
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
    total: getSpent(userId),
  };
}

export function getSummary(): unknown {
  const db = getDb();
  return {
    totalUSD: (db.prepare(`SELECT SUM(amount_usd) FROM spend_events`).get() as any)[
      "SUM(amount_usd)"
    ],
    userCount: (db.prepare(`SELECT COUNT(DISTINCT user_id) FROM spend_events`).get() as any)[
      "COUNT(DISTINCT user_id)"
    ],
    topUsers: db
      .prepare(
        `SELECT user_id, SUM(amount_usd) as total FROM spend_events GROUP BY user_id ORDER BY total DESC LIMIT 5`,
      )
      .all(),
  };
}

export function closeDb(): void {
  if (_db) {
    (_db as any).close();
    _db = null;
  }
}