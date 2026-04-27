import { getTab, getRefMap } from "./state";

export async function typeText(
  tabId: string,
  elementRef: string,
  text: string,
  pressEnter = false,
): Promise<void> {
  const page = getTab(tabId);
  if (!page) {
    throw new Error(`Tab not found: ${tabId}`);
  }

  const refMap = getRefMap(tabId);
  const selector = refMap.get(elementRef);
  if (!selector) {
    throw new Error(`Element reference not found: ${elementRef}`);
  }

  await page.fill(selector, text);
  if (pressEnter) {
    await page.press(selector, "Enter");
  }
}