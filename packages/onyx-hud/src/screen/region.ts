// ─────────────────────────────────────────────
//  @onyx/hud — screen/region.ts
//  selectRegion() — shows crosshair cursor; user click-drags to select.
//  Returns { x, y, width, height } in screen coordinates.
// ─────────────────────────────────────────────

import { ipcMain } from "electron";
import type { Region } from "../types.js";
import { enableInteraction, disableInteraction, getOverlayWindow } from "../overlay.js";

export async function selectRegion(): Promise<Region> {
  const win = getOverlayWindow();
  if (!win || win.isDestroyed()) {
    throw new Error("[onyx-hud/region] Overlay window is not available");
  }

  enableInteraction();
  win.webContents.send("hud:start-region-select");

  return new Promise<Region>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("[onyx-hud/region] Region selection timed out after 60s"));
    }, 60_000);

    function cleanup() {
      clearTimeout(timeout);
      ipcMain.removeListener("hud:region-selected", onRegionSelected);
      ipcMain.removeListener("hud:region-cancelled", onCancelled);
      disableInteraction();
    }

    function onRegionSelected(_event: Electron.IpcMainEvent, region: Region) {
      cleanup();
      const normalised: Region = {
        x: region.width >= 0 ? region.x : region.x + region.width,
        y: region.height >= 0 ? region.y : region.y + region.height,
        width: Math.abs(region.width),
        height: Math.abs(region.height),
      };
      resolve(normalised);
    }

    function onCancelled() {
      cleanup();
      reject(new Error("[onyx-hud/region] Region selection was cancelled"));
    }

    ipcMain.once("hud:region-selected", onRegionSelected);
    ipcMain.once("hud:region-cancelled", onCancelled);
  });
}