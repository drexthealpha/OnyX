import type { Snapshot, Element } from "../types.js";
import { getTab, getRefMap, setRef } from "./state.js";

const INTERACTIVE_ROLES = [
  "button",
  "link",
  "textbox",
  "checkbox",
  "radio",
  "menuitem",
  "tab",
  "searchbox",
  "slider",
  "spinbutton",
  "switch",
];

interface AXNode {
  role: string;
  name?: string;
  children?: AXNode[];
  properties?: Array<{ name: string; value: unknown }>;
  value?: string;
}

export async function getSnapshot(tabId: string): Promise<Snapshot> {
  const page = getTab(tabId);
  if (!page) {
    throw new Error(`Tab not found: ${tabId}`);
  }

  const tree = await page.accessibility.snapshot() as AXNode | null;
  if (!tree) {
    return { tabId, elements: [], text: "" };
  }

  const elements: Element[] = [];
  const refMap = new Map<string, string>();
  let refCounter = 1;

  function walk(node: AXNode, parentSelector?: string): void {
    const role = node.role?.toLowerCase() || "";
    const name = node.name || "";

    const isInteractive = INTERACTIVE_ROLES.includes(role);
    let selector = parentSelector;

    if (isInteractive && name) {
      const ref = `e${refCounter++}`;
      selector = `[aria-label="${name}"], [title="${name}"], text=${name}`;

      elements.push({
        elementRef: ref,
        type: role,
        text: name,
        bounds: { x: 0, y: 0, w: 0, h: 0 },
      });

      refMap.set(ref, selector);
    }

    if (node.children) {
      for (const child of node.children) {
        walk(child, selector || parentSelector);
      }
    }
  }

  const textParts: string[] = [];
  function buildText(node: AXNode, depth = 0): void {
    const role = node.role?.toLowerCase() || "";
    const name = node.name || "";

    if (name) {
      const isInteractive = INTERACTIVE_ROLES.includes(role);
      if (isInteractive) {
        const idx = elements.findIndex(
          (e) => e.text === name && e.type === role
        );
        if (idx >= 0) {
          textParts.push(`[${role} e${idx + 1}] ${name}`);
        } else {
          textParts.push(`[${role}] ${name}`);
        }
      } else if (name.length < 100) {
        textParts.push(name);
      }
    }

    if (node.children) {
      for (const child of node.children) {
        buildText(child, depth + 1);
      }
    }
  }

  walk(tree);
  buildText(tree);

  for (const [ref, selector] of refMap) {
    setRef(tabId, ref, selector);
  }

  return {
    tabId,
    elements,
    text: textParts.slice(0, 500).join(" | "),
  };
}