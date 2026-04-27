import { Page, Locator } from "playwright";

export const tabs = new Map<string, Page>();
export const refMaps = new Map<string, Map<string, string>>();

export function setTab(tabId: string, page: Page): void {
  tabs.set(tabId, page);
  refMaps.set(tabId, new Map());
}

export function getTab(tabId: string): Page | undefined {
  return tabs.get(tabId);
}

export function deleteTab(tabId: string): void {
  tabs.delete(tabId);
  refMaps.delete(tabId);
}

export function getRefMap(tabId: string): Map<string, string> {
  return refMaps.get(tabId) ?? new Map();
}

export function setRef(tabId: string, ref: string, selector: string): void {
  const map = refMaps.get(tabId);
  if (map) {
    map.set(ref, selector);
  }
}

export function getTabsCount(): number {
  return tabs.size;
}

export function getAllTabs(): Map<string, Page> {
  return tabs;
}

export function getTabsMap(): Map<string, Page> {
  return tabs;
}

export async function closeAllTabs(): Promise<void> {
  for (const page of tabs.values()) {
    await page.close();
  }
  tabs.clear();
  refMaps.clear();
}