import type { Herald } from "./herald.js";
import { globalHerald } from "./herald.js";

const TOPIC_SET = "shared-memory.entry.set";
const TOPIC_DELETE = "shared-memory.entry.deleted";

export interface MemoryEntry<T = unknown> {
  key: string;
  value: T;
  expiresAt?: number;
  updatedAt: number;
}

export type MemorySnapshot = ReadonlyMap<string, MemoryEntry>;

export type MemorySetEvent = { key: string; entry: MemoryEntry };
export type MemoryDeleteEvent = { key: string };

export class SharedMemory {
  private readonly store = new Map<string, MemoryEntry>();
  private readonly herald: Herald;

  constructor(herald: Herald = globalHerald) {
    this.herald = herald;
  }

  set<T = unknown>(key: string, value: T, ttlMs?: number): void {
    const now = Date.now();
    const entry: MemoryEntry<T> = {
      key,
      value,
      updatedAt: now,
      ...(ttlMs !== undefined ? { expiresAt: now + ttlMs } : {}),
    };
    this.store.set(key, entry as MemoryEntry);
    this.herald.publish(TOPIC_SET, { key, entry } satisfies MemorySetEvent);
  }

  get<T = unknown>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (entry === undefined) return undefined;

    if (entry.expiresAt !== undefined && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.herald.publish(TOPIC_DELETE, { key } satisfies MemoryDeleteEvent);
      return undefined;
    }

    return entry.value as T;
  }

  delete(key: string): void {
    if (!this.store.has(key)) return;
    this.store.delete(key);
    this.herald.publish(TOPIC_DELETE, { key } satisfies MemoryDeleteEvent);
  }

  snapshot(): MemorySnapshot {
    const now = Date.now();
    const live = new Map<string, MemoryEntry>();
    for (const [key, entry] of this.store) {
      if (entry.expiresAt === undefined || entry.expiresAt > now) {
        live.set(key, entry);
      }
    }
    return live;
  }

  onSet(handler: (event: MemorySetEvent) => void): () => void {
    return this.herald.subscribe<MemorySetEvent>(TOPIC_SET, handler);
  }

  onDelete(handler: (event: MemoryDeleteEvent) => void): () => void {
    return this.herald.subscribe<MemoryDeleteEvent>(TOPIC_DELETE, handler);
  }

  clear(): void {
    const keys = [...this.store.keys()];
    this.store.clear();
    for (const key of keys) {
      this.herald.publish(TOPIC_DELETE, { key } satisfies MemoryDeleteEvent);
    }
  }

  get size(): number {
    return this.store.size;
  }
}

export function createSharedMemory(herald?: Herald): SharedMemory {
  return new SharedMemory(herald);
}