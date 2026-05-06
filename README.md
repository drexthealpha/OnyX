# OnyX

[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg)](https://opensource.org/licenses/MIT)
[![npm](https://img.shields.io/npm/v/@onyx/sdk.svg?style=flat)](https://www.npmjs.com/package/@onyx/sdk)
[![Nosana](https://img.shields.io/badge/Nosana-Devnet-brightgreen.svg)](https://nosana.io)
[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF.svg)](https://solana.com)

> The first decentralized AI operating system on Solana.  
> Agent signs. Key never enters memory. Ever.

---

## The Problem

Every AI agent that executes crypto transactions loads your private key into memory to sign. Once it is there, one compromised dependency, one malicious plugin, one exposed log is enough to drain everything you own. This is not a configuration problem. It is an architectural one — every framework that exists, from ElizaOS to LangChain to Coinbase AgentKit, does the same thing, because there was no alternative.

**$3.8 billion was stolen from crypto in 2024 and 2025 combined.** The attack surface is not going away as AI agents proliferate. It is growing.

---

## The Solution

OnyX separates signing from execution at the cryptographic layer.

The agent proposes a transaction. The signature is computed by the [Ika](https://ika.xyz) distributed network using 2PC-MPC — the private key is mathematically split across nodes and never assembled on any single machine. The agent receives back a valid signature. The key was never here.

On top of that:
- Every transaction flows through [Umbra](https://umbraprivacy.com) stealth addresses by default — amounts, sender, and recipient are hidden on-chain
- Agent memory and state are encrypted via [Encrypt](https://encrypt.xyz) FHE before being stored on Solana — computation happens on ciphertext
- Inference runs locally via [QVAC](https://qvac.tether.io) — your prompts and data never leave your device
- Compute is sourced from [Nosana](https://nosana.io) decentralised GPU network — no centralised cloud

Operator cost: **$0**. Every key, every compute credit, every API subscription is provided by the end user via BYOK architecture.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User / Agent                          │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│          L0: Kernel — Apollo-11 priority queue           │
│          Boot, watchdog, alarm-and-abort, phase log      │
└───────┬──────────┬──────────┬──────────┬────────────────┘
        │          │          │          │
   ┌────▼───┐ ┌───▼────┐ ┌──▼─────┐ ┌──▼──────┐
   │ Bridge │ │Privacy │ │  FHE   │ │ Compute │
   │  Ika   │ │ Umbra  │ │Encrypt │ │  QVAC   │
   │ dWallet│ │Stealth │ │ Vault  │ │ Nosana  │
   └────────┘ └────────┘ └────────┘ └─────────┘
        │          │          │          │
┌───────▼──────────▼──────────▼──────────▼────────────────┐
│         L4: ElizaOS Agent + 18-Channel Gateway           │
│    Telegram · Discord · WhatsApp · Signal · iMessage...  │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│        L5–L8: Surface, Voice, Workflow, Interface        │
│  Research · Trading · SEO · Tutor · Browser · TUI · Web │
└─────────────────────────────────────────────────────────┘
```

---

## Programs

| Program | Address | Network |
|---------|---------|---------|
| OnyX FHE Vault | [`8tsJQaXZQGRdwUo28dicc9XwSMuCkbeiRvr9KYGcWpFs`](https://explorer.solana.com/address/8tsJQaXZQGRdwUo28dicc9XwSMuCkbeiRvr9KYGcWpFs?cluster=devnet) | Devnet |
| Encrypt Protocol | [`4ebfzWdKnrnGseuQpezXdG8yCdHqwQ1SSBHD3bWArND8`](https://explorer.solana.com/address/4ebfzWdKnrnGseuQpezXdG8yCdHqwQ1SSBHD3bWArND8?cluster=devnet) | Devnet |
| Ika dWallet | [`87W54kGYFQ1rgWqMeu4XTPHWXWmXSQCcjm8vCTfiq1oY`](https://explorer.solana.com/address/87W54kGYFQ1rgWqMeu4XTPHWXWmXSQCcjm8vCTfiq1oY?cluster=devnet) | Devnet |
| Umbra Privacy | [`DSuKkyqGVGgo4QtPABfxKJKygUDACbUhirnuv63mEpAJ`](https://explorer.solana.com/address/DSuKkyqGVGgo4QtPABfxKJKygUDACbUhirnuv63mEpAJ?cluster=devnet) | Devnet |

## Packages

#### Core Layer
| Package | Description |
|---------|-------------|
| [`kernel`](kernel/) | Apollo-11 priority queue, watchdog, alarm-and-abort, phase log |
| [`onyx-bridge`](packages/onyx-bridge/) | Ika dWallet 2PC-MPC keyless signing, multisig, spending limits |
| [`onyx-privacy`](packages/onyx-privacy/) | Umbra stealth transactions, UTXO scanning, compliance viewing keys |
| [`onyx-fhe`](packages/onyx-fhe/) | Encrypt FHE vault, confidential swap, sealed bid auction |
| [`onyx-vault`](packages/onyx-vault/) | Keypair closure, spending policy enforcement, abort handlers |

#### Intelligence Layer
| Package | Description |
|---------|-------------|
| [`onyx-qvac`](packages/onyx-qvac/) | QVAC local inference, offline voice pipeline, Singleton worker |
| [`onyx-compute`](packages/onyx-compute/) | Compute router: QVAC → Ollama → Nosana, LiteRT edge |
| [`onyx-rl`](packages/onyx-rl/) | GRPO reward loop, conversation scoring, policy updates |
| [`onyx-hermes`](packages/onyx-hermes/) | GEPA genetic prompt evolution, skill-improver, ACP |
| [`onyx-semantic`](packages/onyx-semantic/) | Qdrant vector store, recency-decay search, 5 collections |

#### Surface Layer
| Package | Description |
|---------|-------------|
| [`onyx-trading`](packages/onyx-trading/) | Multi-analyst orchestrator, Kelly risk manager, private execution |
| [`onyx-research`](packages/onyx-research/) | Deep research graph, temporal scheduling, podcast output |
| [`onyx-intel`](packages/onyx-intel/) | 8-source intelligence pipeline with scoring and caching |
| [`onyx-seo`](packages/onyx-seo/) | 9-agent SEO pipeline, DataForSEO, Google Analytics |
| [`onyx-browser`](packages/onyx-browser/) | Playwright stealth browser, accessibility snapshot, macros |

#### Interface Layer
| Package | Description |
|---------|-------------|
| [`onyx-nerve`](packages/onyx-nerve/) | Hono API + React dashboard, SSE event stream, WebSocket |
| [`onyx-control`](packages/onyx-control/) | Ink TUI — 15 views including Trading, Privacy, Intel, Nosana |
| [`onyx-sdk`](packages/onyx-sdk/) | Public TypeScript SDK, React provider, `useOnyx()` hook |
| [`onyx-gateway`](packages/onyx-gateway/) | 18-channel message router, Nosana job orchestration |
| [`onyx-agent`](packages/onyx-agent/) | ElizaOS v2 runtime, 12 actions, 4 providers, 8 plugins |

#### Native Apps
| App | Platform |
|-----|----------|
| [`apps/android`](apps/android/) | Kotlin, foreground service, wake word, SessionKey biometrics |
| [`apps/ios`](apps/ios/) | Swift, VoiceView, ChatView, Face ID vault unlock |
| [`apps/macos`](apps/macos/) | Menu bar agent, global hotkey, system-level awareness |
| [`apps/web`](apps/web/) | Next.js 15, static export, Vercel-ready |
| [`apps/desktop`](apps/desktop/) | Tauri, Windows/macOS/Linux installer |
| [`apps/mobile`](apps/mobile/) | Expo React Native, offline QVAC inference |
| [`Swabble`](apps/swabble/) | Swift Package, wake word gate, speech pipeline |

---

## Quickstart

```bash
# Requirements: Node.js >=22.17, pnpm >=9, Rust (for Anchor programs)

git clone https://github.com/drexthealpha/OnyX
cd OnyX
cp .env.example .env    # configure your keys
pnpm install
pnpm build
pnpm test
```

To run the local testnet with all Ika and Encrypt programs cloned:
```bash
make start-validator
```

To run the full system:
```bash
pnpm dev
```

To run the TUI:
```bash
pnpm --filter @onyx/control dev
```

---

## Demo Scripts

Prove the core claims on devnet:

```bash
pnpm demo:ika     # Creates dWallet, signs message — key never in memory
pnpm demo:umbra   # Shields USDC — amount hidden on-chain
pnpm demo:fhe     # Verifies FHE vault is live — computation on ciphertext
```

---

## Devnet Transaction Proofs

> Updated after each demo run

| Proof | Signature / Address |
|-------|---------------------|
| Ika dWallet PDA | *(run `pnpm demo:ika`)* |
| Umbra shield tx | *(run `pnpm demo:umbra`)* |
| Nosana job URL  | *(run after job submission)* |

---

## Tests

```bash
pnpm test              # run all tests
pnpm typecheck         # TypeScript strict check
cargo test-sbf         # Anchor program tests
```

---

## Security

For vulnerability disclosure, see [`SECURITY.md`](SECURITY.md).

---

## License

MIT © 2026 @drexthealpha — Lagos, Nigeria