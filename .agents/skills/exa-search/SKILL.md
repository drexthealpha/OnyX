---
name: exa-search
description: Neural search via Exa MCP for web, code, company research, and people lookup. Use when the user wants semantic search results, code search, or finding expertise.
origin: ECC
---

# Exa Search

Neural search using Exa API for web content, code, company information, and expert discovery.

## When to Activate

- User wants semantic web search beyond Google
- Finding code examples or repositories
- Company research and competitive analysis
- Finding experts or authors in a field
- Any search where semantic relevance matters more than keyword matching

## Exa MCP Tools

```typescript
// Web search with neural understanding
await exa_search({
  query: "Solana DeFi liquid staking 2024",
  numResults: 10,
  type: "auto"
})

// Code search (finds GitHub code)
await exa_search({
  query: "typescript Zod schema validation middleware",
  numResults: 10,
  type: "code"
})

// Find companies in a space
await exa_search({
  query: "AI operating system blockchain",
  numResults: 20,
  type: "company"
})

// Find people/experts
await exa_search({
  query: "blockchain security researcher",
  numResults: 10,
  type: "person"
})
```

## Query Formulation

Exa excels with natural language queries. Best practices:
- Describe what you want, not just keywords
- Include context: "code that does X using Y"
- Specify type if known: `type: "code"` for code search

## Filtering Options

```typescript
// Filter by date
startDate: "2024-01-01"

// Filter by domain
domains: ["github.com", "stackoverflow.com"]

// Filter by language
excludeDomains: ["medium.com"]

// Highlight snippets
highlight: true
```

## Use Cases

### Code Examples
```
Query: "react useEffect cleanup function typescript"
Type: code
```
Finds actual code snippets in repositories.

### Company Research
```
Query: "DeFi protocol Solana TVL"
Type: company
```
Returns company information, not just web pages.

### Expert Discovery
```
Query: "zero knowledge proof cryptography professor"
Type: person
```
Finds researchers, authors, speakers.

## Integration with Other Skills

- Use exa-search to find source material for deep-research
- Use for competitor analysis in market-research
- Use to find examples for documentation-lookup