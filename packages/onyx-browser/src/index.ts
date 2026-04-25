import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import type { Tab, Cookie, Snapshot } from "./types.js";
import { createTab as createTabAction } from "./actions/create-tab.js";
import { getSnapshot as getSnapshotAction } from "./actions/get-snapshot.js";
import { click as clickAction } from "./actions/click.js";
import { navigate as navigateAction } from "./actions/navigate.js";
import { typeText as typeTextAction } from "./actions/type-text.js";
import { scroll as scrollAction } from "./actions/scroll.js";
import { screenshot as screenshotAction } from "./actions/screenshot.js";
import { closeTab as closeTabAction } from "./actions/close-tab.js";
import { setTab, getTab, getAllTabs, getTabsCount, deleteTab, closeAllTabs } from "./state.js";

const app = new Hono();

const PORT = parseInt(process.env.BROWSER_PORT || "9377");
const IDLE_TIMEOUT = parseInt(process.env.BROWSER_IDLE_TIMEOUT_MS || "300000");

let lastActivity = Date.now();
let idleInterval: ReturnType<typeof setInterval> | null = null;

function log(level: string, msg: string, fields: Record<string, unknown> = {}): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    msg,
    ...fields,
  });
  if (level === "error") {
    process.stderr.write(line + "\n");
  } else {
    process.stdout.write(line + "\n");
  }
}

function resetIdleTimer(): void {
  lastActivity = Date.now();
  if (!idleInterval) {
    idleInterval = setInterval(async () => {
      if (getTabsCount() === 0 && Date.now() - lastActivity > IDLE_TIMEOUT) {
        log("info", "Idle timeout, closing browser");
        try {
          await closeAllTabs();
        } catch {}
      }
    }, 60000);
  }
}

app.use("*", cors());

app.get("/health", (c) => {
  return c.json({ status: "ok", tabs: getTabsCount() });
});

app.post("/tab/create", async (c) => {
  try {
    const body = await c.req.json<{ url?: string }>();
    const tab = await createTabAction(body.url);
    resetIdleTimer();
    log("info", "Tab created", { tabId: tab.id, url: body.url });
    return c.json(tab);
  } catch (e) {
    log("error", "Failed to create tab", { error: (e as Error).message });
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.get("/tabs", (c) => {
  const tabs: Tab[] = [];
  for (const [id, page] of getAllTabs()) {
    tabs.push({
      id,
      url: page.url(),
      title: "",
    });
  }
  return c.json(tabs);
});

app.get("/tab/:id/snapshot", async (c) => {
  const tabId = c.req.param("id");
  try {
    const snapshot = await getSnapshotAction(tabId);
    resetIdleTimer();
    return c.json(snapshot);
  } catch (e) {
    const err = e as Error;
    if (err.message.includes("not found")) {
      return c.json({ error: err.message }, 404);
    }
    return c.json({ error: err.message }, 500);
  }
});

app.post("/tab/:id/click", async (c) => {
  const tabId = c.req.param("id");
  try {
    const body = await c.req.json<{ elementRef: string }>();
    await clickAction(tabId, body.elementRef);
    resetIdleTimer();
    return c.json({ ok: true });
  } catch (e) {
    const err = e as Error;
    if (err.message.includes("not found")) {
      if ((err as any).code === "stale_refs") {
        return c.json({ error: err.message, code: "stale_refs" }, 422);
      }
      return c.json({ error: err.message }, 404);
    }
    return c.json({ error: err.message }, 500);
  }
});

app.post("/tab/:id/navigate", async (c) => {
  const tabId = c.req.param("id");
  try {
    const body = await c.req.json<{ url: string }>();
    const snapshot = await navigateAction(tabId, body.url);
    resetIdleTimer();
    return c.json(snapshot);
  } catch (e) {
    const err = e as Error;
    if (err.message.includes("not found")) {
      return c.json({ error: err.message }, 404);
    }
    return c.json({ error: err.message }, 500);
  }
});

app.post("/tab/:id/type", async (c) => {
  const tabId = c.req.param("id");
  try {
    const body = await c.req.json<{
      elementRef: string;
      text: string;
      pressEnter?: boolean;
    }>();
    await typeTextAction(tabId, body.elementRef, body.text, body.pressEnter);
    resetIdleTimer();
    return c.json({ ok: true });
  } catch (e) {
    const err = e as Error;
    if (err.message.includes("not found")) {
      if ((err as any).code === "stale_refs") {
        return c.json({ error: err.message, code: "stale_refs" }, 422);
      }
      return c.json({ error: err.message }, 404);
    }
    return c.json({ error: err.message }, 500);
  }
});

app.post("/tab/:id/scroll", async (c) => {
  const tabId = c.req.param("id");
  try {
    const body = await c.req.json<{
      direction: "up" | "down" | "left" | "right";
      pixels?: number;
    }>();
    await scrollAction(tabId, body.direction, body.pixels);
    resetIdleTimer();
    return c.json({ ok: true });
  } catch (e) {
    const err = e as Error;
    if (err.message.includes("not found")) {
      return c.json({ error: err.message }, 404);
    }
    return c.json({ error: err.message }, 500);
  }
});

app.get("/tab/:id/screenshot", async (c) => {
  const tabId = c.req.param("id");
  try {
    const screenshot = await screenshotAction(tabId);
    resetIdleTimer();
    return c.json({ tabId, screenshot });
  } catch (e) {
    const err = e as Error;
    if (err.message.includes("not found")) {
      return c.json({ error: err.message }, 404);
    }
    return c.json({ error: err.message }, 500);
  }
});

app.delete("/tab/:id", async (c) => {
  const tabId = c.req.param("id");
  try {
    await closeTabAction(tabId);
    resetIdleTimer();
    return c.json({ ok: true });
  } catch (e) {
    const err = e as Error;
    if (err.message.includes("not found")) {
      return c.json({ error: err.message }, 404);
    }
    return c.json({ error: err.message }, 500);
  }
});

app.post("/tab/:id/cookies", async (c) => {
  const tabId = c.req.param("id");
  try {
    const body = await c.req.json<{ cookies: Cookie[] }>();
    const page = getTab(tabId);
    if (!page) {
      return c.json({ error: "Tab not found" }, 404);
    }

    let imported = 0;
    for (const cookie of body.cookies) {
      try {
        await page.context().addCookies([cookie]);
        imported++;
      } catch {}
    }
    resetIdleTimer();
    return c.json({ ok: true, imported });
  } catch (e) {
    const err = e as Error;
    return c.json({ error: err.message }, 500);
  }
});

const server = serve({
  fetch: app.fetch,
  port: PORT,
});

log("info", `onyx-browser started on port ${PORT}`);

export type Server = typeof server;