---
name: agent-sort
description: Evidence-backed ECC install plan with DAILY vs LIBRARY buckets, repo-aware classification, and skill dependency graph. Use when organizing skills for a new ONYX agent session or maintaining the skills library.
origin: ECC
---

# Agent Sort

Systematic organization and maintenance of the ECC skills library.

## When to Activate

- Initializing a new agent session
- Organizing available skills
- Maintaining the skills library
- When skill dependencies are unclear

## The Two Buckets

### DAILY Skills
Skills used frequently in most sessions. These are your daily drivers.

| Skill | Use Frequency |
|-------|-------------|
| tdd-workflow | Every session |
| security-review | Every API/sensitive change |
| verification-loop | Every session |
| documentation-lookup | As needed |
| strategic-compact | Long sessions |

### LIBRARY Skills
Skills available but used less frequently. Organized by domain.

| Domain | Skills |
|--------|--------|
| Frontend | frontend-patterns, frontend-design, frontend-slides |
| Backend | backend-patterns, api-design, bun-runtime |
| Research | deep-research, exa-search, market-research |
| Content | content-engine, crosspost, x-api, video-editing |
| Testing | e2e-testing, eval-harness |
| Ops | documentation-lookup, agent-introspection-debugging |

## Skill Dependency Graph

```typescript
const skillGraph = {
  'tdd-workflow': {
    dependsOn: [],
    required: true,
  },
  'verification-loop': {
    dependsOn: ['tdd-workflow'],
    required: true,
  },
  'onyx-intel-brief': {
    dependsOn: ['backend-patterns', 'bun-runtime'],
    required: true,
  },
  'content-engine': {
    dependsOn: ['crosspost'],
    required: false,
  },
}
```

## Installation Planning

For a new session:

### Step 1: Analyze Requirements
What does the user need? List each capability.

### Step 2: Map to Skills
Which skills cover these capabilities?

### Step 3: Check Dependencies
What skills do these skills depend on?

### Step 4: Build Install Plan
Order skills by dependency.

```typescript
function buildInstallPlan(requirements: string[]): Skill[] {
  const needed = requirements.map(r => skillMap[r])
  return topologicalSort(needed)
}
```

## Skill Quality Checks

### Minimum Requirements
- [ ] Has frontmatter with name, description, origin
- [ ] Has When to Use section
- [ ] Has Examples section
- [ ] Word count > 200 (ECC) or > 400 (ONYX-specific)

### ONYX Additional
- [ ] Real ONYX architecture references
- [ ] Code examples with @onyx/* packages
- [ ] Env vars documented

## Maintenance

Quarterly review:
- [ ] Remove obsolete skills
- [ ] Update skill dependencies
- [ ] Verify all examples work
- [ ] Check word counts meet minimum