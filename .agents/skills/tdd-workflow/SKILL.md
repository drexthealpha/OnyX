---
name: tdd-workflow
description: Use this skill when writing new features, fixing bugs, or refactoring code. Enforces test-driven development with 80%+ coverage including unit, integration, and E2E tests.
origin: ECC
---

# Test-Driven Development Workflow

## When to Activate

- Writing new features or functionality
- Fixing bugs or issues
- Refactoring existing code
- Adding API endpoints
- Creating new components

## Core Principles

### 1. Tests BEFORE Code
ALWAYS write tests first, then implement code to make tests pass.

### 2. Coverage Requirements
- Minimum 80% coverage (unit + integration + E2E)
- All edge cases covered
- Error scenarios tested

### 3. Test Types

**Unit Tests** — Individual functions and utilities, pure functions, helpers.

**Integration Tests** — API endpoints, database operations, service interactions.

**E2E Tests (Playwright)** — Critical user flows, complete workflows, browser automation.

## TDD Workflow Steps

### Step 1: Write User Journeys
```
As a [role], I want to [action], so that [benefit]
```

### Step 2: Generate Test Cases
```typescript
describe('Intel Brief', () => {
  it('returns brief for valid topic', async () => { /* ... */ })
  it('handles empty topic gracefully', async () => { /* ... */ })
  it('respects TTL cache on repeated calls', async () => { /* ... */ })
  it('scores sources correctly', async () => { /* ... */ })
})
```

### Step 3: RED — Run Tests First
Verify tests fail before writing implementation.

### Step 4: GREEN — Minimum Code
Write only enough code to pass the current test.

### Step 5: REFACTOR
After all tests pass, clean up duplication and improve structure. Never refactor while RED.

## Bun Test Integration

```bash
bun test
bun test --watch
bun test --coverage
```

```typescript
import { expect, test, describe } from "bun:test";

describe('onyx-intel', () => {
  test('runIntel returns IntelBrief', async () => {
    const result = await runIntel('Solana DeFi')
    expect(result.topic).toBe('Solana DeFi')
    expect(result.score).toBeGreaterThan(0)
  })
})
```