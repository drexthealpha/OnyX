import { chromium, Browser, Page } from "playwright";
import type { Tab } from "../types.js";
import { setTab, getRefMap } from "./state.js";

let browserInstance: Browser | null = null;

export async function ensureBrowser(): Promise<Browser> {
  if (!browserInstance) {
    browserInstance = await chromium.launch({ headless: true });
  }
  return browserInstance;
}

export function getBrowser(): Browser | null {
  return browserInstance;
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

export async function createTab(url?: string): Promise<Tab> {
  const browser = await ensureBrowser();
  const page = await browser.newPage();
  const tabId = crypto.randomUUID();

  if (url) {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  }

  const tab: Tab = {
    id: tabId,
    url: url || "about:blank",
    title: await page.title().catch(() => ""),
  };

  setTab(tabId, page);
  return tab;
}

export async function listTabs(): Promise<Tab[]> {
  const tabs: Tab[] = [];
  for (const [id, page] of getAllPages()) {
    tabs.push({
      id,
      url: page.url(),
      title: await page.title().catch(() => ""),
    });
  }
  return tabs;
}

export function getAllPages(): Map<string, Page> {
  return getTabsMap();
}

import { getTabsMap } from "./state.js";