// ─────────────────────────────────────────────
//  @onyx/hud — index.ts
//  Electron app entry point. Starts the HUD overlay.
// ─────────────────────────────────────────────

import { app, ipcMain } from "electron";
import { createOverlayWindow } from "./overlay.js";
import { injectScreenContext } from "./context-injector.js";
import { selectRegion } from "./screen/region.js";

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) { app.quit(); process.exit(0); }

app.disableHardwareAcceleration();

app.whenReady().then(() => {
  const win = createOverlayWindow();

  ipcMain.handle("hud:select-region", async () => {
    const region = await selectRegion();
    return region;
  });

  ipcMain.handle("hud:inject-context", async (_event, region) => {
    await injectScreenContext(region);
    return { ok: true };
  });

  ipcMain.on("hud:hide", () => { if (!win.isDestroyed()) win.hide(); });
  ipcMain.on("hud:show", () => { if (!win.isDestroyed()) win.show(); });

  app.on("activate", () => {
    if (!win || win.isDestroyed()) createOverlayWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

export { injectScreenContext } from "./context-injector.js";
export { capture } from "./screen/capture.js";
export { selectRegion } from "./screen/region.js";
export { getTokenUsage } from "./status/context-meter.js";
export { getActiveAgents } from "./status/agent-list.js";
export type { Region, HUDStatus, ScreenContext, TokenUsage } from "./types.js";