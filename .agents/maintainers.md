# ONYX Maintainer Guide

This guide covers how to maintain, extend, and work with the ONYX sovereign AI OS across all 37 packages and 9 layers.

## ONYX Repo Structure Overview

### 9 Layers, 37 Packages

| Layer | Purpose | Packages |
|-------|--------|----------|
| L0 Kernel | Core enforcement, Apollo-11 laws | `@onyx/kernel`, `@onyx/laws` |
| L1 Intelligence | Semantic embedding, search | `@onyx/semantic`, `@onyx/search`, `@onyx/mem` |
| L2 Agent | Session, planning, tools | `@onyx/session`, `@onyx/planner`, `@onyx/tools` |
| L3 Protocol | MCP servers, protocols | `@onyx/mcp`, `@onyx/proto` |
| L4 Financial | Vault, trading, privacy, FHE | `@onyx/vault`, `@onyx/trading`, `@onyx/privacy`, `@onyx/fhe` |
| L5 Compute | Hono services, cache | `@onyx/intel`, `@onyx/research`, `@onyx/cache` |
| L6 Surface | Voice, studio, content | `@onyx/voice`, `@onyx/studio`, `@onyx/content`, `@onyx/seo` |
| L7 App | Web, mobile, desktop | `@onyx/web`, `@onyx/mobile`, `@onyx/desktop` |
| L8 Sovereign | Nomad, edge, offline | `@onyx/nomad`, `@onyx/edge`, `@onyx/offline` |

## How to Add a New Package

### 1. Create Workspace Structure

```bash
mkdir -p packages/onyx-new-feature/src
```

### 2. package.json Pattern

```json
{
  "name": "@onyx/new-feature",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "test": "bun test",
    "build": "bun build ./src/index.ts --outdir=dist --target=bun"
  },
  "dependencies": {},
  "devDependencies": {}
}
```

### 3. tsconfig.json Pattern

```json
{
  "compilerOptions": {
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "skipLibCheck": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
```

### 4. Bun Runtime

All ONYX packages use Bun exclusively. No Node.js, no npm. Every package must specify:

```json
{
  "engines": { "bun": ">=1.1.0" }
}
```

## How to Write a Skill

### Frontmatter Spec

Every skill starts with frontmatter:

```yaml
---
name: skill-name
description: 1-3 sentence description of when to use this skill
origin: ONYX  # or ECC, Karpathy, shanraisshan, mattpocock
---
```

### Required Sections

1. **When To Use** — Clear trigger conditions for when this skill applies
2. **How It Works** — Core mechanics and workflow
3. **Examples** — Concrete code samples

### Skill Naming Conventions

- Use `kebab-case`
- Co-locate with package if package-specific: `.agents/skills/onyx-intel-brief/SKILL.md`
- Generic skills go in `.agents/skills/generic-skill/SKILL.md`

## How to Run Tests

### Per-Package Testing

```bash
cd packages/onyx-intel
bun test
bun test --watch
bun test --coverage
```

### Run All Tests

```bash
bun run test:all
```

This runs `bun test` in every package with a test script.

## Session Numbering Convention

- Sessions S00–S38 are defined
- S00: Initial setup
- S01–S34: Building core layers
- S35: Agent configurations and skills (this session)
- S36–S38: Future expansion

## How to Update ONYX_STATE.md

At the end of every session:

1. Read existing `ONYX_STATE.md`
2. Update with session accomplishments:
   - New packages added
   - New skills created
   - API changes
   - Breaking changes
3. Increment session number
4. Document next-session goals

## Env Var Discipline

### Zero Operator Cost

All API keys are user-provided. ONYX never subsidizes usage.

### Required Env Vars Pattern

```typescript
const apiKey = Bun.env.ANTHROPIC_API_KEY
if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')
```

### Common ONYX Env Vars

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | Claude API access |
| `QDRANT_URL` | Vector database |
| `OPENAI_API_KEY` | Embeddings |
| `SOLANA_RPC_URL` | Solana RPC endpoint |
| `TWITTER_API_KEY` | X API access |

## PR Checklist

Before submitting any change:

- [ ] Tests pass (`bun test` in affected packages)
- [ ] Build passes (`bun run build`)
- [ ] ONYX_STATE.md updated
- [ ] New skills written (if session adds user-facing capabilities)
- [ ] Skill word counts > 400 for new ONYX skills
- [ ] No hardcoded secrets or keys

## Contact

For questions about ONYX maintenance:

- Issue tracker: GitHub issues
- Coordination: ONYX Discord
- Emergency: Core team page

---

Last updated: S35