---
name: agent-introspection-debugging
description: Structured self-debugging for agent failures — capture state, diagnose root cause, recover, and report. Use when the agent encounters errors, contradictions, or unexpected states.
origin: ECC
---

# Agent Introspection Debugging

Structured self-debugging methodology for Claude Code agents.

## When to Activate

- Agent encounters an error or failure
- Unexpected behavior or output
- Contradictions in context or code
- Any situation requiring recovery

## Debugging Workflow

### Step 1: Capture State
Document the current state at failure point:
- What was the task?
- What did you try?
- What happened instead?
- What error messages exist?

### Step 2: Diagnose Root Cause
Ask: Why did this fail? Trace back:
- Is it a code error? (syntax, type, runtime)
- Is it a context error? (wrong assumptions)
- Is it a tool error? (wrong tool for the job)
- Is it a specification error? (wrong requirements)

### Step 3: Recover
Fix the root cause, not the symptoms:
- If code: fix the code
- If context: update assumptions
- If tool: choose different tool
- If spec: clarify requirements

### Step 4: Report
What happened and what you did about it.

## Capture Template

```markdown
## Failure Capture

### Task
[What you were trying to do]

### Error
```
[Error message or unexpected output]
```

### Context
- File: [file path]
- Function: [function name]
- State: [relevant state]

### Attempted
1. [First attempt]
2. [Second attempt]
```

## Diagnosis Questions

1. **Is it a code error?**
   - Check error type: Syntax? Type? Reference?
   - Look at line numbers
   - Check imports

2. **Is it a context error?**
   - Did assumptions change?
   - Is state corrupted?
   - Are files missing?

3. **Is it a tool error?**
   - Is this the right tool?
   - Is the tool configured correctly?
   - Are parameters correct?

## Recovery Actions

```typescript
// Example recovery
try {
  const result = await runIntel(topic)
} catch (err) {
  // Diagnose
  if (err.message.includes('API')) {
    // Fix: Check env var
    const apiKey = Bun.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set')
  }
  // Recover
  throw new Error(`Intel failed: ${err.message}`)
}
```

## Report Template

```markdown
## Debug Report

### Issue
[Brief description]

### Root Cause
[What actually went wrong]

### Fix Applied
[What you changed]

### Verification
[How you verified it works]

### Prevention
[How to avoid this in future]
```