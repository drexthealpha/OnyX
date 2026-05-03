/**
 * Portfolio state — SQLite-backed persistence
 *
 * DB path: ONYX_PORTFOLIO_DB env var, defaults to ./data/portfolio.db
 * All mutations are synchronous writes via better-sqlite3 (WAL mode).
 * State survives process restarts.
 */

import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';
import type { Portfolio, CompletedTrade } from './types.js';
import * as solana from '@onyx/solana';
import { fetchPrice } from './data/birdeye.js';
import { COMMON_TOKENS, reverseResolveToken } from './data/tokens.js';

const DB_PATH =
  process.env['ONYX_PORTFOLIO_DB'] ?? path.join('data', 'portfolio.db');

let _db: DatabaseType | null = null;

function getDb(): DatabaseType {
  if (_db) return _db;

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS portfolio (
      id            INTEGER PRIMARY KEY CHECK(id = 1),
      total_value   REAL    NOT NULL DEFAULT 0,
      cash_usd      REAL    NOT NULL DEFAULT 0,
      positions_json TEXT   NOT NULL DEFAULT '{}',
      updated_at    INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
    );

    CREATE TABLE IF NOT EXISTS trade_history (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      token      TEXT    NOT NULL,
      action     TEXT    NOT NULL,
      amount_usd REAL    NOT NULL,
      price      REAL,
      pnl_usd    REAL,
      pnl_pct    REAL,
      ts         INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_trade_ts ON trade_history(ts);
  `);

  _db = db;
  return db;
}

// ─── Read ────────────────────────────────────────────────────────────────────

export function getPortfolio(): Portfolio {
  const db = getDb();
  let row = db
    .prepare('SELECT total_value, cash_usd, positions_json FROM portfolio WHERE id = 1')
    .get() as { total_value: number; cash_usd: number; positions_json: string } | undefined;

  if (!row) {
    db.prepare('INSERT INTO portfolio (id, total_value, cash_usd, positions_json) VALUES (1, 0, 0, \'{}\')').run();
    row = { total_value: 0, cash_usd: 0, positions_json: '{}' };
  }

  return {
    totalValueUsd: row.total_value,
    cashUsd: row.cash_usd,
    positions: JSON.parse(row.positions_json) as Portfolio['positions'],
    timestamp: Date.now(),
  };
}

/**
 * Synchronize the local portfolio state with actual on-chain balances.
 * This grounds the portfolio in reality, fetching all SPL tokens and SOL.
 */
export async function sync(): Promise<Portfolio> {

  const solResult = (await solana.executeTool('getBalance', {})) as { sol: number };
  const splResult = (await solana.executeTool('getTokenAccounts', {})) as {
    accounts: Array<{ mint: string; amount: number; decimals: number }>;
  };

  const currentP = getPortfolio();
  const positions: Portfolio['positions'] = {};
  let cashUsd = 0;

  // 1. SOL
  const solPrice = await fetchPrice('SOL');
  positions['SOL'] = {
    token: 'SOL',
    amount: solResult.sol,
    valueUsd: solResult.sol * solPrice,
    entryPrice: currentP.positions['SOL']?.entryPrice ?? solPrice,
  };

  // 2. SPL Tokens
  for (const acc of splResult.accounts) {
    if (acc.amount <= 0) continue;

    // Is it cash?
    if (acc.mint === COMMON_TOKENS['USDC'] || acc.mint === COMMON_TOKENS['USDT']) {
      cashUsd += acc.amount;
      continue;
    }

    const symbol = await reverseResolveToken(acc.mint);
    const price = await fetchPrice(acc.mint);
    
    positions[symbol] = {
      token: symbol,
      amount: acc.amount,
      valueUsd: acc.amount * price,
      entryPrice: currentP.positions[symbol]?.entryPrice ?? price,
    };
  }

  const posValue = Object.values(positions).reduce((s, p) => s + p.valueUsd, 0);
  const totalValue = cashUsd + posValue;

  const db = getDb();
  db.prepare(
    `UPDATE portfolio SET total_value = ?, cash_usd = ?, positions_json = ?,
     updated_at = strftime('%s','now') * 1000 WHERE id = 1`,
  ).run(totalValue, cashUsd, JSON.stringify(positions));

  return getPortfolio();
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export function setStartingCapital(usd: number): void {
  const db = getDb();
  db.prepare(
    `UPDATE portfolio SET total_value = ?, cash_usd = ?, positions_json = '{}',
     updated_at = strftime('%s','now') * 1000 WHERE id = 1`,
  ).run(usd, usd);
}

export function recordBuy(token: string, amountUsd: number, price: number): void {
  const db = getDb();
  const p = getPortfolio();
  const positions = p.positions;

  const existing = positions[token];
  if (existing) {
    const totalValue = existing.valueUsd + amountUsd;
    const totalAmount = existing.amount + amountUsd / price;
    positions[token] = {
      token,
      amount: totalAmount,
      valueUsd: totalValue,
      entryPrice: totalValue / totalAmount,
    };
  } else {
    positions[token] = {
      token,
      amount: amountUsd / price,
      valueUsd: amountUsd,
      entryPrice: price,
    };
  }

  const newCash = p.cashUsd - amountUsd;
  const posValue = Object.values(positions).reduce((s, pos) => s + pos.valueUsd, 0);
  const newTotal = newCash + posValue;

  db.prepare(
    `UPDATE portfolio SET total_value = ?, cash_usd = ?, positions_json = ?,
     updated_at = strftime('%s','now') * 1000 WHERE id = 1`,
  ).run(newTotal, newCash, JSON.stringify(positions));
}

export function recordSell(token: string, amountUsd: number, price: number): void {
  const db = getDb();
  const p = getPortfolio();
  const positions = { ...p.positions };
  const pos = positions[token];
  if (!pos) return;

  pos.amount -= amountUsd / price;
  pos.valueUsd = pos.amount * pos.entryPrice;

  if (pos.amount <= 0) {
    delete positions[token];
  }

  const newCash = p.cashUsd + amountUsd;
  const posValue = Object.values(positions).reduce((s, p2) => s + p2.valueUsd, 0);
  const newTotal = newCash + posValue;

  db.prepare(
    `UPDATE portfolio SET total_value = ?, cash_usd = ?, positions_json = ?,
     updated_at = strftime('%s','now') * 1000 WHERE id = 1`,
  ).run(newTotal, newCash, JSON.stringify(positions));
}

export function updatePositionPrice(token: string, price: number): void {
  const db = getDb();
  const p = getPortfolio();
  const positions = { ...p.positions };
  const pos = positions[token];
  if (!pos) return;

  pos.valueUsd = pos.amount * price;
  const posValue = Object.values(positions).reduce((s, p2) => s + p2.valueUsd, 0);
  const newTotal = p.cashUsd + posValue;

  db.prepare(
    `UPDATE portfolio SET total_value = ?, positions_json = ?,
     updated_at = strftime('%s','now') * 1000 WHERE id = 1`,
  ).run(newTotal, JSON.stringify(positions));
}

// ─── Trade History ────────────────────────────────────────────────────────────

export function addTrade(trade: CompletedTrade): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO trade_history (token, action, amount_usd, price, pnl_usd, pnl_pct, ts)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    trade.token,
    trade.action,
    trade.size,
    trade.entryPrice,
    trade.pnlUsd ?? null,
    trade.pnlPct ?? null,
    trade.timestamp,
  );
}

export function getTradeHistory(): CompletedTrade[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM trade_history ORDER BY ts ASC')
    .all() as Array<{
      token: string;
      action: string;
      amount_usd: number;
      price: number | null;
      pnl_usd: number | null;
      pnl_pct: number | null;
      ts: number;
    }>;

  return rows.map((r) => ({
    token: r.token,
    action: r.action as 'BUY' | 'SELL',
    size: r.amount_usd,
    entryPrice: r.price ?? 0,
    pnlUsd: r.pnl_usd === null ? undefined : r.pnl_usd,
    pnlPct: r.pnl_pct === null ? undefined : r.pnl_pct,
    txHash: '',
    timestamp: r.ts,
  }));
}

export function getLastNTrades(n: number): CompletedTrade[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM trade_history ORDER BY ts DESC LIMIT ?')
    .all(n) as Array<{
      token: string;
      action: string;
      amount_usd: number;
      price: number | null;
      pnl_usd: number | null;
      pnl_pct: number | null;
      ts: number;
    }>;

  return rows
    .map((r) => ({
      token: r.token,
      action: r.action as 'BUY' | 'SELL',
      size: r.amount_usd,
      entryPrice: r.price ?? 0,
      pnlUsd: r.pnl_usd === null ? undefined : r.pnl_usd,
      pnlPct: r.pnl_pct === null ? undefined : r.pnl_pct,
      txHash: '',
      timestamp: r.ts,
    }))
    .reverse(); // return oldest-first to match prior behaviour
}

export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}