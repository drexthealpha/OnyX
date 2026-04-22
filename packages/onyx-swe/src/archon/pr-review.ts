/**
 * pr-review.ts — Automated PR review pipeline.
 *
 * Inspired by Archon's archon-smart-pr-review: classify complexity →
 * run targeted review agents → synthesize findings → post results.
 */

import { Octokit } from '@octokit/rest';
import { reviewCode } from '../agent/reviewer.js';
import { adversarialTest } from './adversarial-loop.js';
import type { ReviewResult } from '../agent/reviewer.js';
import type { AdversarialResult } from '../types.js';

export interface PRReviewOptions {
  owner: string;
  repo: string;
  prNumber: number;
  runAdversarial?: boolean;
}

export interface PRReviewResult {
  review: ReviewResult;
  adversarial: AdversarialResult;
  summary: string;
  approved: boolean;
}

interface GitHubPRFile {
  filename: string;
  patch?: string;
  status: string;
}

interface GitHubPR {
  title: string;
  body: string | null;
  head: { ref: string };
}

/**
 * Fetch changed files from a GitHub PR.
 */
async function fetchPRFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number,
): Promise<Record<string, string>> {
  const { data: files } = await octokit.pulls.listFiles({
    owner,
    repo,
    pull_number: prNumber,
    per_page: 100,
  });

  const fileContents: Record<string, string> = {};

  for (const file of files as GitHubPRFile[]) {
    if (file.status !== 'removed' && file.patch) {
      fileContents[file.filename] = file.patch;
    }
  }

  return fileContents;
}

/**
 * Review a GitHub PR with adversarial testing and code review.
 *
 * @param options - PR review options
 * @returns Combined review result
 */
export async function reviewPR(options: PRReviewOptions): Promise<PRReviewResult> {
  const token = process.env['GITHUB_TOKEN'];
  if (!token) throw new Error('GITHUB_TOKEN environment variable is required');

  const { owner, repo, prNumber, runAdversarial = true } = options;
  const octokit = new Octokit({ auth: token });

  // Fetch PR info and changed files
  const { data: pr } = await octokit.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
  });

  const prData = pr as unknown as GitHubPR;
  const files = await fetchPRFiles(octokit, owner, repo, prNumber);

  // Build a StepResult-like structure for the reviewer
  const fakeStepResult = {
    success: true,
    files,
    testOutput: 'Reviewing PR changes (no test output available)',
  };

  // Run code review and adversarial test in parallel
  const [review, adversarial] = await Promise.all([
    reviewCode(fakeStepResult, {
      issueTitle: prData.title,
      stepDescription: prData.body ?? undefined,
    }),
    runAdversarial && Object.keys(files).length > 0
      ? adversarialTest(
          Object.entries(files)
            .map(([f, p]) => `// === ${f} ===\n${p}`)
            .join('\n\n'),
          `PR #${prNumber}: ${prData.title}`,
        )
      : Promise.resolve({ issues: [], passed: true }),
  ]);

  const approved =
    review.approved &&
    (adversarial.issues.length === 0 || adversarial.passed);

  const summary = [
    `## PR Review — ${prData.title}`,
    '',
    `**Code Review:** ${review.severity === 'none' ? '✅ Clean' : `⚠️ ${review.severity} issues`}`,
    `**Security:** ${adversarial.passed ? '✅ Clean' : `❌ ${adversarial.issues.length} issues`}`,
    `**Decision:** ${approved ? '✅ APPROVE' : '❌ REQUEST CHANGES'}`,
    '',
    review.summary,
  ].join('\n');

  // Post review as PR comment
  try {
    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: summary,
    });
  } catch {
    // Non-fatal — review result still returned
  }

  return { review, adversarial, summary, approved };
}