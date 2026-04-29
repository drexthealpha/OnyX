---
name: nextjs-turbopack
description: Next.js 15+ and Turbopack — incremental bundling, FS caching, dev speed, and ONYX web app patterns.
origin: ECC
---

# Next.js and Turbopack

Next.js 15 with Turbopack is used in `apps/web` for the ONYX web interface.

## When to Use

- Developing or debugging `apps/web`
- Diagnosing slow dev startup or HMR
- Optimizing production bundles

## ONYX apps/web Stack

- Next.js 15 App Router
- Turbopack (default dev bundler)
- ONYX palette: `#0d0d1f` bg, `#22d3ee` accent
- Connects to NERVE_URL = `http://localhost:${NERVE_PORT}` (default 3001)

## Dev Commands

```bash
pnpm --filter onyx-web dev    # Turbopack dev server
pnpm --filter onyx-web build  # production build
pnpm --filter onyx-web start  # production server
```

## Environment Variables

```env
NEXT_PUBLIC_NERVE_PORT=3001
NEXT_PUBLIC_NERVE_URL=http://localhost:3001
```

## Page Structure

```
apps/web/
├── app/
│   ├── page.tsx          # landing + nerve health check
│   ├── intel/page.tsx    # IntelFeed via SSE
│   ├── learn/page.tsx    # TutorPanel
│   ├── browser/page.tsx  # BrowserTab
│   ├── memory/page.tsx   # MemoryTimeline
│   ├── seo/page.tsx      # SEO dashboard
│   └── spatial/page.tsx  # 3D editor
└── components/
```

## Server Component Pattern

```tsx
// app/intel/page.tsx
export default async function IntelPage() {
  return (
    <main style={{ background: '#0d0d1f', minHeight: '100vh' }}>
      <IntelFeed nerveUrl={process.env.NEXT_PUBLIC_NERVE_URL!} />
    </main>
  )
}
```