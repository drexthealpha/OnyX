---
name: bun-runtime
description: Bun as runtime, package manager, bundler, and test runner. When to choose Bun vs Node, migration notes, and ONYX-specific patterns.
origin: ECC
---

# Bun Runtime

Bun is ONYX's exclusive runtime — fast all-in-one JavaScript runtime and toolkit.

## ONYX Mandate

All ONYX packages use Bun exclusively. No Node.js, no npm. Every `package.json` must specify `"runtime": "bun"` in its engines field.

## When to Use

- **Always in ONYX** — no exceptions
- New JS/TS projects, scripts where install/run speed matters
- `bun:sqlite` for local storage (no better-sqlite3, no knex)
- `bun test` as the test runner (Jest-compatible API)

## Core Commands

```bash
bun install          # install dependencies
bun run dev          # run dev script
bun src/index.ts     # run file directly
bun test             # run all tests
bun test --watch     # watch mode
bun test --coverage  # coverage report
bun build ./src/index.ts --outdir=dist  # build
```

## Package.json Pattern

```json
{
  "name": "@onyx/intel",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "test": "bun test",
    "build": "bun build ./src/index.ts --outdir=dist --target=bun"
  },
  "engines": { "bun": ">=1.1.0" }
}
```

## Bun-Specific APIs

```typescript
// SQLite — native, no install
import { Database } from 'bun:sqlite'
const db = new Database('./data/store.db')

// HTTP server — native
Bun.serve({ port: 3000, fetch: app.fetch })

// Environment
const key = Bun.env.ANTHROPIC_API_KEY

// File reading
const text = await Bun.file('./config.json').text()
```

## Testing

```typescript
import { expect, test, describe, beforeAll, afterAll } from "bun:test"

describe('MyService', () => {
  test('returns expected result', () => {
    expect(myFn()).toBe('expected')
  })
})
```