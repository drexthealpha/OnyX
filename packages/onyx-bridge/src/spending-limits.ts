// packages/onyx-bridge/src/spending-limits.ts

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { BUDGET_CAP } from './types';

export class SpendingLimitEnforcer {
  private db: Database.Database;
  private dailyLimit: bigint;
  
  constructor(options?: { dbPath?: string; dailyLimitLamports?: bigint }) {
    const dbPath = options?.dbPath || ':memory:';
    this.dailyLimit = options?.dailyLimitLamports || BUDGET_CAP;
    
    if (dbPath !== ':memory:') {
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
    
    this.db = new Database(dbPath);
    
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS spending (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dwallet_id TEXT NOT NULL,
        amount_lamports TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_dwallet_time ON spending(dwallet_id, timestamp);
    `);
  }
  
  async checkAndEnforce(dwalletId: string, amountLamports: bigint): Promise<void> {
    const currentSpend = this.getDailySpend(dwalletId);
    const totalAfter = currentSpend + amountLamports;
    
    if (totalAfter > this.dailyLimit) {
      // Trigger kernel alarm directly (library mode)
      import('@onyx/kernel/alarm-and-abort').then(({ alarm }) => {
        import('@onyx/kernel/types').then(({ AlarmCode }) => {
          alarm(dwalletId, AlarmCode.BUDGET_CAP, {
            attemptedAmount: amountLamports.toString(),
            currentSpend: currentSpend.toString(),
            dailyLimit: this.dailyLimit.toString(),
            timestamp: Date.now(),
          });
        });
      }).catch(() => {});
      
      throw new Error(
        `BUDGET_CAP_EXCEEDED: ${dwalletId} - tried ${amountLamports}, already spent ${currentSpend}, limit ${this.dailyLimit}`
      );
    }
  }
  
  recordSpend(dwalletId: string, amountLamports: bigint): void {
    const stmt = this.db.prepare(
      'INSERT INTO spending (dwallet_id, amount_lamports, timestamp) VALUES (?, ?, ?)'
    );
    stmt.run(dwalletId, amountLamports.toString(), Math.floor(Date.now() / 1000));
  }
  
  getDailySpend(dwalletId: string): bigint {
    const cutoff = Math.floor(Date.now() / 1000) - 86400;
    
    const stmt = this.db.prepare(
      'SELECT COALESCE(SUM(CAST(amount_lamports AS INTEGER)), 0) as total FROM spending WHERE dwallet_id = ? AND timestamp > ?'
    );
    
    const result = stmt.get(dwalletId, cutoff) as { total: number };
    return BigInt(result.total);
  }
  
  resetSpend(dwalletId: string): void {
    const stmt = this.db.prepare('DELETE FROM spending WHERE dwallet_id = ?');
    stmt.run(dwalletId);
  }
  
  close(): void {
    this.db.close();
  }
}

export function createSpendingLimiter(options?: {
  dbPath?: string;
  dailyLimitLamports?: bigint;
}): SpendingLimitEnforcer {
  return new SpendingLimitEnforcer(options);
}