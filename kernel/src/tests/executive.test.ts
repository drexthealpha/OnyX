/**
 * kernel/tests/executive.test.ts
 * Tests for kernel/executive.ts (min-heap priority queue).
 */

import { describe, test, expect, beforeEach } from "vitest";
import { enqueue, dequeue, clear, size } from "../executive.js";
import { Priority } from "../types.js";

beforeEach(() => {
  clear();
});

describe("Executive (min-heap priority queue)", () => {

  test("higher priority task is dequeued before lower priority", () => {
    const now = Date.now();

    enqueue({ id: "low-prio",  priority: Priority.BACKGROUND, fn: async () => {}, createdAt: now });
    enqueue({ id: "high-prio", priority: Priority.VAULT,      fn: async () => {}, createdAt: now + 1 });
    enqueue({ id: "mid-prio",  priority: Priority.CHANNEL,    fn: async () => {}, createdAt: now + 2 });

    expect(dequeue()?.id).toBe("high-prio");
    expect(dequeue()?.id).toBe("mid-prio");
    expect(dequeue()?.id).toBe("low-prio");
  });

  test("same priority tasks are dispatched FIFO by createdAt", () => {
    const base = 1_700_000_000_000;

    enqueue({ id: "task-c", priority: Priority.RESEARCH, fn: async () => {}, createdAt: base + 300 });
    enqueue({ id: "task-a", priority: Priority.RESEARCH, fn: async () => {}, createdAt: base + 100 });
    enqueue({ id: "task-b", priority: Priority.RESEARCH, fn: async () => {}, createdAt: base + 200 });

    expect(dequeue()?.id).toBe("task-a");
    expect(dequeue()?.id).toBe("task-b");
    expect(dequeue()?.id).toBe("task-c");
  });

  test("dequeue on empty queue returns undefined", () => {
    expect(size()).toBe(0);
    expect(dequeue()).toBeUndefined();
    expect(size()).toBe(0);
  });

});
