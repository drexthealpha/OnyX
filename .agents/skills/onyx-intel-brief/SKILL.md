---
name: onyx-intel-brief
description: Guide to running multi-source intelligence via @onyx/intel. When to use vs @onyx/research, all 8 sources explained, scoring algorithm, cache TTL behavior, example briefing on a Solana project.
origin: ONYX
---

# ONYX Intelligence Brief

The @onyx/intel package provides multi-source intelligence aggregation. This skill covers when to use intel, how the 8 sources work, and the scoring algorithm.

## When to Use vs Research

ONYX provides two intelligence capabilities with different tradeoffs:

### @onyx/intel: Fast, Real-Time
- **Latency**: Under 10 seconds
- **Use for**: Daily briefings, monitoring alerts, current events, market signals
- **Approach**: Parallel multi-source fetch, weighted aggregation
- **Freshness**: Real-time with 1-hour cache

### @onyx/research: Deep, Comprehensive
- **Latency**: Minutes (may span multiple minutes)
- **Use for**: Due diligence, whitepapers, comprehensive reports, competitive analysis
- **Approach**: Graph-based deep exploration, synthesis
- **Freshness**: Cached more aggressively

Choose intel for speed and monitoring. Choose research for thorough understanding and documents.

## All 8 Sources Explained

### 1. Twitter Search
X API v2 integration for social signals. Searches by keyword and cashtags ($SOL, $ETH). Returns engagement metrics, recent tweets, sentiment indicators.

Use for: Social buzz, influencer opinions, announcement tracking.

```typescript
const twitterResult = await twitterSearch({
  query: 'Jupiter DEX Solana',
  cashtag: '$JUP',
  limit: 20,
})
```

### 2. Reddit Scan
Pushshift API + Reddit API for community discussion. Scans relevant subreddits (r/deribit, r/solana, r/defi).

Use for: Community sentiment, common questions, bug reports.

```typescript
const redditResult = await redditScan({
  query: 'Solana liquid staking',
  subreddits: ['r/solana', 'r/defi'],
  limit: 15,
})
```

### 3. News API
NewsAPI.org integration for mainstream coverage. Filters to reputable sources, excludes clickbait.

Use for: Announcements, regulatory news, market coverage.

```typescript
const newsResult = await newsApi({
  query: 'Solana DeFi',
  language: 'en',
  limit: 10,
})
```

### 4. CoinGecko
Token price, volume, market cap, rank, and historical data. Primary source for token metrics.

Use for: Price, volume, market cap, ranking.

```typescript
const coingeckoResult = await coingecko({
  query: 'jupiter',
  data: ['price', 'volume', 'market_cap', 'rank'],
})
```

### 5. DeFiLlama
DeFi protocol TVL, chain rankings, historical TVL, yield rates. The source for DeFi-specific metrics.

Use for: TVL, protocol rankings, yield comparison.

```typescript
const defillamaResult = await defillama({
  protocol: 'jupiter',
  metrics: ['tvl', 'history', 'chains'],
})
```

### 6. GitHub Activity
Commits, stars, forks, issues, PRs for relevant repositories. Tracks development activity.

Use for: Developer interest, project health, recent updates.

```typescript
const githubResult = await githubActivity({
  repo: 'jup-ag/interface',
  metrics: ['stars', 'commits', 'issues'],
})
```

### 7. Arxiv Search
Academic papers matching the topic. Uses arXiv API for preprints in cryptography, DeFi, distributed systems.

Use for: Technical depth, research papers, theoretical foundations.

```typescript
const arxivResult = await arxivSearch({
  query: 'zero knowledge proof DeFi',
  limit: 5,
})
```

### 8. Exa Neural
Exa.ai neural search for deep web content. Semantic search beyond keyword matching.

Use for: Blog posts, tutorials, less-structured content, comprehensive coverage.

```typescript
const exaResult = await exaNeural({
  query: 'Solana Jupiter DEX integration guide',
  limit: 10,
})
```

## Scoring Algorithm

The intelligence score normalizes and weights results from all 8 sources into a single 0-1 score:

```typescript
function calculateIntelScore(results: SourceResult[]): number {
  const weights = {
    'twitter-search': 0.15,
    'reddit-scan': 0.10,
    'news-api': 0.15,
    'coingecko': 0.20,
    'defillama': 0.20,
    'github-activity': 0.10,
    'arxiv-search': 0.05,
    'exa-neural': 0.05,
  }

  let weightedSum = 0
  let totalWeight = 0

  for (const result of results) {
    const sourceWeight = weights[result.source] || 0
    const sourceScore = result.normalizedScore  // 0-1
    weightedSum += sourceScore * sourceWeight
    totalWeight += sourceWeight
  }

  const score = weightedSum / totalWeight
  
  // Clamp: never 1.0 - always uncertainty
  return Math.min(score, 0.95)
}
```

The algorithm gives highest weight to quantitative sources (CoinGecko, DeFiLlama) that provide objective metrics. Social sources (Twitter, Reddit) inform but don't drive the score.

## Cache TTL Behavior

Results are cached in SQLite with a 1-hour TTL by default:

```typescript
const cacheOptions = {
  ttl: 3600,  // 1 hour in seconds
  staleWhileRevalidate: true,  // Serve stale while refreshing
}

const brief = await runIntel('Jupiter DEX Solana', { cache: cacheOptions })
```

The `force: true` parameter bypasses the cache entirely:

```typescript
const brief = await runIntel('Jupiter DEX Solana', { force: true })
```

Stale-while-revalidate serves cached data immediately while refreshing in the background - users get fast responses even on cache hits.

## Example: Brief on a Solana Project

```typescript
import { runIntel } from '@onyx/intel'

const brief = await runIntel('Jupiter DEX Solana')

// Returns:
// {
//   topic: 'Jupiter DEX Solana',
//   summary: 'Jupiter aggregator processed $2.1B in volume this week, 
//            up 12% WoW. TVL holding at $890M. Recently launched 
//            perpetual futures beta.',
//   sources: [
//     { name: 'defillama', data: { tvl: 890_000_000 }, weight: 0.20 },
//     { name: 'coingecko', data: { volume_24h: 2_100_000_000 }, weight: 0.20 },
//     { name: 'twitter-search', data: { mentions: 234 }, weight: 0.15 },
//     { name: 'reddit-scan', data: { threads: 45 }, weight: 0.10 },
//     // ... other sources
//   ],
//   score: 0.87,
//   timestamp: 1714234567890,
//   cached: false  // Fresh, not from cache
// }
```

## SSE Streaming

For real-time updates, use the streaming endpoint:

```typescript
const response = await fetch('http://localhost:3003/intel/stream?topic=Jupiter')
const reader = response.body?.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader!.read()
  if (done) break
  const chunk = decoder.decode(value)
  const event = JSON.parse(chunk)
  // { type: 'source', name: 'coingecko', data: {...} }
  // { type: 'source', name: 'defillama', data: {...} }
  // { type: 'complete', brief: {...} }
}
```

Each source pushes partial results as it resolves, so users see progress without waiting for all sources.

## Environment Variables

Required for @onyx/intel:

```
TWITTER_BEARER_TOKEN=...
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...
NEWS_API_KEY=...
COINGECKO_API_KEY=...
EXA_API_KEY=...
ANTHROPIC_API_KEY=sk-ant-...
```

Each source may have its own API key. Some sources (DeFiLlama, GitHub) don't require authentication.