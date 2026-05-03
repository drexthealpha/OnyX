// ─────────────────────────────────────────────
//  @onyx/hud — overlay.ts
//  Creates the transparent, always-on-top, full-screen HUD BrowserWindow.
//  Based on OpenScreen createHudOverlayWindow() pattern.
// ─────────────────────────────────────────────

import path from "node:path";
import { fileURLToPath } from "node:url";
import { BrowserWindow, screen } from "electron";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const RENDERER_DIST = path.join(APP_ROOT, "dist");

let overlayWindow: BrowserWindow | null = null;

export function createOverlayWindow(): BrowserWindow {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { bounds } = primaryDisplay;

  const win = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    transparent: true,
    alwaysOnTop: true,
    frame: false,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
    },
  });

  if (process.platform === "darwin") {
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    win.setAlwaysOnTop(true, "screen-saver");
  } else {
    win.setAlwaysOnTop(true, "pop-up-menu");
  }

  win.webContents.on("did-finish-load", () => {
    win.setIgnoreMouseEvents(true, { forward: true });
    win.webContents.send("hud:ready", {
      displayBounds: bounds,
      platform: process.platform,
    });
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(`${VITE_DEV_SERVER_URL}?windowType=hud-overlay`);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"), {
      query: { windowType: "hud-overlay" },
    });
  }

  overlayWindow = win;
  win.on("closed", () => { if (overlayWindow === win) overlayWindow = null; });
  return win;
}

export function getOverlayWindow(): BrowserWindow | null { return overlayWindow; }

export function enableInteraction(): void {
  overlayWindow?.setIgnoreMouseEvents(false);
}

export function disableInteraction(): void {
  overlayWindow?.setIgnoreMouseEvents(true, { forward: true });
}