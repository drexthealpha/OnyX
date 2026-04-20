/**
 * kernel/executive.ts
 *
 * Min-heap priority queue — the ONYX Executive.
 *
 * Directly inspired by the Apollo-11 AGC EXECUTIVE (Comanche055/EXECUTIVE.agc).
 * The AGC Executive's EJSCAN loop scanned all seven core-set PRIORITY registers
 * and dispatched the job with the highest active priority (lowest numeric value
 * in AGC's twos-complement scheme).  ONYX replicates that behaviour using a
 * binary min-heap so dispatch is O(log n) instead of O(n).
 *
 * Heap ordering rule (matches AGC's "lowest numeric priority wins"):
 *   1. Sort by OnyxTask.priority ascending (Priority.VAULT=0 dispatched first)
 *   2. Tiebreak by OnyxTask.createdAt ascending (FIFO within same priority)
 *
 * The heap is a complete binary tree stored in a plain array (index 0 = root).
 *   parent(i) = floor((i - 1) / 2)
 *   left(i)   = 2i + 1
 *   right(i)  = 2i + 2
 */

import { type OnyxTask, Priority } from "./types.ts";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Returns true when task `a` should be dispatched before task `b`. */
function higher(a: OnyxTask, b: OnyxTask): boolean {
  if (a.priority !== b.priority) return a.priority < b.priority;
  return a.createdAt < b.createdAt;   // FIFO tiebreaker
}

/** Swap two elements in the heap array. */
function swap(heap: OnyxTask[], i: number, j: number): void {
  const tmp = heap[i]!;
  heap[i]   = heap[j]!;
  heap[j]   = tmp;
}

/** Sift element at index `i` upward until the heap property is restored. */
function siftUp(heap: OnyxTask[], i: number): void {
  while (i > 0) {
    const parent = (i - 1) >> 1;
    if (higher(heap[i]!, heap[parent]!)) {
      swap(heap, i, parent);
      i = parent;
    } else {
      break;
    }
  }
}

/** Sift element at index `i` downward until the heap property is restored. */
function siftDown(heap: OnyxTask[], i: number): void {
  const n = heap.length;
  while (true) {
    let best  = i;
    const l   = 2 * i + 1;
    const r   = 2 * i + 2;
    if (l < n && higher(heap[l]!, heap[best]!)) best = l;
    if (r < n && higher(heap[r]!, heap[best]!)) best = r;
    if (best === i) break;
    swap(heap, i, best);
    i = best;
  }
}

// ---------------------------------------------------------------------------
// Module-level heap state (singleton — one Executive per process)
// ---------------------------------------------------------------------------
const _heap: OnyxTask[] = [];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * enqueue — insert a task into the priority queue.
 * O(log n). Mirrors AGC NOVAC/FINDVAC job entry.
 */
export function enqueue(task: OnyxTask): void {
  _heap.push(task);
  siftUp(_heap, _heap.length - 1);
}

/**
 * dequeue — remove and return the highest-priority task.
 * Returns undefined when the queue is empty (mirrors AGC DUMMYJOB idle state).
 * O(log n). Mirrors AGC EJSCAN + CHANJOB dispatch.
 */
export function dequeue(): OnyxTask | undefined {
  if (_heap.length === 0) return undefined;
  if (_heap.length === 1) return _heap.pop()!;

  const top  = _heap[0]!;
  _heap[0]   = _heap.pop()!;   // move last element to root
  siftDown(_heap, 0);
  return top;
}

/**
 * peek — inspect the highest-priority task without removing it.
 * O(1). Mirrors AGC's PRIORITY register read.
 */
export function peek(): OnyxTask | undefined {
  return _heap[0];
}

/**
 * size — number of tasks currently queued.
 * O(1).
 */
export function size(): number {
  return _heap.length;
}

/**
 * clear — remove all tasks from the queue.
 * Mirrors AGC STARTSB2 making all Executive registers available on restart.
 */
export function clear(): void {
  _heap.length = 0;
}