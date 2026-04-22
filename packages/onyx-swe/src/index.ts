// @onyx/swe — Autonomous Software Engineering Agent
// L3 Compute layer — packages alongside onyx-compute and onyx-rl

// Core types
export type { Plan, PlanStep, StepResult, GitHubIssue, Sandbox } from './types.js';

// Agent
export { planFromIssue } from './agent/planner.js';
export { executeStep } from './agent/coder.js';
export { runTestSuite } from './agent/tester.js';
export { reviewCode } from './agent/reviewer.js';

// Sandbox
export { createSandbox } from './sandbox/docker.js';
export { WorkspaceManager } from './sandbox/workspace.js';

// GitHub
export { fetchIssue } from './github/issues.js';
export { createPR } from './github/pr.js';
export { postComment } from './github/comment.js';

// Archon-inspired adversarial loop
export { adversarialTest } from './archon/adversarial-loop.js';
export { featureToPR } from './archon/feature-to-pr.js';
export { reviewPR } from './archon/pr-review.js';

// Memory
export { storeBugPattern, getBugPatterns } from './memory/bug-patterns.js';