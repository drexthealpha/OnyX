// ─────────────────────────────────────────────
//  @onyx/hud — context-injector.ts
//  injectScreenContext(region):
//    1. Capture region as PNG
//    2. Convert to base64
//    3. Parse with @onyx/markitdown image parser → extractedText
//    4. Publish to @onyx/multica herald topic 'screen-context'
//  Gateway picks this up and injects into next session as context.
// ─────────────────────────────────────────────

import { writeFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { capture } from "./screen/capture.js";
import type { Region, ScreenContext } from "./types.js";

export async function injectScreenContext(region: Region): Promise<void> {
  // 1. Capture region as PNG Buffer
  const pngBuffer = await capture(region);

  // 2. Base64 encode
  const imageBase64 = pngBuffer.toString("base64");

  // 3. Write temp file → markitdown image parser → extractedText
  const tmpPath = join(tmpdir(), `onyx-hud-capture-${randomUUID()}.png`);
  await writeFile(tmpPath, pngBuffer);

  let extractedText = "";
  try {
    const markitdown = await import("@onyx/markitdown").catch(() => null);
    if (markitdown) {
      extractedText = await markitdown.convert(tmpPath);
    } else {
      console.warn("[onyx-hud/context-injector] @onyx/markitdown not available");
    }
  } finally {
    await unlink(tmpPath).catch(() => {});
  }

  const screenContext: ScreenContext = {
    region,
    imageBase64,
    extractedText,
    capturedAt: new Date().toISOString(),
  };

  // 4. Publish to herald
  await publishToHerald(screenContext);
}

async function publishToHerald(ctx: ScreenContext): Promise<void> {
  // Attempt 1: @onyx/multica herald (same-process, preferred)
  try {
    const multica = await import("@onyx/multica").catch(() => null);
    if (multica?.herald) {
      await multica.herald.publish("screen-context", ctx);
      console.log("[onyx-hud/context-injector] Published to herald topic: screen-context");
      return;
    }
  } catch (err) {
    console.warn("[onyx-hud/context-injector] herald.publish failed, falling back to HTTP:", err);
  }

  // Attempt 2: HTTP POST to gateway /herald
  const gatewayPort = process.env["GATEWAY_PORT"] ?? "3000";
  const res = await fetch(`http://localhost:${gatewayPort}/herald`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic: "screen-context", payload: ctx }),
  });

  if (!res.ok) {
    throw new Error(
      `[onyx-hud/context-injector] Gateway herald POST failed: ${res.status} ${res.statusText}`
    );
  }
  console.log("[onyx-hud/context-injector] Published via HTTP gateway herald");
}