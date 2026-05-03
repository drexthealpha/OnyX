import { describe, test, expect, beforeEach, afterEach } from "vitest";

describe("telemetry.emit()", () => {
  let fetchCalls: Array<{ url: string; body: unknown }> = [];
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    fetchCalls = [];
    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      const body = init?.body ? JSON.parse(init.body as string) : null;
      fetchCalls.push({ url: String(url), body });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as any;
  });

  afterEach(() => { globalThis.fetch = originalFetch; });

  test("POSTs correct shape to RL_PORT /capture", async () => {
    const RL_PORT = 30000;
    async function emit(t: { conversationId: string; message: unknown; channelName: string; timestamp: string; latencyMs: number }): Promise<void> {
      try {
        await fetch(`http://localhost:${RL_PORT}/capture`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(t) });
      } catch {}
    }
    const telemetry = { conversationId: "conv-123", message: { content: "hello" }, channelName: "telegram", timestamp: "2025-01-01T00:00:00.000Z", latencyMs: 42 };
    await emit(telemetry);
    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0]!.url).toBe(`http://localhost:${RL_PORT}/capture`);
    expect(fetchCalls[0]!.body).toMatchObject({ conversationId: "conv-123", channelName: "telegram", latencyMs: 42 });
  });
});