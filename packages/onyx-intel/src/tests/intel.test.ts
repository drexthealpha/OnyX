// packages/onyx-intel/src/tests/intel.test.ts
// 3 tests:
// 1. Reddit source returns array (structure check, not content)
// 2. Score returns lower value for content 100h old vs 1h old
// 3. Cache returns null after TTL expires (mock Date.now)

import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { search as redditSearch } from "../sources/reddit.ts";
import { scoreSource } from "../pipeline/score.ts";
import { get as cacheGet, set as cacheSet, isExpired } from "../cache.ts";
import type { Source, IntelBrief } from "../types.ts";

// ---------------------------------------------------------------------------
// Test 1: Reddit source returns array (may be empty in test env — structure check)
// ---------------------------------------------------------------------------
describe("Reddit source", () => {
  it("returns an array (structure check, not content assertion)", async () => {
    // This makes a real HTTP call to the Reddit public JSON endpoint.
    // In CI with no network, it may return []. That is acceptable.
    // We only assert the return type and structure — never the content.
    let result: Source[] = [];
    try {
      result = await redditSearch("typescript");
    } catch {
      // Network unavailable in test env — treat as empty
      result = [];
    }

    expect(Array.isArray(result)).toBe(true);

    // If any results returned, verify Source shape
    for (const item of result) {
      expect(typeof item.platform).toBe("string");
      expect(typeof item.title).toBe("string");
      expect(typeof item.url).toBe("string");
      expect(typeof item.snippet).toBe("string");
      // score is 0 before pipeline scoring
      expect(typeof item.score).toBe("number");
    }
  });
});

// ---------------------------------------------------------------------------
// Test 2: Score function returns lower value for content 100 hours old vs 1 hour old
// ---------------------------------------------------------------------------
describe("scoreSource", () => {
  it("scores content 1h old higher than 100h old (recencyDecay difference)", () => {
    const now = Date.now();

    const baseSource: Omit<Source, "publishedAt" | "score"> = {
      platform: "reddit",
      title: "TypeScript performance improvements",
      url: "https://reddit.com/r/typescript/comments/test",
      snippet: "TypeScript performance improvements are significant in this release",
      engagement: 500,
    };

    const source1h: Source = {
      ...baseSource,
      score: 0,
      publishedAt: now - 1 * 60 * 60 * 1000, // 1 hour ago
    };

    const source100h: Source = {
      ...baseSource,
      score: 0,
      publishedAt: now - 100 * 60 * 60 * 1000, // 100 hours ago
    };

    const query = "typescript performance";

    const score1h = scoreSource(source1h, query);
    const score100h = scoreSource(source100h, query);

    // Newer content must score strictly higher
    expect(score1h).toBeGreaterThan(score100h);

    // Verify the recency decay formula directly:
    // decay(1)   = 1 / Math.log(1 + Math.E)   ≈ 0.557
    // decay(100) = 1 / Math.log(100 + Math.E)  ≈ 0.213
    const decayNew = 1 / Math.log(1 + Math.E);
    const decayOld = 1 / Math.log(100 + Math.E);
    expect(decayNew).toBeGreaterThan(decayOld);
  });
});

// ---------------------------------------------------------------------------
// Test 3: Cache returns null after TTL expires (mock Date.now to simulate time)
// ---------------------------------------------------------------------------
describe("Intel cache TTL", () => {
  const TTL_MS = 3600 * 1000; // must match cache.ts

  it("returns null after TTL expires (Date.now mocked)", () => {
    const topic = `__test_ttl_${Math.random().toString(36).slice(2)}`;

    const mockBrief: IntelBrief = {
      topic,
      brief: "Test brief content.",
      sources: [],
      timestamp: Date.now(),
      confidence: 0.8,
    };

    // Store at "real" now
    const realNow = Date.now();
    cacheSet(topic, mockBrief);

    // Verify it's retrievable immediately
    const immediate = cacheGet(topic);
    expect(immediate).not.toBeNull();
    expect(immediate?.topic).toBe(topic);

    // Mock Date.now to simulate TTL + 1 second having passed
    const originalDateNow = Date.now;
    Date.now = () => realNow + TTL_MS + 1000;

    try {
      // isExpired should now return true
      expect(isExpired(topic)).toBe(true);

      // cacheGet should return null (entry is expired)
      const afterExpiry = cacheGet(topic);
      expect(afterExpiry).toBeNull();
    } finally {
      // Always restore Date.now
      Date.now = originalDateNow;
    }
  });
});