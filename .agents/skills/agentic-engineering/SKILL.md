---
name: agentic-engineering
description: From vibe coding to agentic engineering. Command → Agent → Skill orchestration patterns, subagent design, hooks, memory, and session management for production Claude Code workflows.
origin: shanraisshan+ONYX
---

# Agentic Engineering

The shift from vibe coding to agentic engineering is the difference between hoping things work and engineering them to work. This skill covers the primitives, patterns, and workflows that make Claude Code reliable for production ONYX work.

## The Shift: Vibe Coding vs Agentic Engineering

Vibe coding: prompt the model, hope it works, move on.

Agentic engineering: define the spec, orchestrate the agents, verify at each step, ship with confidence.

Vibe coding fails in production because there's no structure to debug, no verification at boundaries, and no recovery when things go wrong.

## Core Primitives

### Skills

Skills are knowledge injected into the model's context. They're auto-discoverable and configurable.

```yaml
# skill manifest
name: tdd-workflow
description: Test-driven development for ONYX packages
user-invocable: false   # background knowledge, not for direct invocation
model: sonnet           # model override if needed
context: fork          # isolate in subagent if heavy
```

Skills with `user-invocable: false` provide background knowledge the agent uses automatically. Skills with `user-invocable: true` can be invoked directly.

### Commands

Commands are user-invoked entry points that orchestrate workflows:

```markdown
# .claude/commands/intel-brief.md

# Run ONYX Intel Brief

I need an intelligence brief on [topic].

This command:
1. Runs @onyx/intel runIntel() on the topic
2. Scores sources via the scoring algorithm
3. Stores result as a crystal in @onyx/mem

Respond with the topic you want researched.
```

Commands orchestrate agents and skills into workflows.

### Agents

Agents are autonomous actors in isolated contexts:

```yaml
# .claude/agents/intel-agent.md

name: ONYX Intel Agent
description: Runs multi-source intelligence for ONYX

model: sonnet
tools:
  - run_intel
  - search_mem

context:
  - Read ONYX_STATE.md to understand current state
  - Use onyx-intel-brief skill for intelligence methodology
  - Use onyx-mem-capture for storing results

output:
  - Store intel result as crystal
  - Update session notes with findings
```

Agents get fresh contexts, custom tools, and specific instructions.

### Hooks

Hooks are event-driven scripts that run at boundaries:

- PreToolUse: Validate inputs before tool calls
- PostToolUse: Log outcomes, update state
- Stop: Handle interruption gracefully

Never block on non-critical errors in hooks — log and continue.

## Command → Agent → Skill Pattern

The fundamental orchestration pattern:

```
/intel-brief (Command)
  → intel-agent (Agent)
    → onyx-intel-brief (Skill)
      → @onyx/intel runIntel()
    → onyx-mem-capture (Skill)
      → @onyx/mem onSessionEnd()
```

Each level delegates to the next, passing context forward.

## Subagent Design Rules

### Rule 1: Fresh Context

Each subagent gets a fresh context. No memory bleed from the parent session.

### Rule 2: Explicit Context

Pass all needed context explicitly:

```typescript
const subagentPrompt = `
You are implementing @onyx/intel.

Current package state:
- types.ts has: IntelBrief, Source interfaces
- Sources implemented: twitterSearch, redditScan
- NOT implemented: coingecko, defillama

Your task: Add coingecko source integration.
`
```

### Rule 3: Worktree Isolation

For parallel file-editing, use git worktrees:

```bash
git worktree add -b feature/intel-sources ../feature-intel-sources
```

### Rule 4: Small and Focused

Prefer multiple small agents over one monolithic agent. Too many responsibilities in one agent leads to context loss and poor performance.

## Session Management

### Phase 1: Plan

Start with plan mode. Read files. Understand the current state. Write a plan.

### Phase 2: Execute

Implement one piece at a time. Run tests after each piece.

### Phase 3: Verify

After all implementation, run the full verification loop: build → typecheck → test.

### Phase 4: Compact

At logical boundaries, compact context for the next phase:

```markdown
## Context Snapshot: Research → Implementation

### Completed
- [x] Identified sources for @onyx/intel
- [x] Designed types.ts interface

### Next
- Implement twitterSearch source
- Implement redditScan source
- Add scoring algorithm
```

### Phase 5: Ship

Update ONYX_STATE.md with session notes. Document what was built. Document what should happen next.

## Common Patterns

### Pattern 1: Research → Plan → Execute → Verify → Ship

The fundamental production workflow.

### Pattern 2: TDD

Test first, then implement. Works at any scale.

### Pattern 3: Parallel Agents

Multiple agents in separate worktrees, then merge.

### Pattern 4: Scheduled Tasks

Daily intel briefs, crystal maintenance — scheduled workflows.

## ONYX-Specific Orchestration Example

Running an intel session:

```
1. Plan
   - Read existing @onyx/intel types.ts
   - Read existing source implementations
   - Design: 8-source integration

2. Test first
   - Write intel.test.ts with all test cases RED
   - Run bun test → failures expected

3. Implement
   - Add types to types.ts
   - Add source runners
   - Add scoring algorithm
   - Add Hono routes

4. Verify
   - bun test → all GREEN
   - bun run build → passes
   - curl localhost:3003/health → ok

5. Update
   - ONYX_STATE.md notes for S35
   - Document @onyx/intel capabilities
```

## No Additional Configuration

Agentic engineering uses the primitives built into Claude Code. No external configuration required beyond the skill definitions themselves.