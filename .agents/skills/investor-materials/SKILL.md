---
name: investor-materials
description: Investor-facing materials — pitch decks, one-pagers, investor memos, financial models, and milestone plans. Use when the user wants to create fundraising materials or investor updates.
origin: ECC
---

# Investor Materials

Create professional investor materials that communicate vision, traction, and opportunity clearly.

## When to Activate

- Building pitch decks for fundraising
- Creating one-pagers or tear sheets
- Writing investor updates or memos
- Building financial models or milestone plans
- Preparing for investor meetings

## Pitch Deck Structure

### Slide 1: Problem
One sentence describing the problem you've identified. Include a specific data point or story.

### Slide 2: Solution
Your product or service in one sentence. Show, don't tell.

### Slide 3: Market
TAM/SAM/SOM with clear logic. Cite sources.

### Slide 4: Traction
Metrics that matter: users, revenue, growth, retention. Show momentum.

### Slide 5: Business Model
How you make money. Unit economics if available.

### Slide 6: Competition
What makes you different. One visual showing your positioning.

### Slide 7: Team
Why this team. Relevant experience. Photos help.

### Slide 8: Ask
How much you're raising and what you'll do with it.

## One-Pager Template

```
Company: [Name]
Tagline: [One sentence]

Problem: [What you solve]
Solution: [How you solve it]
Market: [TAM/SAM/SOM]

Traction:
- [Metric 1]: [Value]
- [Metric 2]: [Value]
- [Metric 3]: [Value]

Team: [Names + relevant background]

Ask: [Amount + timeline]
Contact: [Email]
```

## Financial Model Basics

```typescript
// Simple revenue model
const calculateRevenue = (
  users: number,
  arpu: number,
  conversionRate: number
) => {
  const payingUsers = users * conversionRate
  return payingUsers * arpu * 12 // Annual
}

// Growth model
const projectUsers = (
  current: number,
  growthRate: number,
  months: number
) => {
  return current * Math.pow(1 + growthRate, months)
}
```

## Milestone Planning

```markdown
## Milestones

### Q1 2026
- [ ] Launch MVP
- [ ] Get first 100 users
- [ ] Achieve $10K MRR

### Q2 2026
- [ ] Expand to 3 chains
- [ ] Reach $100K MRR
- [ ] Close seed round
```

## Design Guidelines

- Keep it clean: white space is your friend
- Use charts for metrics, not just numbers
- Include one call-to-action per material
- Be specific: data beats adjectives