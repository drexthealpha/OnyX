import { getTab, deleteTab } from "./state.js";

export async function closeTab(tabId: string): Promise<void> {
  const page = getTab(tabId);
  if (page) {
    await page.close();
    deleteTab(tabId);
  }
}