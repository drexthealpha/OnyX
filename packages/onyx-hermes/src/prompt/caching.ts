/**
 * Prompt cache — avoids redundant API calls for identical prompt inputs.
 * LRU eviction with configurable max size.
 */

interface CacheEntry {
  response: string;
  tokensUsed: number;
  createdAt: number;
  hitCount: number;
}

export class PromptCache {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly maxSize: number;
  private readonly ttlMs: number;

  constructor(maxSize = 500, ttlMs = 3600_000) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  /** Compute cache key from prompt parts. */
  key(system: string, user: string): string {
    // Simple key: hash of concatenated strings
    const combined = `${system}||${user}`;
    let h = 0;
    for (let i = 0; i < combined.length; i++) {
      h = (Math.imul(31, h) + combined.charCodeAt(i)) | 0;
    }
    return Math.abs(h).toString(36);
  }

  /** Get cached response. Returns null if miss or expired. */
  get(cacheKey: string): CacheEntry | null {
    const entry = this.cache.get(cacheKey);
    if (!entry) return null;

    if (Date.now() - entry.createdAt > this.ttlMs) {
      this.cache.delete(cacheKey);
      return null;
    }

    entry.hitCount++;
    // Move to end (LRU: most recently used = last)
    this.cache.delete(cacheKey);
    this.cache.set(cacheKey, entry);
    return entry;
  }

  /** Store a response in the cache. */
  set(cacheKey: string, response: string, tokensUsed: number): void {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }

    this.cache.set(cacheKey, {
      response,
      tokensUsed,
      createdAt: Date.now(),
      hitCount: 0,
    });
  }

  /** Invalidate a cache entry. */
  invalidate(cacheKey: string): void {
    this.cache.delete(cacheKey);
  }

  /** Clear all cache entries. */
  clear(): void {
    this.cache.clear();
  }

  /** Return cache stats. */
  stats(): { size: number; maxSize: number; ttlMs: number } {
    return { size: this.cache.size, maxSize: this.maxSize, ttlMs: this.ttlMs };
  }
}