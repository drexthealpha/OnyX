/**
 * shared-memory.ts
 * Shared in-process state store for agents in the same ONYX council.
 *
 * All agents in a Council share one SharedMemory instance.
 * Entries are typed key→value pairs with optional TTL expiration.
 * The store publishes change events on the Herald so agents can react
 * to state mutations without polling.
 */

import type { Herald } from "./herald.js";
import { globalHerald } from "./herald.js";

const TOPIC_SET = "shared-memory.entry.set";
const TOPIC_DELETE = "shared-memory.entry.deleted";

export interface MemoryEntry<T = unknown> {
  key: string;
  value: T;
  /** Unix timestamp (ms) when this entry expires; undefined = never. */
  expiresAt?: number;
  /** When the entry was last written. */
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

  /**
   * Write a value for `key`.
   * Pass `ttlMs` to automatically expire the entry after that many milliseconds.
   */
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

  /**
   * Read the current value for `key`.
   * Returns undefined if the key does not exist or has expired.
   * Expired entries are lazily deleted on access.
   */
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

  /**
   * Delete an entry by key. No-op if the key does not exist.
   */
  delete(key: string): void {
    if (!this.store.has(key)) return;
    this.store.delete(key);
    this.herald.publish(TOPIC_DELETE, { key } satisfies MemoryDeleteEvent);
  }

  /**
   * Return a snapshot of all live (non-expired) entries.
   */
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

  /**
   * Subscribe to set events. Returns unsubscribe function.
   */
  onSet(handler: (event: MemorySetEvent) => void): () => void {
    return this.herald.subscribe<MemorySetEvent>(TOPIC_SET, handler);
  }

  /**
   * Subscribe to delete events. Returns unsubscribe function.
   */
  onDelete(handler: (event: MemoryDeleteEvent) => void): () => void {
    return this.herald.subscribe<MemoryDeleteEvent>(TOPIC_DELETE, handler);
  }

  /**
   * Remove all entries and publish delete events for each.
   */
  clear(): void {
    const keys = [...this.store.keys()];
    this.store.clear();
    for (const key of keys) {
      this.herald.publish(TOPIC_DELETE, { key } satisfies MemoryDeleteEvent);
    }
  }

  /**
   * Number of live entries in the store.
   */
  get size(): number {
    return this.store.size;
  }
}

export function createSharedMemory(herald?: Herald): SharedMemory {
  return new SharedMemory(herald);
}