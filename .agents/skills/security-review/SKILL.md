---
name: security-review
description: Use when adding authentication, handling user input, working with secrets, creating API endpoints, or implementing payment/sensitive features.
origin: ECC
---

# Security Review Skill

## When to Activate

- Implementing authentication or authorization
- Handling user input or file uploads
- Creating new API endpoints
- Working with secrets or credentials
- Implementing Solana vault or payment features
- Storing or transmitting sensitive data

## Security Checklist

### 1. Secrets Management

```typescript
// FAIL: Never do this
const apiKey = "sk-proj-xxxxx" // Hardcoded

// PASS: Always do this
const apiKey = Bun.env.ANTHROPIC_API_KEY
if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')
```

Verification:
- [ ] No hardcoded API keys, tokens, or passwords
- [ ] All secrets in environment variables
- [ ] `.env.local` in .gitignore
- [ ] No secrets in git history

### 2. Input Validation

```typescript
import { z } from 'zod'

const IntelSchema = z.object({
  topic: z.string().min(3).max(200),
  sources: z.array(z.string()).max(8).optional(),
})

// In Hono handler:
app.post('/intel', zValidator('json', IntelSchema), async (c) => {
  const { topic } = c.req.valid('json') // Always validated
})
```

### 3. Solana-Specific

- Never log private keys or seed phrases
- Use Umbra (`@onyx/privacy`) for private transactions
- Validate all PDAs before use
- Use `@onyx/vault` for key custody, never raw fs access

### 4. Rate Limiting

```typescript
import { rateLimiter } from 'hono/rate-limiter'
app.use('/intel/*', rateLimiter({ windowMs: 60_000, limit: 30 }))
```