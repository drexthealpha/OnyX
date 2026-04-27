import { getTab, deleteTab } from "./state";

export async function closeTab(tabId: string): Promise<void> {
  const page = getTab(tabId);
  if (!page) {
    throw new Error(`Tab not found: ${tabId}`);
  }
  await page.close();
  deleteTab(tabId);
}