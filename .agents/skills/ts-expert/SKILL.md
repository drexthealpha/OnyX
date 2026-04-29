---
name: ts-expert
description: TypeScript expert patterns — strict mode, type inference, generics, discriminated unions, template literal types, and production-grade TS patterns for ONYX packages.
origin: mattpocock+ONYX
---

# TypeScript Expert

Production-grade TypeScript for ONYX packages. This skill covers the patterns, utilities, and practices that make TypeScript reliable for critical ONYX infrastructure.

## ONYX TypeScript Baseline

Every ONYX package uses these tsconfig settings:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "moduleResolution": "bundler",
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "ESNext"
  }
}
```

These settings catch more errors at compile time. Use them everywhere.

## Type Inference Over Annotation

Let TypeScript infer where it can:

```typescript
// Let TypeScript infer
const intel = await runIntel('Solana')  // TypeScript knows the return type

// Annotate exported functions
export async function runIntel(topic: string): Promise<IntelBrief> {
  // Explicit return types on exports
}
```

Inference catches errors like returning the wrong type accidentally. Annotation is required on exports for documentation.

## Discriminated Unions for State

Model state with discriminated unions:

```typescript
// State as discriminated union
type IntelState =
  | { status: 'idle' }
  | { status: 'loading'; topic: string }
  | { status: 'success'; brief: IntelBrief }
  | { status: 'error'; error: string }

// Handler with exhaustiveness checking
function render(state: IntelState) {
  switch (state.status) {
    case 'idle':
      return 'Ready'
    case 'loading':
      return `Loading ${state.topic}...`
    case 'success':
      return state.brief.summary  // TypeScript knows brief exists here
    case 'error':
      return state.error
  }
}
```

Adding a new status to IntelState causes TypeScript to error at all switch statements — preventing bugs.

## Generics for Reusable Patterns

Create reusable utilities with generics:

```typescript
// TTL cache — used across @onyx/intel, @onyx/mem
class TTLCache<K, V> {
  private store = new Map<K, { value: V; expiresAt: number }>()

  set(key: K, value: V, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs })
  }

  get(key: K): V | undefined {
    const entry = this.store.get(key)
    if (!entry || entry.expiresAt < Date.now()) {
      this.store.delete(key)
      return undefined
    }
    return entry.value
  }

  has(key: K): boolean {
    return this.get(key) !== undefined
  }
}
```

## Template Literal Types for API Routes

Type route strings with template literals:

```typescript
type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'
type Route = `/${string}`
type APIRoute = `${HTTPMethod} ${Route}`

// Valid routes
const routes: APIRoute[] = [
  'GET /health',
  'POST /intel/brief',
  'GET /intel/stream',
  'DELETE /intel/cache',
]

// Invalid — TypeScript error
// const bad: APIRoute = 'POST /nonexistent'
```

## Zod for Runtime + Compile-Time Validation

Validate at runtime with Zod, derive types:

```typescript
import { z } from 'zod'

const IntelBriefSchema = z.object({
  topic: z.string(),
  summary: z.string(),
  sources: z.array(z.object({
    name: z.string(),
    data: z.unknown(),
  })),
  score: z.number().min(0).max(1),
  timestamp: z.number(),
  cached: z.boolean(),
})

type IntelBrief = z.infer<typeof IntelBriefSchema>

// Runtime validation
function parseBrief(input: unknown): IntelBrief {
  return IntelBriefSchema.parse(input)
}
```

## Error Handling with Typed Errors

Define typed errors with class extensions:

```typescript
class OnyxError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly layer: string,
  ) {
    super(message)
    this.name = 'OnyxError'
  }
}

// Always throw typed errors
throw new OnyxError('Intel fetch failed', 'INTEL_FETCH_ERROR', 'L5')

// Catch with type narrowing
try {
  await runIntel(topic)
} catch (err) {
  if (err instanceof OnyxError) {
    console.error(`[${err.layer}] ${err.code}: ${err.message}`)
  }
}
```

## The satisfies Operator

Use satisfies to preserve literals:

```typescript
const LAYER_MAP = {
  L0: 'kernel',
  L1: 'intelligence',
  L4: 'financial',
} satisfies Record<string, string>

// TypeScript knows:
// LAYER_MAP.L0 = 'kernel' (not string)
// LAYER_MAP.L1 = 'intelligence' (not string)
```

## Utility Types in ONYX

Standard utility types:

```typescript
// Partial for optional updates
type CrystalUpdate = Partial<Crystal>

// Required for validated output
type ValidatedBrief = Required<IntelBrief>

// Pick for slim DTO
type BriefSummary = Pick<IntelBrief, 'topic' | 'summary' | 'score'>

// Omit for excluding fields
type BriefWithoutCache = Omit<IntelBrief, 'cached'>

// Record for maps
type SourceScores = Record<SourceName, number>
```

## TDD with Bun + TypeScript

Test-driven development works with Bun:

```typescript
import { expect, test } from 'bun:test'
import type { IntelBrief } from '../types'

test('runIntel returns valid IntelBrief', async () => {
  const result = await runIntel('Solana')

  expect(result.topic).toBe('Solana')
  expect(result.summary.length).toBeGreaterThan(0)
  expect(result.score).toBeGreaterThanOrEqual(0)
  expect(result.score).toBeLessThanOrEqual(1)
})
```

Bun's test runner integrates with TypeScript:

```bash
bun test
bun test --coverage
bun test --watch
```

## No Additional Configuration

TypeScript expert patterns use standard TypeScript. No external dependencies beyond what's already in ONYX package.json.