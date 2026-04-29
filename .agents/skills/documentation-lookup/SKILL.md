---
name: documentation-lookup
description: Fetch live documentation via Context7 MCP. Resolves library ID from context, then queries docs for specific patterns. Use when the user wants to lookup API docs, library references, or code examples.
origin: ECC
---

# Documentation Lookup

Fetch live, accurate documentation from the web using Context7 MCP or web search.

## When to Activate

- User asks how to use a specific API or library
- Need to lookup function signatures or parameters
- Looking for code examples or best practices
- Any question where the current context doesn't contain enough detail

## Workflow

### Step 1: Resolve Library ID
Identify the exact library, package, or framework name. Common patterns:
- NPM package name: `hono`, `zod`, `@anthropic-ai/sdk`
- Framework: `nextjs`, `react`, `solana-web3.js`
- Tool: `playwright`, `bun`, `turbo`

### Step 2: Query docs
Use Context7 MCP or web search to fetch relevant documentation pages.

### Step 3: Extract Specific Pattern
Find the exact function signature, code example, or configuration pattern needed.

## Context7 MCP Usage

```typescript
// Resolve library ID
await mcp.resolve_library_id("hono")
// Returns: { id: "hono-js_hono" }

// Query docs
await mcp.query_docs({
  libraryId: "hono-js_hono",
  query: "how to create middleware",
  limit: 5
})
```

## Web Search Alternative

When Context7 isn't available, use web search:

```bash
# Search for specific pattern
exa-search query: "hono middleware typescript example"
```

## Examples

```
Need: How to use zod with Hono
Step 1: Library = zod
Step 2: Query = "zod parse Hono validator example"
Step 3: Extract code:

import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

app.post('/user', zValidator('json', UserSchema), handler)
```

## Best Practices

- Always verify the version in the doc matches what the project uses
- Prefer official docs over third-party tutorials
- Note the date — some docs are outdated
- If multiple approaches exist, pick the simplest