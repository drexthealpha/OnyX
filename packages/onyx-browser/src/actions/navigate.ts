import type { Snapshot } from "../types";
import { getTab } from "../state";
import { getSnapshot } from "./get-snapshot";

export async function navigate(tabId: string, url: string): Promise<Snapshot> {
  const page = getTab(tabId);
  if (!page) {
    throw new Error(`Tab not found: ${tabId}`);
  }
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  return getSnapshot(tabId);
}