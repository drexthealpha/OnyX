/**
 * issues.ts — Fetches GitHub issues via the REST API.
 *
 * Parses owner/repo/number from any standard GitHub issue URL format.
 * Includes all comments for full context — Open SWE pattern: rich source
 * context assembled before any LLM call.
 */

import type { GitHubIssue } from '../types.js';

const GITHUB_API_BASE = 'https://api.github.com';

interface GitHubAPIIssue {
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  labels: Array<{ name: string }>;
  user: { login: string };
  created_at: string;
}

interface GitHubAPIComment {
  user: { login: string };
  body: string;
  created_at: string;
}

function parseIssueUrl(url: string): { owner: string; repo: string; number: number } {
  // Supports:
  //   https://github.com/owner/repo/issues/42
  //   https://github.com/owner/repo/pull/42
  const match = url.match(
    /https?:\/\/github\.com\/([^/]+)\/([^/]+)\/(?:issues|pull)\/(\d+)/,
  );

  if (!match) {
    throw new Error(
      `Invalid GitHub issue URL: ${url}. Expected format: https://github.com/owner/repo/issues/42`,
    );
  }

  return {
    owner: match[1]!,
    repo: match[2]!,
    number: parseInt(match[3]!, 10),
  };
}

async function githubFetch<T>(endpoint: string, token: string): Promise<T> {
  const response = await fetch(`${GITHUB_API_BASE}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'onyx-swe/0.1.0',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API error ${response.status} for ${endpoint}: ${body}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Fetch a GitHub issue including all comments.
 *
 * @param url - Full GitHub issue URL
 * @returns Complete issue data with comments
 *
 * Required env vars:
 *   GITHUB_TOKEN — user-provided personal access token or GitHub App token
 */
export async function fetchIssue(url: string): Promise<GitHubIssue> {
  const token = process.env['GITHUB_TOKEN'];
  if (!token) throw new Error('GITHUB_TOKEN environment variable is required');

  const { owner, repo, number } = parseIssueUrl(url);

  // Fetch issue and comments in parallel
  const [issue, comments] = await Promise.all([
    githubFetch<GitHubAPIIssue>(`/repos/${owner}/${repo}/issues/${number}`, token),
    githubFetch<GitHubAPIComment[]>(
      `/repos/${owner}/${repo}/issues/${number}/comments`,
      token,
    ),
  ]);

  return {
    number: issue.number,
    title: issue.title,
    body: issue.body ?? '',
    owner,
    repo,
    url: issue.html_url,
    labels: issue.labels.map((l) => l.name),
    author: issue.user.login,
    createdAt: issue.created_at,
    comments: comments.map((c) => ({
      author: c.user.login,
      body: c.body,
      createdAt: c.created_at,
    })),
  };
}