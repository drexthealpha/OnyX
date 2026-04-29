---
name: coding-standards
description: Baseline cross-project coding conventions for naming, readability, immutability, and code-quality review across all ONYX packages.
origin: ECC
---

# Coding Standards

Baseline coding conventions for all ONYX packages. TypeScript strict mode throughout.

## When to Activate

- Starting a new package or module
- Reviewing code for quality and maintainability
- Refactoring existing code
- Enforcing naming, formatting, or structural consistency

## Core Principles

### 1. Readability First
Code is read more than written. Clear names. Self-documenting code preferred over comments. Consistent formatting.

### 2. KISS
Simplest solution that works. Avoid over-engineering. No premature optimization.

### 3. DRY
Extract common logic into functions. Create reusable utilities. Avoid copy-paste.

### 4. YAGNI
Don't build features before they're needed.

## Naming Conventions

```typescript
// Variables and functions: camelCase
const intelBrief = await runIntel(topic)

// Types and interfaces: PascalCase
interface IntelBrief { topic: string; score: number }

// Constants: SCREAMING_SNAKE_CASE
const DEFAULT_TTL_SECONDS = 3600

// Files: kebab-case
// intel-brief.ts, run-intel.ts, types.ts

// Packages: @onyx/kebab-case
// @onyx/intel, @onyx/mem, @onyx/browser
```

## TypeScript Requirements

```typescript
// Always: strict mode in tsconfig
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}

// Never: any (use unknown + type narrowing)
// Never: non-null assertion (!) without comment explaining why
// Always: explicit return types on exported functions
```

## Error Handling

```typescript
// Structured errors — never raw throws in service boundaries
class OnyxError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'OnyxError'
  }
}

// Async: always try/catch at boundaries
try {
  const result = await runIntel(topic)
} catch (err) {
  console.error('[onyx-intel]', err)
  throw new OnyxError('Intel fetch failed', 'INTEL_ERROR')
}
```