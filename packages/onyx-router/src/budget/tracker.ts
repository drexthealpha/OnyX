/**
 * @onyx/router — Budget Tracker
 *
 * SQLite-backed spend tracking at ./data/budget.db
 * Records per-user USD spend and provides daily/monthly rollups.
 */

import * as path from "path";
import * as fs from "fs";

let Database: typeof import("../better-sqlite3-stub.js").default;
try {
  Database = require("better-sqlite3").default;
} catch {
  Database = require("./better-sqlite3-stub.js").default;
}

const DB_PATH = process.env.ONYX_BUDGET_DB ?? path.join("data", "budget.db");

let _db: InstanceType<typeof Database> | null = null;

function getDb(): InstanceType<typeof Database> {
  if (_db) return _db;

  // Ensure directory exists
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  _db = new Database(DB_PATH);

  // WAL mode for concurrent reads
  _db.pragma("journal_mode = WAL");

  // Create spend_events table
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

/**
 * Record a spend event for a user.
 * @param userId    Unique user identifier
 * @param usdAmount Amount spent in USD
 * @param provider  Provider name (optional metadata)
 * @param model     Model name (optional metadata)
 */
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

/**
 * Get total spend for a user in the last 24 hours (UTC rolling window).
 */
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

/**
 * Get total spend for a user in the last 30 days (UTC rolling window).
 */
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

/**
 * Get total spend for a user in the last N hours.
 */
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

/**
 * Get full spend breakdown for a user (for dashboard/diagnostics).
 */
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

/**
 * Close the database connection (for graceful shutdown / testing).
 */
export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}