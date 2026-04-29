---
name: agent-discipline
description: Agent discipline guide synthesizing Karpathy's 4 laws for LLM coding. How to avoid drift, speculation, and overcomplication in ONYX agent sessions.
origin: ONYX+Karpathy
---

# ONYX Agent Discipline

Discipline is critical for long-running agentic sessions. Without it, agents drift into context bloat, speculative features, and orthogonal edits that never complete. This skill synthesizes Andrej Karpathy's 4 laws of LLM coding into an actionable discipline framework for ONYX.

## Why Discipline Matters

In ONYX sessions spanning hours or days, the agent maintains context across dozens of files and hundreds of messages. Without discipline:

- **Context bloat**: The agent forgets the original goal, re-explaining what it already knows
- **Speculative features**: Building features the session spec never requested
- **Orthogonal edits**: Fixing unrelated issues found incidentally, accumulating technical debt
- **Infinite refinement**: Adding "just one more thing" indefinitely

The 4 laws prevent these failure modes.

## Law 1: Never Write Code You Haven't Read

Before writing any implementation, read the existing codebase.

**ONYX-specific application**:

- Reading types.ts and index.ts of any @onyx/* dependency before use
- Understanding the existing package structure before adding files
- Checking if a similar function already exists

**Violation signal**: Writing an import for a function that doesn't exist, or implementing something that already exists elsewhere.

**Recovery**: Stop, search the codebase for existing implementations, use them. Ask the operator if unsure.

## Law 2: Prefer Simple, Explicit, Boring Code

The goal is working ONYX code, not clever code.

**ONYX-specific application**:

- No abstractions for single-use patterns in packages
- No "flexibility" beyond what the session spec requires
- Matching the style of the surrounding package
- Using existing @onyx/* packages instead of new dependencies

**Violation signal**: Creating a new class/interface/utility that nothing in the session spec requested. Over-engineering.

**Recovery**: Delete the abstraction. Write the simple version. Stick to the package's established patterns.

## Law 3: Test Every Change Before Moving On

After every meaningful implementation step, verify it works.

**ONYX-specific application**:

- Running bun test in the affected package after each file
- Fixing test failures before proceeding to the next file
- Never marking a task complete without tests passing

**Violation signal**: Writing 5 files in sequence without running tests between them, or writing zero tests.

**Recovery**: Run bun test immediately. Fix failures. Only proceed when tests pass.

## Law 4: When in Doubt, Ask — Don't Assume

Surface questions instead of guessing.

**ONYX-specific application**:

- Asking when the session spec is ambiguous about an interface
- Asking when an existing file contradicts expectations
- Asking when about to create a file that might exist elsewhere
- Asking when uncertain why a prior session made an architectural choice

**Violation signal**: Silently picking an interpretation and running with it. Making assumptions without acknowledging them.

**Recovery**: Stop. State the uncertainty. Propose an assumption if necessary, but get confirmation first. "I'm uncertain about X — should I Y or Z?"

## Recognizing Drift

The agent is drifting when:

- Re-explaining concepts it explained 10 messages ago
- Adding features not in the session spec
- Making architectural changes without permission
- Writing tests AFTER implementing (violates Law 3)
- Not running bun test after completing a file

## Pre-Task Checklist

Before starting work:

- [ ] Read the session spec and understand the goal
- [ ] Read existing package structure if modifying existing code
- [ ] Identify the files to modify
- [ ] Confirm no existing implementations overlap

## Post-Task Checklist

After completing work:

- [ ] All bun tests pass
- [ ] Build passes
- [ ] ONYX_STATE.md updated
- [ ] No features added beyond session spec

## How to Surface Confusion

When confused, say exactly this:

> "I'm uncertain about [X]. My options are [Y] and [Z]. Which should I proceed with?"

Or if confident enough to proceed with an assumption:

> "I'm uncertain about [X]. I'll proceed with [assumption Y] because [reason Z]. If this is wrong, please correct me."

Never: "I'll just do X and hope that's right."