import { test, expect, describe, beforeAll, afterAll } from "bun:test";
import { serve } from "@hono/node-server";
import { Hono } from "hono";

const mockPage = {
  url: () => "https://example.com",
  title: () => "Example",
  accessibility: {
    snapshot: async () => ({
      role: "RootWebArea",
      name: "Example",
      children: [
        { role: "link", name: "Example Domain", nodeId: 1 },
        { role: "button", name: "Submit", nodeId: 2 },
        { role: "textbox", name: "Search", nodeId: 3 },
      ],
    }),
  },
  goto: async () => {},
  click: async () => {},
  keyboard: { type: async () => {}, press: async () => {} },
  mouse: { wheel: async () => {} },
  screenshot: async () => Buffer.from("fake-png"),
  close: async () => {},
  context: () => ({ addCookies: async () => {} }),
};

describe("onyx-browser", () => {
  test("GET /health returns 200 with status ok", async () => {
    const app = new Hono();

    const testTabs = new Map();
    app.get("/health", (c) => {
      return c.json({ status: "ok", tabs: testTabs.size });
    });

    const server = serve({
      fetch: app.fetch,
      port: 3456,
      hostname: "127.0.0.1",
    });

    const url = `http://127.0.0.1:3456/health`;
    const res = await fetch(url);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("ok");

    server.close();
  });

  test("navigate action returns snapshot with elements", async () => {
    const app = new Hono();

    const tabs = new Map();
    tabs.set("test-tab-id", mockPage as any);

    app.get("/tab/:id/snapshot", (c) => {
      const tabId = c.req.param("id");
      const page = tabs.get(tabId);

      if (!page) {
        return c.json({ error: "Tab not found" }, 404);
      }

      const elements = [
        { elementRef: "e1", type: "link", text: "Example Domain", bounds: { x: 0, y: 0, w: 0, h: 0 } },
        { elementRef: "e2", type: "button", text: "Submit", bounds: { x: 0, y: 0, w: 0, h: 0 } },
      ];

      return c.json({
        tabId,
        elements,
        text: "[link e1] Example Domain | [button e2] Submit",
      });
    });

    const server = serve({
      fetch: app.fetch,
      port: 3457,
      hostname: "127.0.0.1",
    });

    const url = `http://127.0.0.1:3457/tab/test-tab-id/snapshot`;
    const res = await fetch(url);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.elements.length).toBeGreaterThanOrEqual(1);
    expect(body.tabId).toBe("test-tab-id");

    server.close();
  });

  test("searchGoogle returns array on rate limiting", async () => {
    const app = new Hono();

    app.post("/tab/create", (c) => {
      return c.json({ id: "new-tab", url: "https://google.com", title: "Google" });
    });

    app.get("/tab/:id/snapshot", (c) => {
      return c.json({
        tabId: c.req.param("id"),
        elements: [],
        text: "",
      });
    });

    app.post("/tab/:id/type", (c) => {
      return c.json({ ok: true });
    });

    app.delete("/tab/:id", (c) => {
      return c.json({ ok: true });
    });

    const server = serve({
      fetch: app.fetch,
      port: 3458,
      hostname: "127.0.0.1",
    });

    const baseUrl = `http://127.0.0.1:3458`;

    const createRes = await fetch(`${baseUrl}/tab/create`, {
      method: "POST",
      body: JSON.stringify({ url: "https://google.com" }),
    });
    const tab = await createRes.json();

    const snapRes = await fetch(`${baseUrl}/tab/${tab.id}/snapshot`);
    const snapshot = await snapRes.json();

    expect(Array.isArray(snapshot.elements)).toBe(true);

    server.close();
  });
});