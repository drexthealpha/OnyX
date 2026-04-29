---
name: onyx-nomad-mode
description: How to activate and use offline survival mode. preload() before going offline, queue flushing on reconnect, LiteRT model setup, offline search limitations vs online.
origin: ONYX
---

# ONYX Nomad Mode

The @onyx/nomad package provides offline survival capabilities for ONYX. This skill covers how to use offline mode, queue operations, and sync on reconnect.

## What ONYX Nomad Is

Nomad is ONYX's L9 Sovereignty layer. It ensures ONYX works without network connectivity by:

- Detecting offline state via DNS lookup
- Falling back to local compute sources
- Queueing operations for later sync
- Syncing when connectivity returns

The name stands for Node for Offline Media, Archives, and Data — inspired by the nomad nature of offline computing.

## Starting Nomad

Initialize the offline system:

```typescript
import { startNomad } from '@onyx/nomad'

const state = await startNomad({
  port: 3009,
})

// Returns state:
// {
//   isOnline: false,
//   activeBackend: 'edge',  // 'edge' | 'local-ollama' | 'local-lmstudio'
//   pendingOps: 0,
//   daemonRunning: true
// }
```

The system detects offline state by checking 8.8.8.8 (Google DNS) with a 2-second timeout.

## Preload Before Going Offline

Cache knowledge for offline use:

```typescript
import { preload } from '@onyx/nomad'

// Run BEFORE leaving connectivity
await preload({
  topics: [
    'Solana DeFi',
    'Jupiter DEX',
    'Nosana GPU',
    'ONYX tokenomics',
  ],
  cacheDir: './data/offline-knowledge',
})

// Writes to offline-knowledge.db (SQLite with FTS5)
// Each topic creates a searchable offline knowledge base
```

The preload function:

1. Calls @onyx/intel for each topic
2. Stores results in local SQLite database
3. Enables full-text search offline

## Backend Priority Order

When offline, ONYX tries backends in order:

1. **Edge (.tflite)** — Google AI Edge LiteRT in ./models/
2. **Ollama** — Local Ollama at http://localhost:11434
3. **LM Studio** — Local LM Studio at http://localhost:1234/v1/models
4. **NoComputeAvailable** — Throws error if none found

```typescript
import { getAvailableBackend } from '@onyx/nomad'

const backend = await getAvailableBackend()

// Returns: { type: 'edge' | 'local-ollama' | 'local-lmstudio', model: string }
```

## Queueing Operations Offline

When offline, queue operations instead of failing:

```typescript
import { enqueue } from '@onyx/nomad'

// Queue an operation
await enqueue({
  type: 'intel',
  params: { topic: 'Jupiter DEX' },
  priority: 'high',
})

// Writes to offline-queue.ndjson (append-only log)
```

Queue supports operation types:

- **intel** — Intelligence briefings
- **research** — Deep research
- **capture** — Memory capture
- **tutor** — Tutoring session

## Queue Flushing on Reconnect

When connectivity returns, the sync daemon flushes queued operations:

```typescript
// Sync daemon runs every 30 seconds
// Detects online transition: false → true
// Calls flush()

const flushResult = await flush()

// flushResult:
// {
//   flushedOps: 3,
//   crystalsSynced: 12,
//   docsReEmbedded: 5,
//   completedAt: '2026-04-29T10:30:00Z'
// }
```

Each flushed operation:

1. Executes the original request
2. Stores results locally
3. Updates crystal count if relevant

## Offline Search Limitations vs Online

| Feature | Online (Qdrant) | Offline (FTS5) |
|--------|----------------|-----------------|
| Search type | Semantic vector | Keyword BM25 |
| Recall | High | Lower |
| Query complexity | Natural language | Keywords |
| Speed | ~100ms | ~50ms |

The practical difference: preload specific topics you need. Complex semantic queries ("find things similar to...") don't work offline — use keywords instead.

## LiteRT Model Setup

Download and place .tflite models:

```bash
# Download Gemma4 2B INT4
curl -L https://huggingface.co/google/gemma-2b-tflite/resolve/main/gemma2b_q4.tflite \
  -o ./models/gemma2b_q4.tflite

# Verify
ls -la ./models/
# -rw-r--r-- 1.4G gemma2b_q4.tflite
```

Other models:

- mobilenet_v3.tflite — Image classification
- bert_qa.tflite — Question answering
- whisper_tiny.tflite — Speech-to-text

## Complete Offline Workflow

Using ONYX while traveling:

```typescript
// At home, before departure
await preload({
  topics: ['Solana ecosystem', 'ONYX architecture'],
})

// On airplane (offline)
const backend = await getAvailableBackend()
// type: 'edge'

// Ask questions offline
const answer = await inferEdge({
  prompt: 'Summarize how the ONYX vault works:',
  maxTokens: 200,
})
// Returns: 'The ONYX vault uses...'

// Queue a research request
await enqueue({
  type: 'research',
  params: { topic: 'New DeFi protocols' },
})

// Back online — auto-syncs
// flushResult confirms { flushedOps: 1, crystalsSynced: 0 }
```

## Environment Variables

Nomad itself requires no environment variables. Subsystems use their own:

```
ANTHROPIC_API_KEY=  # Used during preload
QDRANT_URL=  # Used for sync on reconnect
```

No additional configuration needed — the system falls back gracefully.