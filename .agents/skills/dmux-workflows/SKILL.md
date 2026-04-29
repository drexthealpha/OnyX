---
name: dmux-workflows
description: Multi-agent orchestration using tmux with pane manager, parallel agent sessions, and divide-and-conquer patterns. Use when the user wants to run multiple agents in parallel or manage complex agent workflows.
origin: ECC
---

# Dmux Workflows

Multi-agent orchestration using tmux for parallel execution and workflow management.

## When to Activate

- Running multiple agents in parallel on independent tasks
- Managing complex workflows with dependencies
- Dividing large tasks into parallel subtasks
- Monitoring multiple agent sessions simultaneously

## Core Concepts

### Tmux Pane Manager
The pane manager splits a tmux session into multiple independent agent sessions, each running in its own context.

### Parallel Execution
Agents run simultaneously in separate panes, allowing independent work without context bleeding.

### Divide and Conquer
Large tasks are split into independent subtasks, processed in parallel, then merged.

## Setup Pattern

```bash
# Create session with multiple panes
tmux new-session -d -s onyx
tmux split-window -h
tmux split-window -v
tmux select-layout -t onyx tiled

# Send commands to each pane
tmux send-keys -t onyx:0.0 "bun run dev" C-m
tmux send-keys -t onyx:0.1 "bun test" C-m
```

## Workflow Patterns

### Pattern 1: Independent Tasks
```
Task: Write tests for 5 modules
Split into: 5 parallel agents, each writing tests for 1 module
Merge: Combine test files
```

### Pattern 2: Sequential Dependencies
```
Task: Research → Write → Review
Pane 1: Research agent
Pane 2: Write agent (depends on P1 output)
Pane 3: Review agent (depends on P2 output)
```

### Pattern 3: Review + Implement
```
Pane 1: Reading context (research existing code)
Pane 2: Implementation agent (writes new code)
Pane 3: Review agent (reviews both)
```

## Agent Communication

Agents communicate via shared files or named pipes:

```typescript
// Shared state file
await Bun.write('./tmp/pane1-output.json', JSON.stringify(result))
// Other panes read this file
```

## Monitoring

```bash
# Watch all panes
tmux list-windows
tmux list-panes -t onyx

# Send input to specific pane
tmux send-keys -t onyx:0.0 "command" C-m

# Capture pane output
tmux capture-pane -t onyx:0.0 -p
```

## Error Handling

- Each pane independently reports success/failure
- Use exit codes: 0 = success, non-zero = failure
- Master script waits for all panes and reportsaggregate status