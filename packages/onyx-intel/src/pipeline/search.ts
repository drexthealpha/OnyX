// packages/onyx-intel/src/pipeline/search.ts
// Runs all 8 sources in parallel via Promise.allSettled.
// Merges, deduplicates, and scores results.

import type { Source } from "../types.ts";
import { search as searchReddit } from "../sources/reddit.ts";
import { search as searchHN } from "../sources/hn.ts";
import { search as searchGitHub } from "../sources/github.ts";
import { search as searchPolymarket } from "../sources/polymarket.ts";
import { search as searchTwitter } from "../sources/x-twitter.ts";
import { search as searchYouTube } from "../sources/youtube.ts";
import { search as searchBluesky } from "../sources/bluesky.ts";
import { search as searchWeb } from "../sources/web.ts";
import { deduplicateSources } from "./dedupe.ts";
import { scoreAndSort } from "./score.ts";

type SourceFn = (query: string) => Promise<Source[]>;

const ALL_SOURCES: Array<{ name: string; fn: SourceFn }> = [
  { name: "reddit", fn: searchReddit },
  { name: "hn", fn: searchHN },
  { name: "github", fn: searchGitHub },
  { name: "polymarket", fn: searchPolymarket },
  { name: "x-twitter", fn: searchTwitter },
  { name: "youtube", fn: searchYouTube },
  { name: "bluesky", fn: searchBluesky },
  { name: "web", fn: searchWeb },
];

/**
 * Run all 8 sources in parallel.
 * Failed sources are logged and skipped — no single failure blocks the pipeline.
 * Returns merged, deduplicated, scored array sorted by score descending.
 */
export async function runAllSources(topic: string): Promise<Source[]> {
  const results = await Promise.allSettled(
    ALL_SOURCES.map(({ name, fn }) =>
      fn(topic).catch((err: Error) => {
        console.warn(`[pipeline/search] source "${name}" failed: ${err.message}`);
        return [] as Source[];
      })
    )
  );

  // Collect fulfilled results
  const raw: Source[] = [];
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const sourceName = ALL_SOURCES[i].name;
    if (result.status === "fulfilled") {
      raw.push(...result.value);
    } else {
      console.warn(`[pipeline/search] "${sourceName}" rejected: ${result.reason}`);
    }
  }

  console.log(`[pipeline/search] ${raw.length} raw sources before dedup`);

  // Deduplicate by URL and near-duplicate snippet similarity
  const deduped = deduplicateSources(raw);
  console.log(`[pipeline/search] ${deduped.length} sources after dedup`);

  // Score and sort
  const scored = scoreAndSort(deduped, topic);
  return scored;
}