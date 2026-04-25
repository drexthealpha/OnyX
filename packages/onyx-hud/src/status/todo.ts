// ─────────────────────────────────────────────
//  @onyx/hud — status/todo.ts
//  Task queue display — reads pending items from @onyx/rl.
//  Falls back to gateway HTTP /rl/tasks if @onyx/rl unavailable.
// ─────────────────────────────────────────────

import type { TodoItem } from "../types.js";

const GATEWAY_PORT = process.env["GATEWAY_PORT"] ?? "3000";
const RL_PORT = process.env["RL_PORT"] ?? "4000";

/**
 * Returns all pending/in_progress tasks from @onyx/rl.
 */
export async function getPendingTasks(): Promise<TodoItem[]> {
  // Attempt 1: @onyx/rl direct import
  try {
    const rl = await import("@onyx/rl").catch(() => null);
    if (rl?.listTasks) {
      const tasks = await rl.listTasks({ status: ["pending", "in_progress"] });
      return tasks as TodoItem[];
    }
  } catch (err) {
    console.warn("[onyx-hud/todo] rl.listTasks() failed:", err);
  }

  // Attempt 2: RL HTTP endpoint
  try {
    const res = await fetch(`http://localhost:${RL_PORT}/tasks?status=pending,in_progress`, {
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return [];
    const data = await res.json() as unknown;
    if (Array.isArray(data)) return data as TodoItem[];
    if (data && typeof data === "object") {
      const tasks = (data as Record<string, unknown>)["tasks"];
      if (Array.isArray(tasks)) return tasks as TodoItem[];
    }
  } catch { /* RL not running */ }

  // Attempt 3: gateway proxy
  try {
    const res = await fetch(`http://localhost:${GATEWAY_PORT}/rl/tasks`, {
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return [];
    const data = await res.json() as unknown;
    if (Array.isArray(data)) return data as TodoItem[];
  } catch { /* gateway not running */ }

  return [];
}

/**
 * Formats todo list for HUD display.
 * "▸ Fix authentication bug (2/5)"
 */
export function formatTodoLine(tasks: TodoItem[]): string {
  if (tasks.length === 0) return "";
  const pending = tasks.filter((t) => t.status === "pending").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress");
  const total = tasks.length;

  if (inProgress.length > 0) {
    const current = inProgress[0];
    const desc = current.description.slice(0, 40);
    return `▸ ${desc} (${total - pending}/${total})`;
  }
  return `▸ ${pending} tasks pending`;
}

/**
 * Returns a compact progress summary: "3/5 tasks done"
 */
export function todoProgress(tasks: TodoItem[]): { done: number; total: number } {
  const done = tasks.filter(
    (t) => t.status === "completed" || t.status === "failed"
  ).length;
  return { done, total: tasks.length };
}