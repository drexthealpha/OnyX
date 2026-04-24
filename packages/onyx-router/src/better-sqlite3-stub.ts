// Stub for better-sqlite3 - used when dependency not available
export interface Database {
  exec(sql: string): void;
  prepare(sql: string): Statement;
  close(): void;
  pragma(pragma: string): unknown;
}

export interface Statement {
  run(...params: unknown[]): { changes: number; lastInsertRowid: number };
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
}

export default class Database {
  constructor(filename: string) {
    throw new Error('better-sqlite3 not installed');
  }
}