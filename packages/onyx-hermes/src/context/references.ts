/**
 * Reference tracking — keeps a rolling log of inputs that have been
 * processed by the context engine, enabling de-duplication and citation.
 */

interface Reference {
  content: string;
  timestamp: number;
  hash: string;
}

function simpleHash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16);
}

export class ReferenceTracker {
  private readonly references: Reference[] = [];
  private readonly maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  /** Track a new input reference. */
  track(content: string): void {
    const hash = simpleHash(content);
    if (this.references.some((r) => r.hash === hash)) return; // dedup

    this.references.push({ content, timestamp: Date.now(), hash });

    // Evict oldest when over capacity
    while (this.references.length > this.maxSize) {
      this.references.shift();
    }
  }

  /** Check if content has been seen before. */
  hasSeen(content: string): boolean {
    const hash = simpleHash(content);
    return this.references.some((r) => r.hash === hash);
  }

  /** Get all tracked references. */
  getAll(): Reference[] {
    return [...this.references];
  }

  /** Clear all references. */
  clear(): void {
    this.references.length = 0;
  }
}