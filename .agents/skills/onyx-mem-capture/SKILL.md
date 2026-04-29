---
name: onyx-mem-capture
description: Complete guide to the @onyx/mem capture/compress/inject cycle. When to use, how to trigger session capture, how injected context appears, code examples of onSessionStart() and onSessionEnd(), memory modes explained.
origin: ONYX
---

# ONYX Memory Capture

The memory system in ONYX uses a three-phase cycle: Capture → Compress → Inject. This skill covers how to use @onyx/mem to store and retrieve semantic memory across sessions.

## What ONYX Memory Does

The @onyx/mem package stores semantic memory as "crystals" - compressed, scored chunks of past sessions stored in Qdrant vector database. Each crystal contains the essential context from a session: key decisions, artifacts created, user preferences, and progress made.

The memory system enables persistent context across sessions. When a user returns to ONYX, their relevant past context is injected as crystals, allowing the agent to pick up where they left off without requiring the user to recap.

## Memory Modes Explained

### Ephemeral Mode

Ephemeral memory exists only for the current session. Nothing is persisted to Qdrant. Use ephemeral when:

- Testing new functionality
- Single-turn interactions
- Any session that shouldn't be remembered

```typescript
import { onSessionEnd } from '@onyx/mem'

await onSessionEnd({
  userId: 'user-abc',
  sessionId: 'sess-test',
  content: fullConversationText,
  mode: 'ephemeral',  // Not stored
  tags: ['test'],
})
```

### Crystal Mode

Crystal mode compresses and stores session content in Qdrant for retrieval across sessions. This is the primary mode for persistent memory. Use crystal when:

- Building toward a goal over multiple sessions
- The user wants context maintained
- Any substantive conversation

```typescript
await onSessionEnd({
  userId: 'user-abc',
  sessionId: 'sess-xyz',
  content: fullConversationText,
  mode: 'crystal',
  tags: ['solana', 'defi', 'research'],
})
```

### Working Mode

Working mode creates an in-context scratchpad. Content stays in the current session's context but isn't persisted. Use working for:

- Intermediate computations
- Multi-step reasoning
- Any temporary context needed only now

## When to Trigger Session Capture

The system automatically calls onSessionEnd() at session close. Manual capture is appropriate when:

1. **Context is Rich**: The session has substantial work - multiple files created, decisions made, features completed.

2. **Future Relevance**: The user will likely continue this work in future sessions. Research topics, feature implementations, and ongoing analysis are good candidates.

3. **Milestone Achieved**: A clear milestone was hit - a feature working, a bug fixed, an understanding reached. These become useful anchor points.

Skip capture for trivial interactions: simple questions answered, typos fixed, single-file edits.

## Code Example: onSessionStart()

The onSessionStart() function injects relevant past crystals into the current session:

```typescript
import { onSessionStart } from '@onyx/mem'

const injected = await onSessionStart({
  userId: 'user-abc',
  topic: 'Solana DeFi research',
  limit: 5,
  minScore: 0.7,
})

// Result structure:
// {
//   crystals: [
//     {
//       content: "User exploring Jupiter DEX...",
//       score: 0.89,
//       timestamp: 1714234567890,
//       tags: ['solana', 'defi', 'jupiter']
//     },
//     ...
//   ],
//   contextBlock: "## Memory Context\n\n[Relevant past sessions...]\n"
// }
```

The injected.crystals array contains the top-k relevant memories, sorted by similarity score. The contextBlock is a pre-formatted string that can be prepended to your system prompt.

## Code Example: onSessionEnd()

The onSessionEnd() function captures and stores the current session:

```typescript
import { onSessionEnd } from '@onyx/mem'

await onSessionEnd({
  userId: 'user-abc',
  sessionId: 'sess-xyz',
  content: fullConversationText,
  mode: 'crystal',
  tags: ['solana', 'defi', 'research'],
})

// Processing pipeline:
// 1. Chunk content into ~500 token segments
// 2. Embed each chunk via @onyx/semantic
// 3. Score for importance (0-1 scale)
// 4. Store in Qdrant with metadata
// 5. Return confirmation with crystal IDs
```

## How Injected Context Appears

When you call onSessionStart(), the crystals are formatted into a context block that appears in your prompt like:

```
## Memory Context

From your previous sessions:

1. [2026-04-28] Solana DeFi research
   Score: 0.89
   ---
   Explored Jupiter DEX integration. Set up @onyx/intel to track
   TVL. User wants to understand yield aggregation.

2. [2026-04-27] ONYX architecture discussion
   Score: 0.76
   ---
   Reviewed L4 Financial packages. Discussed vault design.

---

Based on this context, continue your work.
```

Each crystal includes content, score, timestamp, and tags. The agent reads this block before responding.

## Compression Algorithm

Crystals use extractive summarization - the system identifies the most important sentences by TF-IDF weight relative to the session. This preserves the user's actual language and artifacts rather than generating new summary text.

Target size: 200-400 tokens per crystal. Compression ratio approximately 10:1 from raw session text.

## Practical Example

A tutoring session on zk-SNARKs across multiple days:

**Day 1**: Tutor explains zk-SNARK basics, prover/verifier relationship, polynomial commitments. Session ends → onSessionEnd() stores crystal with tags ['zk-snarks', 'tutor', 'basics'].

**Day 2**: Student returns, asks about practical applications. onSessionStart() injects the Day 1 crystal. Tutor sees "Student covered polynomial commitments yesterday" and doesn't start from scratch.

**Day 3**: Student asks about on-chain verification. Tutor has full context from days 1 and 2.

## TTL and Eviction

By default, crystals expire after 30 days. This keeps the vector database from growing unbounded and ensures context stays relevant.

High-score crystals (score > 0.9) are never automatically evicted. These represent highly relevant sessions the user explicitly marked or the system determined were particularly important.

## Environment Variables

Required for @onyx/mem:

```
QDRANT_URL=http://localhost:6333
ANTHROPIC_API_KEY=sk-ant-...
ONYX_MEM_TTL_DAYS=30
```

The Qdrant URL points to your vector database instance. ANTHROPIC_API_KEY is used for embedding generation during capture. TTL_DAYS controls default expiration.