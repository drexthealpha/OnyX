declare module "zod" {
  export const z: {
    object: (schema: Record<string, unknown>) => unknown;
    string: () => { default: (msg?: string) => unknown };
    number: () => { default: (msg?: string) => unknown };
    boolean: () => { default: (msg?: string) => unknown };
    array: (schema: unknown) => unknown;
    enum: (values: string[]) => unknown;
    infer: { typeof: <T>(schema: T) => T };
  };
}

declare module "better-sqlite3" {
  interface Database {
    exec(sql: string): void;
    prepare(sql: string): Statement;
    close(): void;
    pragma(pragma: string): unknown;
  }
  interface Statement {
    run(...params: unknown[]): { changes: number; lastInsertRowid: number };
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  }
  export default class Database {
    constructor(filename: string);
  }
}