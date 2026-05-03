import { getTab } from "../state";

export async function scroll(
  tabId: string,
  direction: "up" | "down" | "left" | "right",
  pixels = 500,
): Promise<void> {
  const page = getTab(tabId);
  if (!page) {
    throw new Error(`Tab not found: ${tabId}`);
  }

  const dx = direction === "left" ? -pixels : direction === "right" ? pixels : 0;
  const dy = direction === "up" ? -pixels : direction === "down" ? pixels : 0;
  await page.mouse.wheel(dx, dy);
}