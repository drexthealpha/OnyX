import { getTab } from "./state.js";

export async function screenshot(tabId: string): Promise<string> {
  const page = getTab(tabId);
  if (!page) {
    throw new Error(`Tab not found: ${tabId}`);
  }

  const buf = await page.screenshot({ type: "png" });
  return Buffer.from(buf).toString("base64");
}