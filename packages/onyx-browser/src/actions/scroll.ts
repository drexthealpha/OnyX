import { getTab } from "./state.js";

export async function scroll(
  tabId: string,
  direction: "up" | "down" | "left" | "right",
  pixels = 300
): Promise<void> {
  const page = getTab(tabId);
  if (!page) {
    throw new Error(`Tab not found: ${tabId}`);
  }

  const deltas: Record<string, [number, number]> = {
    up: [0, -pixels],
    down: [0, pixels],
    left: [-pixels, 0],
    right: [pixels, 0],
  };

  const [dx, dy] = deltas[direction] || [0, pixels];
  await page.mouse.wheel(dx, dy);
}