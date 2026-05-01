import type { SearchResult } from "../types";
import { createClient } from "../client";

export async function searchGoogle(
  query: string,
  baseUrl = "http://localhost:9377"
): Promise<SearchResult[]> {
  try {
    const client = createClient(baseUrl);

    const tab = await client.createTab("https://www.google.com");
    const snapshot = await client.getSnapshot(tab.id);

    const searchBoxRef = snapshot.elements.find(
      (e) => e.type === "searchbox" || e.type === "textbox"
    )?.elementRef;

    if (!searchBoxRef) {
      await client.closeTab(tab.id);
      return [];
    }

    await client.type(tab.id, searchBoxRef, query, true);
    await new Promise((r) => setTimeout(r, 2000));

    const resultsSnap = await client.getSnapshot(tab.id);
    await client.closeTab(tab.id);

    const results: SearchResult[] = [];
    const linkRegex = /\[link e(\d+)\]\s*(.+?)(?:\s*[-–]\s*.+?)?(?:\s*https?:\/\/[^\s]+)?/gi;
    let match;

    while ((match = linkRegex.exec(resultsSnap.text)) !== null) {
      const title = match[2].trim();
      if (!title.toLowerCase().includes("ad") && title.length > 2) {
        results.push({
          title,
          url: "",
          snippet: "",
        });
      }
    }

    return results.slice(0, 10);
  } catch {
    return [];
  }
}
