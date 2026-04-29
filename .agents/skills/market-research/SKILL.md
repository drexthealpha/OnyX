---
name: market-research
description: Market sizing (TAM/SAM/SOM), competitive analysis, investor due diligence, and decision-oriented summaries. Use when evaluating markets, competitors, or investment opportunities.
origin: ECC
---

# Market Research

Systematic market analysis for strategic decisions and investor materials.

## When to Activate

- Sizing new markets (TAM/SAM/SOM)
- Competitive analysis
- Investor due diligence
- Product positioning
- Market entry strategy

## TAM/SAM/SOM Framework

### TAM (Total Addressable Market)
The total market demand for your category. Top-down from industry reports.

### SAM (Serviceable Addressable Market)
Your segment of TAM based on geography, customer type, or product line.

### SOM (Serviceable Obtainable Market)
Realistic 3-5 year capture based on competition and distribution.

## Market Sizing Methods

### Top-Down
```typescript
const tam = 50_000_000_000 // $50B from report
const sam = tam * 0.15 // 15% in target segment
const som = sam * 0.03 // 3% realistic capture
```

### Bottom-Up
```typescript
const targetPrice = 99 // Annual
const customers = 100_000_000 // US businesses
const som = targetPrice * customers * 0.01 // 1% capture
```

## Competitive Analysis

### Framework

| Competitor | Strengths | Weaknesses | My Advantage |
|-----------|----------|-----------|------------|
| Company A | Market share | Legacy tech | Modern stack |
| Company B | Brand | Slow iteration | Speed |
| Company C | Price | Limited features | Features |

### Analysis Steps
1. Identify 5-10 competitors
2. Categorize: direct, indirect, substitute
3. Analyze: pricing, features, distribution
4. Position: where you fit differently

## Due Diligence Checklist

```markdown
## Company Due Diligence

### Product
- [ ] Product-market fit evidence
- [ ] User testimonials
- [ ] Usage metrics

### Business
- [ ] Revenue model
- [ ] Unit economics
- [ ] Customer acquisition cost

### Competition
- [ ] Barrier to entry
- [ ] Defensibility
- [ ] Moat description

### Team
- [ ] Relevant experience
- [ ] Track record
- [ ] Cap table
```

## Decision-Oriented Summary

Always end with a clear recommendation:

```
Recommendation: [Enter / Hold / Pass]

Rationale:
- [Point 1]
- [Point 2]
- [Point 3]

Next steps:
- [ ] [Concrete action]
- [ ] [Concrete action]
```