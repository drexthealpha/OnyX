/**
 * kernel/tests/waitlist.test.ts
 * Tests for kernel/waitlist.ts (persistent SQLite queue).
 */

import { describe, test, expect, beforeEach } from "vitest";
import { unlinkSync, existsSync } from "node:fs";
import { push, pop, flush, size } from "../waitlist.ts";
import { Priority } from "../types.ts";

const DB_PATH = "./data/waitlist.db";

beforeEach(() => {
  if (existsSync(DB_PATH)) {
    try { unlinkSync(DB_PATH); } catch { /* ignore */ }
  }
  flush();
});

describe("Waitlist (persistent SQLite queue)", () => {

  test("push then pop (simulating restart) returns the same item", () => {
    push({ id: "persist-me", priority: Priority.VAULT, fn: async () => {}, createdAt: 1_700_000_000_000 });

    const retrieved = pop();

    expect(retrieved).not.toBeUndefined();
    expect(retrieved?.id).toBe("persist-me");
    expect(retrieved?.priority).toBe(Priority.VAULT);
    expect(retrieved?.createdAt).toBe(1_700_000_000_000);
  });

  test("flush() empties the queue", () => {
    push({ id: "t1", priority: Priority.VOICE,   fn: async () => {}, createdAt: 1 });
    push({ id: "t2", priority: Priority.CHANNEL, fn: async () => {}, createdAt: 2 });
    push({ id: "t3", priority: Priority.RL,      fn: async () => {}, createdAt: 3 });

    expect(size()).toBe(3);
    flush();
    expect(size()).toBe(0);
    expect(pop()).toBeUndefined();
  });

  test("size() returns correct count across multiple push/pop operations", () => {
    expect(size()).toBe(0);

    push({ id: "a", priority: Priority.RESEARCH, fn: async () => {}, createdAt: 10 });
    expect(size()).toBe(1);

    push({ id: "b", priority: Priority.CONTENT,  fn: async () => {}, createdAt: 20 });
    push({ id: "c", priority: Priority.HEALTH,   fn: async () => {}, createdAt: 30 });
    expect(size()).toBe(3);

    pop();
    expect(size()).toBe(2);

    pop(); pop();
    expect(size()).toBe(0);
  });

});