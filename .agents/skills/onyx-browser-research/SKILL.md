---
name: onyx-browser-research
description: How to use @onyx/browser for stealth research. When anti-detection matters, snapshot accessibility tree walkthrough, elementRef-based clicking, macros usage, transcript extraction example.
origin: ONYX
---

# ONYX Browser Research

The @onyx/browser package provides browser automation for research with stealth capabilities. This skill covers when to use stealth mode, how to navigate and interact with pages, and how to extract data.

## @onyx/browser Architecture

The browser package wraps Playwright Chromium with stealth plugins. It provides three modes:

1. **navigate** — Standard browser automation, good for most tasks
2. **stealth** — Anti-bot detection mode for sites with aggressive scraping defenses
3. **macro** — Pre-built flows for common research tasks

The service runs as a Hono REST API:

```typescript
import { BrowserService } from '@onyx/browser'

const browser = new BrowserService()
await browser.start({ stealth: true, port: 3007 })
```

## When Anti-Detection Matters

Use stealth mode when scraping sites with bot detection:

- **LinkedIn** — Aggressive rate limits and bot detection
- **Google SERP** — CAPTCHA challenges, suspicious IP behavior
- **Twitter/X** — API rate limits, IP bans without API access
- **Price comparison** — E-commerce fingerprinting
- **Financial data** — Any site with anti-scraping measures

Standard mode works for:

- Documentation sites
- Open APIs
- Sites with public data
- Research with low request volumes

## Navigate and Snapshot

Navigate to a URL and get a snapshot of the page:

```typescript
import { navigate } from '@onyx/browser'

const result = await navigate({
  url: 'https://defillama.com/chains',
  stealth: false,
  snapshot: true,
})

// Returns:
{
  html: '<html>...</html>',
  accessibilityTree: { /* structured tree */ },
  screenshot: 'base64...',
  url: 'https://defillama.com/chains',
}
```

The HTML provides the raw page source. The accessibility tree provides a structured representation of interactive elements.

## Accessibility Tree Walkthrough

The accessibility tree is a JSON representation of all interactive elements on the page:

```json
{
  "role": "button",
  "name": "Connect Wallet",
  "elementRef": "el-42",
  "position": { "x": 840, "y": 120 },
  "children": []
}
{
  "role": "link",
  "name": "Solana",
  "elementRef": "el-43",
  "position": { "x": 200, "y": 300 },
  "href": "https://solana.com"
}
{
  "role": "textbox",
  "name": "Search",
  "elementRef": "el-44",
  "position": { "x": 600, "y": 50 },
  "value": ""
}
```

Each element has:

- **role** — button, link, textbox, checkbox, etc.
- **name** — Accessible label
- **elementRef** — Stable ID for clicking
- **position** — X,Y coordinates

The elementRefs are stable identifiers that don't depend on CSS selectors.

## ElementRef-Based Clicking

Click by elementRef instead of CSS selector:

```typescript
import { click } from '@onyx/browser'

await click({
  elementRef: 'el-42',
  sessionId: 'sess-xyz',
})

// Clicks the element with elementRef 'el-42'
// More stable than: page.click('button.connect-wallet')
```

This approach is more reliable because it uses the accessibility tree rather than CSS selectors, which can change with site updates.

## Macros

Pre-built flows for common research tasks:

```typescript
import { macro } from '@onyx/browser'

// Google search
const googleResult = await macro({
  macro: 'google-search',
  params: { query: 'Solana DeFi TVL 2026' },
})

// LinkedIn profile
const linkedinResult = await macro({
  macro: 'linkedin-profile',
  params: { username: 'VitalikButerin' },
})

// Twitter profile
const twitterResult = await macro({
  macro: 'twitter-profile',
  params: { username: 'satoshi' },
})
```

Built-in macros:

- **google-search** — Performs Google search, returns results
- **linkedin-profile** — Scrapes LinkedIn profile
- **twitter-profile** — Gets Twitter profile data
- **youtube-transcript** — Extracts video transcript
- **reddit-search** — Searches subreddits

## YouTube Transcript Extraction

Extract transcripts from YouTube videos:

```typescript
import { transcript } from '@onyx/browser'

const result = await transcript({
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
})

// Returns:
{
  transcript: "He's reading a lot of the question...\nThe question is about...",
  duration: 213,
  language: 'en',
}
```

If auto-captions are unavailable, the system falls back to yt-dlp for transcript extraction.

## Session Persistence

Browser sessions persist for 10 minutes by default:

```typescript
// Create session
const session = await createSession({
  sessionId: 'sess-xyz',
  stealth: false,
})

// Use session for multiple operations
await navigate({ sessionId: 'sess-xyz', url: 'https://defillama.com' })
await click({ sessionId: 'sess-xyz', elementRef: 'el-50' })
await navigate({ sessionId: 'sess-xyz', url: 'https://defillama.com/eth' })

// Session persists cookies, localStorage, login state
```

This allows you to log in once and perform multiple operations.

## Complete Research Example

Research the top DeFi protocols:

```typescript
// Step 1: Navigate to DeFiLlama
const result1 = await navigate({
  url: 'https://defillama.com/defis',
  stealth: false,
  snapshot: true,
})

// Step 2: Find the table elementRefs
const tableNode = result1.accessibilityTree.find(
  node => node.name.includes('Ethereum') && node.role === 'row'
)

// Step 3: Click to sort by TVL
await click({ elementRef: tableNode.elementRef })

// Step 4: Get updated snapshot
const result2 = await snapshot({ sessionId: 'sess-xyz' })

// Step 5: Extract protocol data
const protocols = result2.accessibilityTree
  .filter(node => node.role === 'row')
  .map(node => ({
    name: node.name,
    tvl: node.tvl,
    elementRef: node.elementRef,
  }))
```

## Environment Variables

```
BROWSER_PORT=3007
BROWSER_STEALTH_PROXY=  # Optional rotating proxy URL
```

Using a rotating proxy with stealth mode provides the best protection against IP bans.