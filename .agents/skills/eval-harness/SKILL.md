---
name: eval-harness
description: Formal evaluation framework for Claude Code sessions implementing eval-driven development (EDD) principles.
origin: ECC
---

# Eval Harness Skill

A formal evaluation framework for ONYX agent sessions.

## When to Activate

- Setting up eval-driven development (EDD) for AI-assisted workflows
- Defining pass/fail criteria for Claude Code task completion
- Measuring agent reliability with pass@k metrics
- Creating regression test suites for prompt or agent changes

## Eval Types

### Capability Evals

```markdown
[CAPABILITY EVAL: onyx-intel-brief]
Task: Run runIntel('Solana') and return an IntelBrief
Success Criteria:
  - [ ] Returns topic = 'Solana'
  - [ ] score between 0 and 1
  - [ ] sources array has >= 3 entries
  - [ ] Completes in < 10s
```

### Regression Evals

```markdown
[REGRESSION EVAL: onyx-mem-crystals]
Baseline: S07
Tests:
  - crystal-store: PASS
  - crystal-retrieve: PASS
  - crystal-compress: PASS
Result: 3/3 passed
```

## Pass@K Metrics

Run the same eval K times. Report:
- pass@1 — single run success rate
- pass@3 — at least one success in 3 runs
- pass@5 — production reliability threshold

## Grader Templates

```bash
# Code-based grader
bun test packages/onyx-intel/src/tests/intel.test.ts && echo "PASS" || echo "FAIL"

# Word count grader (for skills)
wc -w .agents/skills/onyx-mem-capture/SKILL.md | awk '{print ($1 >= 400) ? "PASS" : "FAIL"}'

# File existence grader
[ -f .agents/skills/agent-discipline/CLAUDE.md ] && echo "PASS" || echo "FAIL"
```