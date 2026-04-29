---
name: backend-patterns
description: Backend architecture patterns, API design, database optimization, and server-side best practices for Hono, Bun, and TypeScript services.
origin: ECC
---

# Backend Development Patterns

Backend architecture patterns and best practices for ONYX's Hono/Bun service stack.

## When to Activate

- Designing REST API endpoints in Hono
- Implementing repository, service, or controller layers
- Optimizing database queries (Bun SQLite, Qdrant)
- Setting up background jobs or async processing
- Building middleware (auth, logging, rate limiting)

## Service Layer Pattern

```typescript
// Business logic separated from data access
class IntelService {
  constructor(private cache: TTLCache, private sources: SourceRunner[]) {}

  async brief(topic: string): Promise<IntelBrief> {
    const cached = await this.cache.get(topic)
    if (cached) return cached

    const results = await Promise.all(this.sources.map(s => s.run(topic)))
    const brief = this.aggregate(results)
    await this.cache.set(topic, brief, { ttl: 3600 })
    return brief
  }
}
```

## Hono Route Structure

```typescript
import { Hono } from 'hono'

const app = new Hono()

app.get('/health', (c) => c.json({ status: 'ok', version: pkg.version }))
app.post('/intel/brief', zValidator('json', BriefSchema), async (c) => {
  const { topic } = c.req.valid('json')
  const brief = await intelService.brief(topic)
  return c.json(brief)
})
```

## Error Handling

```typescript
// Structured errors the model can interpret
app.onError((err, c) => {
  console.error('[onyx]', err.message)
  return c.json({ error: err.message, code: err.name }, 500)
})
```

## Bun SQLite Patterns

```typescript
import { Database } from 'bun:sqlite'

const db = new Database('./data/store.db')
db.run('PRAGMA journal_mode=WAL')
db.run('PRAGMA foreign_keys=ON')

// Prepared statements — always
const insert = db.prepare('INSERT INTO items (id, data) VALUES (?, ?)')
insert.run(id, JSON.stringify(data))
```