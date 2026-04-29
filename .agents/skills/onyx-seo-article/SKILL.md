---
name: onyx-seo-article
description: Full seomachine editorial pipeline. Research → write → optimize sequence, each agent's role, dataforseo integration, crosspost workflow, example article from topic to published.
origin: ONYX
---

# ONYX SEO Article

The @onyx/seo package provides a complete content pipeline for creating and publishing SEO-optimized articles. This skill covers the 9-agent pipeline and how to produce publish-ready content.

## Seomachine Architecture

The SEO system uses a 9-agent pipeline, each responsible for a specific phase:

1. **KeywordResearcher** — Identifies target keywords using DataForSEO
2. **CompetitorAnalyzer** — Analyzes top-ranking content
3. **OutlineBuilder** — Creates article structure based on gaps
4. **ContentWriter** — Generates full article content
5. **SEOOptimizer** — Optimizes keyword density and semantics
6. **InternalLinker** — Suggests internal linking opportunities
7. **SchemaGenerator** — Creates JSON-LD structured data
8. **GA4Reporter** — Reports to Google Analytics
9. **WordPressPublisher** — Publishes to WordPress

Each agent passes its output to the next agent in the pipeline.

## Research Phase (Agents 1-2)

### KeywordResearcher

Identify target keywords with DataForSEO:

```typescript
import { runKeywordResearch } from '@onyx/seo'

const kw = await runKeywordResearch({
  seed: 'Solana DeFi yield farming',
  location: 'United States',
  language: 'en',
})

// Returns:
{
  keyword: 'best Solana DeFi protocols 2026',
  volume: 12100,
  cpc: 2.34,
  kd: 45,  // keyword difficulty
  serp_features: ['snippet', 'people_also_ask'],
  related: ['solana yield farming', 'solana staking rewards'],
}
```

### CompetitorAnalyzer

Analyze top-10 SERP competitors:

```typescript
import { analyzeCompetitors } from '@onyx/seo'

const competitors = await analyzeCompetitors({
  keyword: 'best Solana DeFi protocols 2026',
  url: 'https://myblog.com',
})

// Returns:
{
  competitors: [
    { url: 'coindesk.com/...', wordCount: 2400, h2s: [...] },
    { url: 'defimoneypulse.com/...', wordCount: 1800, h2s: [...] },
  ],
  gaps: ['tokenomics section missing', 'no comparison table'],
}
```

Uses @onyx/browser to scrape competitor content.

## Write Phase (Agents 3-4)

### OutlineBuilder

Generate article structure based on competitor gaps:

```typescript
import { buildOutline } from '@onyx/seo'

const outline = await buildOutline({
  keyword: 'best Solana DeFi protocols 2026',
  competitors: competitorData.competitors,
  gaps: competitorData.gaps,
})

// Returns:
{
  title: 'Best Solana DeFi Protocols 2026: Complete Guide',
  h2s: [
    'Introduction',
    'Jupiter Aggregator',
    'Raydium',
    'Orca',
    'Kamino',
    'Comparison Table',
    'How to Choose',
    'Conclusion',
  ],
  wordCount: 2500,
}
```

### ContentWriter

Write the full article:

```typescript
import { writeArticle } from '@onyx/seo'

const article = await writeArticle({
  outline: outlineStructure,
  style: 'educational',
  model: 'claude-sonnet-4-20250514',
})

// Returns:
{
  title: 'Best Solana DeFi Protocols 2026: Complete Guide',
  content: '<full article HTML>',
  wordCount: 2480,
}
```

The ContentWriter uses Claude to generate publication-quality content.

## Optimize Phase (Agents 5-7)

### SEOOptimizer

Optimize for search engines:

```typescript
import { optimizeSEO } from '@onyx/seo'

const optimized = await optimizeSEO({
  article: articleData,
  keyword: 'best Solana DeFi protocols 2026',
  targetKeywordDensity: 1.5,
})

// Performs:
// - Keyword density adjustment to 1-2%
// - LSI semantic keyword insertion
// - Meta title optimization
// - Meta description optimization
// - Header hierarchy fixes
```

### InternalLinker

Suggest internal links:

```typescript
import { suggestInternalLinks } from '@onyx/seo'

const links = await suggestInternalLinks({
  article: optimizedArticle,
  siteUrl: 'https://myblog.com',
  existingContent: existingArticles,
})

// Returns:
{
  suggestions: [
    { anchor: 'Solana staking', url: '/solana-staking-guide', context: '...' },
    { anchor: 'DeFi yield', url: '/defi-yield-explained', context: '...' },
  ],
}
```

### SchemaGenerator

Generate structured data:

```typescript
import { generateSchema } from '@onyx/seo'

const schema = await generateSchema({
  article: finalArticle,
  type: 'article',
})

// Returns JSON-LD:
{
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Best Solana DeFi Protocols 2026...',
  author: { '@type': 'Person', name: 'ONYX' },
  datePublished: '2026-04-29',
}
```

## Full Pipeline Invocation

Run the complete pipeline:

```typescript
import { runPipeline } from '@onyx/seo'

const result = await runPipeline({
  topic: 'Best Solana DEXes 2026',
  targetUrl: 'https://myblog.com',
})

// SSE events stream:
// data: { agent: 'keyword-researcher', status: 'complete' }
// data: { agent: 'competitor-analyzer', status: 'complete' }
// data: { agent: 'outline-builder', status: 'complete' }
// data: { agent: 'content-writer', status: 'complete', wordCount: 2400 }
// data: { agent: 'seo-optimizer', status: 'complete' }
// data: { agent: 'schema-generator', status: 'complete' }
// data: { agent: 'complete', article: {...}, publishReady: true }
```

## WordPress Publish

Publish to WordPress:

```typescript
import { publish } from '@onyx/seo'

await publish({
  article: finalArticle,
  wpUrl: 'https://myblog.com',
  status: 'publish',  // or 'draft'
  categories: ['Solana', 'DeFi'],
  tags: ['defi', 'cryptocurrency'],
})
```

Uses WP REST API with JWT authentication.

## Crosspost Workflow

After publishing, trigger crosspost:

```typescript
import { crosspost } from '@onyx/content'

await crosspost({
  articleUrl: 'https://myblog.com/best-solana-dexes-2026',
  platforms: ['x', 'linkedin'],
})

// X: 5-tweet thread summarizing key points
// LinkedIn: Post with key insight + article link
```

## Example: Topic to Published

Creating "Best Solana DEXes 2026":

1. **Keyword research** (3 min) — Identifies "best Solana DEXes 2026" as target
2. **Competitor analysis** (2 min) — Finds gaps: no comparison table, missing fees section
3. **Outline** (1 min) — H2s: intro, Jupiter, Raydium, Orca, comparison, conclusion
4. **Write** (4 min) — 2,400 words covering all protocols
5. **Optimize** (2 min) — Keywords at 1.5% density, meta tags added
6. **Schema** (1 min) — Article + FAQ JSON-LD
7. **Publish** (1 min) — Live on WordPress
8. **Crosspost** (1 min) — X thread + LinkedIn post

Total time: ~15 minutes.

## Environment Variables

Required for @onyx/seo:

```
DATAFORSEO_LOGIN=...
DATAFORSEO_PASSWORD=...
GA4_PROPERTY_ID=...
GA4_CREDENTIALS_JSON={...}
WP_URL=https://myblog.com
WP_JWT_TOKEN=...
```