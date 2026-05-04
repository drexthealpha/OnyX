# ONYX

**Sovereign AI OS on Solana** — 37 packages · 9 layers · zero operator cost.

> [!IMPORTANT]
> All API keys are supplied by end users. ONYX itself has no infrastructure bill. It is designed to run locally, on-device, or across decentralized GPU networks.

## 🌌 Mission
ONYX is the first decentralized operating system for AI agents, built natively on Solana. We are moving AI from a "rented" model (SaaS) to a "sovereign" model (Local + P2P + Blockchain). ONYX agents own their own wallets, manage their own memory, and execute transactions without intermediaries.

## 🏗️ Architecture

| Layer | Packages | Description |
|-------|----------|-------------|
| **L0 Kernel** | `kernel` | Core runtime and workspace management. |
| **L1 Intelligence** | `gateway` · `agent` · `multica` · `persona` · `hermes` | Multi-model routing and agentic core logic. |
| **L2 Memory** | `mem` · `tutor` · `semantic` | Long-term RAG, compressed context, and vector memory. |
| **L3 Compute** | `compute` · `rl` · `qvac` · `swe` | **Local-first inference (QVAC)**, GPU orchestration, and Reinforcement Learning. |
| **L4 Financial** | `vault` · `solana` · `privacy` · `bridge` · `fhe` · `router` · `trading` | FHE-encrypted vaults, Solana RPC, and cross-chain bridging. |
| **L5 Surface** | `research` · `intel` · `seo` · `browser` · `markitdown` · `content` | Autonomous research, web browsing, and content generation. |
| **L6 Voice/Screen** | `voice` · `studio` · `hud` | Real-time TTS/STT and interactive HUD overlays. |
| **L7 Workflow** | `lobster` · `eliza-adapter` · `hermes-adapter` | Integration layers for ElizaOS and external workflows. |
| **L8 Interface** | `nerve` · `control` · `editor` · `sdk` | Cross-platform control (Web/Mobile/Desktop) and Developer SDK. |
| **L9 Sovereignty** | `nomad` | Offline survival mode and p2p sovereignty protocols. |

## 🏆 Hackathon Tracks

- **Colosseum Frontier** — The Grand Champion entry for a fully autonomous AI OS.
- **Encrypt / Ika** — FHE + dWallet cross-chain signing for non-custodial agents.
- **Umbra** — Private on-chain transactions and shielded stealth addresses.
- **QVAC** — Local-first inference backend for offline sovereign AI.
- **Nosana / ElizaOS** — Decentralized GPU compute and agentic orchestration.
- **100xDevs** — High-performance developer tooling for the agentic era.

## 🚀 Getting Started

```bash
# Prerequisites: Node >= 20, pnpm >= 9
cp .env.example .env   # fill in your own API keys (Operator cost: $0)
pnpm install
pnpm build
pnpm test
```

## 🛡️ Zero-Operator-Cost Model

ONYX ships as open-source tooling. Users bring their own keys for LLMs (OpenAI, Anthropic) or run locally via **QVAC**. Every environment variable in `.env.example` is labeled:

```bash
# User provides this — operator cost: $0
```

---

Built with ⚡ by Onyx Core.