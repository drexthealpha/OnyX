---
name: strategic-compact
description: Manual context compaction at logical intervals to preserve context across task phases. Use when working on multi-step tasks where context drift or token limits are a concern.
origin: ECC
---

# Strategic Compaction

Manual context management to maintain clarity across complex, multi-phase tasks.

## When to Activate

- Multi-step tasks with distinct phases
- Long conversations (>20 messages)
- Tasks that span research → implementation → testing
- When context is getting noisy or drifting

## The Problem

LLMs lose track of original goals as context grows. Details get buried. The model drifts.

## The Solution: Periodic Compaction

### When to Compact
- After completing a major phase (research → plan → implement → test)
- Every 15-20 messages
- When you notice repetition or drift

### Compaction Pattern

```markdown
## Context Snapshot: [Phase]

### Original Goal
[One sentence]

### Completed
- [x] Task 1
- [x] Task 2
- [x] Task 3

### In Progress
- [ ] Current task

### Remaining
- [ ] Next task
- [ ] Final task

### Key Decisions Made
- [Decision 1]: [Rationale]
- [Decision 2]: [Rationale]
```

## Phase Checkpoints

### Phase 1: Research
Compact before moving to implementation.
```
## Research Complete
- [x] Understood ONYX structure
- [x] Identified @onyx/intel package
- [x] Found related packages

Next: Implementation
```

### Phase 2: Implementation
Compact before testing.
```
## Implementation Complete
- [x] Types defined
- [x] Hono routes created
- [x] Cache integrated

Next: Testing
```

### Phase 3: Testing
Compact before final verification.

## Session Summary

At session end, always provide summary:

```
## Session Summary

### Accomplished
- [x] Built @onyx/intel runIntel() function
- [x] Integrated 8 sources
- [x] Added TTL cache

### Key Decisions
- Used bun:sqlite for cache (not Redis) — simpler, no external dep
- Weighted scoring: CoinGecko + DeFiLlama 40% — most reliable

### Next Steps
- [ ] Add SSE streaming
- [ ] Add more sources
- [ ] Performance testing
```

## When NOT to Compact

- Simple single-turn tasks
- Quick questions or clarifications
- Tasks that complete in one response