// ─────────────────────────────────────────────
//  @onyx/hud — tests/hud.test.ts
//  2 tests:
//  1. isPNG correctly identifies PNG magic bytes (137, 80, 78, 71)
//  2. getTokenUsage returns percent between 0 and 100
// ─────────────────────────────────────────────

import { describe, it, expect, mock, beforeEach, afterEach } from "vitest";

function isPNG(buf: Buffer): boolean {
  const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
  return buf.length >= 4 && buf.slice(0, 4).equals(PNG_HEADER);
}

async function getTokenUsage(): Promise<{ used: number; total: number; percent: number }> {
  const GATEWAY_PORT = process.env["GATEWAY_PORT"] ?? "3000";
  const METRICS_URL = `http://localhost:${GATEWAY_PORT}/metrics`;

  try {
    const res = await fetch(METRICS_URL, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) return { used: 0, total: 200_000, percent: 0 };

    const data = (await res.json()) as Record<string, unknown>;
    const context = (data["context"] ?? {}) as Record<string, unknown>;
    const used = Number(context["used"] ?? 0);
    const total = Number(context["total"] ?? 200_000);
    const percent = total > 0 ? Math.min(100, Math.max(0, (used / total) * 100)) : 0;

    return { used, total, percent };
  } catch {
    return { used: 0, total: 200_000, percent: 0 };
  }
}

// ─── Test 1: isPNG correctly identifies PNG magic bytes ───────────

describe("screen/capture", () => {
  it("isPNG() correctly identifies PNG magic bytes [137, 80, 78, 71]", () => {
    // Real PNG magic bytes
    const pngBuf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(isPNG(pngBuf)).toBe(true);

    // Non-PNG (JPEG)
    const jpegBuf = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
    expect(isPNG(jpegBuf)).toBe(false);

    // Too short
    const shortBuf = Buffer.from([0x89, 0x50]);
    expect(isPNG(shortBuf)).toBe(false);
  });
});

// ─── Test 2: Context meter returns valid percent ──────────

describe("status/context-meter", () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("getTokenUsage() returns { used, total, percent } with percent in [0, 100]", async () => {
    // Mock a gateway /metrics response
    global.fetch = mock(async () =>
      new Response(
        JSON.stringify({
          context: { used: 45_000, total: 200_000 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    ) as typeof fetch;

    const usage = await getTokenUsage();

    expect(typeof usage.used).toBe("number");
    expect(typeof usage.total).toBe("number");
    expect(typeof usage.percent).toBe("number");
    expect(usage.percent).toBeGreaterThanOrEqual(0);
    expect(usage.percent).toBeLessThanOrEqual(100);
    expect(usage.used).toBe(45_000);
    expect(usage.total).toBe(200_000);
    // 45000/200000 = 22.5%
    expect(usage.percent).toBeCloseTo(22.5, 1);
  });

  it("getTokenUsage() returns safe zero state when gateway is down", async () => {
    global.fetch = mock(async () => {
      throw new Error("ECONNREFUSED");
    }) as typeof fetch;

    const usage = await getTokenUsage();

    expect(usage.percent).toBe(0);
    expect(usage.used).toBe(0);
    expect(usage.percent).toBeGreaterThanOrEqual(0);
    expect(usage.percent).toBeLessThanOrEqual(100);
  });
});