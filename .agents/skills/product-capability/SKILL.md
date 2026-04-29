---
name: product-capability
description: PRD to implementation-ready capability plans with constraints, invariants, and interface definitions. Use when converting product requirements into developer-ready specifications.
origin: ECC
---

# Product Capability

Transform product requirements into implementation-ready technical specifications.

## When to Activate

- Converting PRD to technical plan
- Defining new feature scope
- Creating interface contracts
- Setting constraints and invariants
- Breaking down complex features

## PRD Analysis

### Step 1: Extract Core Value
What's the one thing this feature enables? Write it in one sentence.

### Step 2: Identify User Interactions
List all user actions this feature supports. Group by priority.

### Step 3: Define Success Metrics
How do you know if it works? Specific, measurable criteria.

## Capability Structure

```typescript
interface Capability {
  id: string
  name: string
  description: string
  priority: 'P0' | 'P1' | 'P2'
  constraints: Constraint[]
  invariants: Invariant[]
  interfaces: Interface[]
}

interface Constraint {
  type: 'performance' | 'privacy' | 'cost' | 'availability'
  value: string | number
  rationale: string
}

interface Invariant {
  description: string
  test: string  // How to verify
}

interface Interface {
  name: string
  params: Record<string, Type>
  returns: Type
}
```

## Implementation Plan Template

```markdown
## Capability: [Name]

### What It Enables
[One sentence on core value]

### User Flow
1. [User action]
2. [System response]
3. [User action]
4. [System response]

### Constraints
- Max latency: 100ms
- No PII storage
- < $0.01 per operation

### Invariants
- [Data integrity] — validated on read/write
- [Consistency] — eventual with 1s grace
- [Authorization] — verified per request

### Interfaces

#### [MethodName](params): Result
[Description]

### Tests
- [ ] Happy path works
- [ ] Edge cases handled
- [ ] Invariants verified
- [ ] Constraints enforced
```

## Example: Intel Brief Capability

```typescript
const intelCapability = {
  id: 'intel-brief',
  name: 'Multi-source Intelligence Brief',
  description: 'Aggregate 8 sources into ranked brief',
  priority: 'P0',
  constraints: [
    { type: 'performance', value: '<10s', rationale: 'User patience' },
    { type: 'cost', value: '<$0.10', rationale: 'Unit economics' }
  ],
  invariants: [
    { description: 'Score 0-1', test: 'score >= 0 && score <= 1' },
    { description: 'Sources present', test: 'sources.length >= 3' }
  ],
  interfaces: [
    { name: 'runIntel', params: { topic: 'string' }, returns: 'IntelBrief' }
  ]
}
```