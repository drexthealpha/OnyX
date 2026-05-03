import type { Snapshot, Element } from "../types";
import { getTab, getRefMap, setRef } from "../state";

export async function getSnapshot(tabId: string): Promise<Snapshot> {
  const page = getTab(tabId);
  if (!page) {
    throw new Error(`Tab not found: ${tabId}`);
  }

  const html = await page.content();
  const elements: Element[] = [];

  const selector = 'a[href], button, input, select, textarea, [role="button"]';
  const handles = await page.locator(selector).all();

  for (let i = 0; i < handles.length; i++) {
    const handle = handles[i];
    const box = await handle.boundingBox().catch(() => null);
    if (!box) continue;

    const text = await handle.textContent().catch(() => "").then((t: string | null) => t?.trim() || "");
    const role = await handle.getAttribute("role").catch(() => null);
    const ref = `el-${tabId}-${i}`;

    setRef(tabId, ref, selector);

    elements.push({
      elementRef: ref,
      type: role || "element",
      text,
      bounds: { x: box.x, y: box.y, w: box.width, h: box.height },
    });
  }

  return {
    tabId,
    elements,
    text: html.slice(0, 5000),
  };
}