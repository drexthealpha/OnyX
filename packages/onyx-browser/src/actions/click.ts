import { getTab, getRefMap } from "../state";

export async function click(tabId: string, elementRef: string): Promise<void> {
  const page = getTab(tabId);
  if (!page) {
    throw new Error(`Tab not found: ${tabId}`);
  }

  const refMap = getRefMap(tabId);
  const selector = refMap.get(elementRef);
  if (!selector) {
    const err = new Error(`Element reference not found: ${elementRef}`);
    (err as any).code = "stale_refs";
    throw err;
  }

  try {
    await page.click(selector);
  } catch {
    const loc = page.getByText(elementRef.replace("e", ""));
    await loc.click();
  }
}