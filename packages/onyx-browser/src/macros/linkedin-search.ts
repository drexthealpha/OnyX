import type { SearchResult } from "../types.ts";
import { createClient } from "../client.ts";

export async function searchLinkedIn(
  query: string,
  baseUrl = "http://localhost:9377"
): Promise<SearchResult[]> {
  try {
    const client = createClient(baseUrl);
    const tab = await client.createTab();

    const url = `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(query)}`;
    const snapshot = await client.navigate(tab.id, url);

    await new Promise((r) => setTimeout(r, 2000));
    await client.closeTab(tab.id);

    const results: SearchResult[] = [];
    const linkRegex = /\[link e(\d+)\]\s*(.+?)(?:\s*[-–]\s*.+?)?/gi;
    let match;

    while ((match = linkRegex.exec(snapshot.text)) !== null) {
      const title = match[2].trim();
      if (title.length > 2) {
        results.push({ title, url: "", snippet: "" });
      }
    }

    return results.slice(0, 10);
  } catch {
    return [];
  }
}
