/**
 * pr.ts — Creates GitHub Pull Requests via @octokit/rest.
 *
 * Follows Open SWE's commit_and_open_pr pattern: push branch then open draft PR.
 * Returns PR URL for linking back in Linear/Slack comments.
 */

import { Octokit } from '@octokit/rest';
import type { PRInfo } from '../types.js';

export interface CreatePROptions {
  owner: string;
  repo: string;
  branch: string;
  title: string;
  body: string;
  files: Record<string, string>;
  draft?: boolean;
  baseBranch?: string;
}

/**
 * Commit files and open a Pull Request on GitHub.
 *
 * @param options - PR creation options
 * @returns PRInfo with URL and PR number
 *
 * Required env vars:
 *   GITHUB_TOKEN — user-provided GitHub personal access token
 *
 * Note: This function creates/updates files via the GitHub Contents API.
 * For large changesets, prefer pushing from the sandbox via git directly,
 * then calling this function with an empty files map to just open the PR.
 */
export async function createPR(options: CreatePROptions): Promise<string> {
  const token = process.env['GITHUB_TOKEN'];
  if (!token) throw new Error('GITHUB_TOKEN environment variable is required');

  const {
    owner,
    repo,
    branch,
    title,
    body,
    files,
    draft = true,
    baseBranch = 'main',
  } = options;

  const octokit = new Octokit({ auth: token });

  // Get the SHA of the base branch to create our branch from
  let baseSha: string;
  try {
    const { data: ref } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${baseBranch}`,
    });
    baseSha = ref.object.sha;
  } catch {
    // Fallback to 'master' if 'main' doesn't exist
    const { data: ref } = await octokit.git.getRef({
      owner,
      repo,
      ref: 'heads/master',
    });
    baseSha = ref.object.sha;
  }

  // Create branch if it doesn't exist
  try {
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branch}`,
      sha: baseSha,
    });
  } catch (err) {
    // Branch may already exist — that's fine
    const msg = String(err);
    if (!msg.includes('already exists') && !msg.includes('422')) {
      throw err;
    }
  }

  // Commit files via Contents API if provided
  if (Object.keys(files).length > 0) {
    for (const [filePath, content] of Object.entries(files)) {
      // Get existing file SHA if it exists (required for updates)
      let existingSha: string | undefined;
      try {
        const { data: existing } = await octokit.repos.getContent({
          owner,
          repo,
          path: filePath,
          ref: branch,
        });
        if ('sha' in existing) {
          existingSha = existing.sha;
        }
      } catch {
        // File doesn't exist yet — create it
      }

      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: filePath,
        message: `feat(onyx-swe): implement ${filePath}`,
        content: Buffer.from(content, 'utf8').toString('base64'),
        branch,
        sha: existingSha,
      });
    }
  }

  // Open the Pull Request
  const { data: pr } = await octokit.pulls.create({
    owner,
    repo,
    title,
    body,
    head: branch,
    base: baseBranch,
    draft,
  });

  return pr.html_url;
}

/**
 * Get info about an existing PR by branch name.
 */
export async function getPRByBranch(
  owner: string,
  repo: string,
  branch: string,
): Promise<PRInfo | null> {
  const token = process.env['GITHUB_TOKEN'];
  if (!token) throw new Error('GITHUB_TOKEN environment variable is required');

  const octokit = new Octokit({ auth: token });

  const { data: prs } = await octokit.pulls.list({
    owner,
    repo,
    head: `${owner}:${branch}`,
    state: 'open',
  });

  if (prs.length === 0) return null;
  const pr = prs[0]!;

  return {
    url: pr.html_url,
    number: pr.number,
    branch: pr.head.ref,
  };
}