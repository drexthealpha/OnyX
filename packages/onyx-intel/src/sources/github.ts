// packages/onyx-intel/src/sources/github.ts
// GitHub repository search — no auth required for public repos (60 req/hr unauthenticated).
// URL: https://api.github.com/search/repositories?q={query}&sort=stars&per_page=10
// Returns top 10 repos sorted by star count.

import type { Source } from "../types.ts";

const BASE_URL = "https://api.github.com/search/repositories";

interface GithubRepo {
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  updated_at: string;
  topics: string[];
}

interface GithubSearchResponse {
  items: GithubRepo[];
}

/**
 * Search GitHub repositories by query.
 * Sorted by stars descending, top 10.
 * Uses GITHUB_TOKEN env var if present for higher rate limits.
 */
export async function search(query: string): Promise<Source[]> {
  const url = `${BASE_URL}?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=10`;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let data: GithubSearchResponse;
  try {
    const res = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      console.warn(`[github] HTTP ${res.status} for query "${query}"`);
      return [];
    }

    data = (await res.json()) as GithubSearchResponse;
  } catch (err) {
    console.warn(`[github] fetch error: ${(err as Error).message}`);
    return [];
  }

  const repos = data?.items ?? [];

  return repos.slice(0, 10).map((repo): Source => {
    const snippet = (repo.description ?? "")
      .slice(0, 200)
      .concat(
        repo.topics?.length
          ? ` [topics: ${repo.topics.slice(0, 5).join(", ")}]`
          : ""
      )
      .slice(0, 280);

    return {
      platform: "github",
      title: repo.full_name,
      url: repo.html_url,
      score: 0,
      snippet: snippet || repo.full_name,
      engagement: repo.stargazers_count ?? 0,
      publishedAt: repo.updated_at ? new Date(repo.updated_at).getTime() : undefined,
    };
  });
}