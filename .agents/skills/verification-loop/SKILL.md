---
name: verification-loop
description: A comprehensive verification system for Claude Code sessions — build, type-check, lint, test before marking any task complete.
origin: ECC
---

# Verification Loop Skill

## When to Use

- After completing a feature or significant code change
- Before marking any ONYX session task complete
- After refactoring
- Before updating ONYX_STATE.md

## Verification Phases

### Phase 1: Build

```bash
bun run build 2>&1 | tail -20
```

If build fails, STOP and fix before continuing.

### Phase 2: Type Check

```bash
bunx tsc --noEmit 2>&1 | head -30
```

### Phase 3: Lint

```bash
bunx eslint src/ 2>&1 | head -30
```

### Phase 4: Test Suite

```bash
bun test --coverage 2>&1 | tail -50
```

Target: all tests pass, no regressions from previous session.

### Phase 5: Integration Check

```bash
# Verify Hono server starts
bun src/index.ts &
sleep 2
curl http://localhost:${PORT}/health | jq .
kill %1
```

## Session Complete Checklist

```markdown
- [ ] Build passes
- [ ] Zero TypeScript errors
- [ ] All existing tests pass
- [ ] New tests written for new code
- [ ] ONYX_STATE.md updated
- [ ] Skills written if session adds user-facing capabilities
```