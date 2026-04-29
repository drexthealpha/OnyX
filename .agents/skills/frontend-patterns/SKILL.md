---
name: frontend-patterns
description: React/Next.js patterns, state management, data fetching, performance optimization, and form handling with Zod validation. Use when building modern web applications.
origin: ECC
---

# Frontend Patterns

Production React and Next.js patterns for ONYX web applications.

## When to Activate

- Building new React components or pages
- Implementing state management solutions
- Setting up data fetching with caching
- Creating forms with validation
- Optimizing performance

## State Management Patterns

### Local State
```typescript
// Simple state with useState
const [value, setValue] = useState<string>('')

// Derived state
const filteredItems = items.filter(item => item.active)
```

### Global State with Signals
```typescript
import { signal } from '@preact/signals'

const userSession = signal<UserSession | null>(null)

// Used in components
const session = userSession.value
```

### Server State with React Query
```typescript
import { useQuery } from '@tanstack/react-query'

const { data, isLoading, error } = useQuery({
  queryKey: ['intel', topic],
  queryFn: () => runIntel(topic),
  staleTime: 5 * 60 * 1000,
})
```

## Data Fetching Patterns

### Server Components (Next.js App Router)
```typescript
// app/intel/page.tsx
async function IntelPage() {
  const brief = await runIntel('Solana DeFi')
  return <IntelBrief data={brief} />
}
```

### Client Components with SSE
```typescript
'use client'
const eventSource = new EventSource('/api/intel/stream?topic=Solana')
eventSource.onmessage = (e) => {
  const data = JSON.parse(e.data)
  updateBrief(data)
}
```

## Form Handling with Zod

```typescript
import { z } from 'zod'
import { useForm } from 'react-hook-form'

const IntelFormSchema = z.object({
  topic: z.string().min(3).max(200),
  sources: z.array(z.string()).max(8).optional(),
})

type IntelFormData = z.infer<typeof IntelFormSchema>

function IntelForm() {
  const form = useForm<IntelFormData>()
  
  const onSubmit = (data: IntelFormData) => {
    console.log(data)
  }
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('topic')} />
      {form.formState.errors.topic && <span>Invalid</span>}
    </form>
  )
}
```

## Performance Optimization

### Memoization
```typescript
const memoizedValue = useMemo(
  () => computeExpensiveValue(a, b),
  [a, b]
)

const handleClick = useCallback(
  () => doSomething(a, b),
  [a, b]
)
```

### Code Splitting
```typescript
import dynamic from 'next/dynamic'

const HeavyChart = dynamic(
  () => import('./HeavyChart'),
  { loading: () => <Skeleton /> }
)
```

### Image Optimization
```typescript
import Image from 'next/image'

<Image
  src="/chart.png"
  width={800}
  height={600}
  alt="DeFi TVL chart"
/>
```