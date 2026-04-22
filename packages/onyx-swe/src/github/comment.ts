/**
 * comment.ts — Posts comments on GitHub issues and PRs.
 *
 * Used for status updates during long-running tasks, similar to Open SWE's
 * pattern of reacting with 👀 on receipt, then posting results when done.
 */

import { Octokit } from '@octokit/rest';

export interface CommentOptions {
  owner: string;
  repo: string;
  issueNumber: number;
  body: string;
}

/**
 * Post a comment on a GitHub issue or PR.
 *
 * @param options - Comment options
 * @returns The URL of the created comment
 */
export async function postComment(options: CommentOptions): Promise<string> {
  const token = process.env['GITHUB_TOKEN'];
  if (!token) throw new Error('GITHUB_TOKEN environment variable is required');

  const { owner, repo, issueNumber, body } = options;
  const octokit = new Octokit({ auth: token });

  const { data: comment } = await octokit.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body,
  });

  return comment.html_url;
}

/**
 * Post a status update with standard ONYX SWE formatting.
 */
export async function postStatusUpdate(
  owner: string,
  repo: string,
  issueNumber: number,
  status: 'started' | 'planning' | 'coding' | 'testing' | 'reviewing' | 'done' | 'failed',
  details?: string,
): Promise<string> {
  const statusEmoji: Record<string, string> = {
    started: '👀',
    planning: '📋',
    coding: '⌨️',
    testing: '🧪',
    reviewing: '🔍',
    done: '✅',
    failed: '❌',
  };

  const emoji = statusEmoji[status] ?? '🤖';
  const bodyLines = [`${emoji} **ONYX SWE Agent** — ${status.toUpperCase()}`];
  if (details) bodyLines.push('', details);
  bodyLines.push('', `_Powered by [@onyx/swe](https://github.com/onyx-ai/onyx)_`);

  return postComment({ owner, repo, issueNumber, body: bodyLines.join('\n') });
}

/**
 * React to an issue with an emoji (e.g. 👀 to acknowledge).
 */
export async function addReaction(
  owner: string,
  repo: string,
  issueNumber: number,
  reaction:
    | '+1'
    | '-1'
    | 'laugh'
    | 'confused'
    | 'heart'
    | 'hooray'
    | 'rocket'
    | 'eyes',
): Promise<void> {
  const token = process.env['GITHUB_TOKEN'];
  if (!token) throw new Error('GITHUB_TOKEN environment variable is required');

  const octokit = new Octokit({ auth: token });

  await octokit.reactions.createForIssue({
    owner,
    repo,
    issue_number: issueNumber,
    content: reaction,
  });
}