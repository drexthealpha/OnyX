import { getTab, getRefMap } from "./state.js";

export async function typeText(
  tabId: string,
  elementRef: string,
  text: string,
  pressEnter = false
): Promise<void> {
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

  await page.click(selector);
  await page.keyboard.type(text);
  if (pressEnter) {
    await page.keyboard.press("Enter");
  }
}