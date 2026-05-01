import type { Element } from "../types";
import { createClient } from "../client";

export interface ScrapeResult {
  url: string;
  title: string;
  text: string;
  elements: Element[];
  links: Array<{ text: string; url: string }>;
}

export async function scrape(
  url: string,
  baseUrl = "http://localhost:9377"
): Promise<ScrapeResult> {
  const client = createClient(baseUrl);
  const tab = await client.createTab(url);

  const snapshot = await client.getSnapshot(tab.id);
  await client.closeTab(tab.id);

  const links: Array<{ text: string; url: string }> = [];
  for (const el of snapshot.elements) {
    if (el.type === "link" && el.text.includes("http")) {
      links.push({ text: el.text, url: el.text });
    }
  }

  return {
    url,
    title: snapshot.elements[0]?.text || "",
    text: snapshot.text,
    elements: snapshot.elements,
    links: links.slice(0, 20),
  };
}
