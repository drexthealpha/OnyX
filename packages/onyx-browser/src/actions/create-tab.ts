import { chromium, type Browser } from "playwright";
import type { Tab } from "../types";
import { setTab, getRefMap, getTabsMap, getAllTabs } from "../state";

let browserInstance: Browser | null = null;

export async function ensureBrowser() {
  if (!browserInstance) {
    browserInstance = await chromium.launch({ headless: true });
  }
  return browserInstance;
}

export function getBrowser() {
  return browserInstance;
}

export async function closeBrowser() {
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
  for (const [id, page] of getAllTabs()) {
    tabs.push({
      id,
      url: page.url(),
      title: await page.title().catch(() => ""),
    });
  }
  return tabs;
}

export function getAllPages() {
  return getTabsMap();
}