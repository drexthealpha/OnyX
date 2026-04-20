# ONYX

**Sovereign AI OS on Solana** — 36 packages · 9 layers · zero operator cost.

> All API keys are supplied by end users. ONYX itself has no infrastructure bill.

## Architecture

| Layer | Packages |
|-------|----------|
| L0 Kernel | `kernel` |
| L1 Intelligence | `gateway` · `agent` · `multica` · `persona` · `hermes` |
| L2 Memory | `mem` · `tutor` · `semantic` |
| L3 Compute | `compute` · `rl` · `swe` |
| L4 Financial | `vault` · `solana` · `privacy` · `bridge` · `fhe` · `router` · `trading` |
| L5 Surface | `research` · `intel` · `seo` · `browser` · `markitdown` · `content` |
| L6 Voice/Screen | `voice` · `studio` · `hud` |
| L7 Workflow | `lobster` · `eliza-adapter` · `hermes-adapter` |
| L8 Interface | `nerve` · `control` · `editor` · `sdk` |
| L9 Sovereignty | `nomad` |

## Hackathon Tracks

- **Colosseum Frontier** — autonomous AI OS
- **Encrypt / Ika** — FHE + dWallet cross-chain signing
- **Umbra** — private on-chain transactions
- **100xDevs** — developer tooling
- **Nosana / ElizaOS** — decentralised GPU compute

## Getting Started

```bash
# Prerequisites: Node >= 20, pnpm >= 9
cp .env.example .env   # fill in your own API keys
pnpm install
pnpm build
pnpm test
```

## Zero-Operator-Cost Model

Every environment variable in `.env.example` is labelled:

```
# User provides this — operator cost: $0
```

ONYX ships as open-source tooling. Users bring their own keys.