export interface Snapshot {
  tabId: string;
  elements: Array<{ elementRef: string; type: string; text: string; bounds: { x: number; y: number; w: number; h: number } }>;
  text: string;
}

export async function browserAction<T>(
  url: string,
  extractFn: (snapshot: Snapshot) => T,
): Promise<T> {
  // @ts-ignore
  const browser = await import('@onyx/browser');

  const tab = await browser.createTab(url);
  try {
    const snapshot = await browser.getSnapshot(tab.id) as Snapshot;
    return extractFn(snapshot);
  } finally {
    await browser.closeTab(tab.id).catch(() => {/* best-effort close */});
  }
}