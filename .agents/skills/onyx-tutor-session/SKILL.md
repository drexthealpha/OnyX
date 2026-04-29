---
name: onyx-tutor-session
description: How to start and conduct a DeepTutor session. Profile setup, domain levels, how planner calibrates to user level, quiz evaluation, how scores update profile, example tutor session transcript.
origin: ONYX
---

# ONYX Tutor Session

The @onyx/tutor package provides adaptive learning sessions with the DeepTutor system. This skill covers how to start, conduct, and manage tutor sessions.

## DeepTutor Architecture

DeepTutor uses a four-agent architecture to provide personalized learning experiences. ThePlanner reads the learner's profile and determines the appropriate difficulty level. The Socratic agent guides the learner through questions. The Quiz agent evaluates understanding. The Narrator delivers adaptive explanations.

Each agent serves a specific role:

1. **Planner** — Reads the learner profile, selects concept graph depth, determines Socratic questioning depth
2. **Socratic** — Asks probing questions to guide discovery, not give answers
3. **Quiz** — Sends evaluation questions, scores responses, provides feedback
4. **Narrator** — Delivers explanations in the learner's preferred style

## Profile Setup

Create a learner profile to track their knowledge level across domains. The profile stores domain-specific levels that the Planner uses to calibrate sessions:

```typescript
import { createProfile } from '@onyx/tutor'

await createProfile({
  userId: 'user-abc',
  domains: {
    'cryptography': 'beginner',
    'solana-programming': 'intermediate',
    'defi-mechanics': 'advanced',
    'zk-proofs': 'unknown',
  }
})
```

The domain levels follow a progression: unknown → beginner → intermediate → advanced → expert. Starting at unknown triggers a calibration quiz to determine the actual level.

Update profiles as the learner progresses:

```typescript
import { updateProfile } from '@onyx/tutor'

await updateProfile({
  userId: 'user-abc',
  domain: 'zk-proofs',
  level: 'beginner',
})
```

## How the Planner Calibrates

Before each session, the Planner reads the learner's domain level and selects the appropriate teaching depth:

- **unknown** — Surface-level introduction, confirm basics before proceeding
- **beginner** — Conceptual explanations, minimal jargon, lots of examples
- **intermediate** — Applied focus, some first-principles, assumes foundation
- **advanced** — First-principles推导, assumes strong foundation
- **expert** — Discussion-level, research papers, edge cases

For unknown domains, the Planner runs a 3-question calibration quiz to determine the actual level before teaching.

The Socratic depth maps to questioning style:

- surface — Direct questions with multiple choice
- applied — Questions requiring application of concepts
- first-principles — Questions requiring derivations or proofs

## Starting a Session

Begin a tutoring session by calling the teach endpoint:

```typescript
import { startSession } from '@onyx/tutor'

const session = await startSession({
  userId: 'user-abc',
  topic: 'How do zk-SNARKs enable private transactions on Solana?',
  sessionId: 'sess-xyz',
})

// Returns SSE stream:
// data: { type: 'narrator', content: '...', progress: 0.1 }
// data: { type: 'concept', id: 'zk-snark-def', content: '...' }
// data: { type: 'quiz', question: '...', options: [...] }
// data: { type: 'score', value: 9, feedback: '...' }
```

The session returns a Server-Sent Events stream with narrator chunks, concept boundaries, and quiz checkpoints.

## Quiz Evaluation

After each concept unit, the Quiz agent evaluates the learner's understanding:

```typescript
// Quiz arrives as SSE event:
{
  "type": "quiz",
  "question": "Which property of zk-SNARKs makes them practical for on-chain verification?",
  "options": [
    { "id": "A", "text": "Large proof size" },
    { "id": "B", "text": "Constant verification time" },
    { "id": "C", "text": "Requires trusted setup" },
    { "id": "D", "text": "Linear prover time" },
  ],
  "correct": "B"
}
```

The learner answers, and Claude scores the response using a rubric that evaluates both correctness and reasoning depth:

```typescript
// Scoring rubric: 0-10 scale
// 10: Correct answer + detailed, accurate reasoning
// 8: Correct answer + basic reasoning
// 7: Correct answer only
// 5: Partial understanding, wrong answer
// 0: Incorrect
```

The passing threshold is 7. Scores below 7 indicate the learner needs more foundation work.

## How Scores Update Profiles

After each session, the system updates the learner's profile based on quiz performance:

```typescript
// Average score >= 8.0 over 3 sessions: level up
await updateProfile({
  userId: 'user-abc',
  domain: 'zk-proofs',
  level: 'intermediate',  // was beginner
  reason: 'avg score 8.5 over last 3 sessions',
})

// Average score < 4.0 over 2 sessions: level down
await updateProfile({
  userId: 'user-abc',
  domain: 'zk-proofs',
  level: 'unknown',  // was beginner
  reason: 'avg score 3.2 over last 2 sessions',
})
```

This adaptive system ensures the learner is always challenged at the right level.

## Example Tutor Session Transcript

A complete tutor session on zk-SNARKs:

```
Planner: Reading profile for domain 'zk-proofs' — level 'unknown'. Running calibration.
[Calibration Quiz]
Quiz: "What is the main purpose of zero-knowledge proofs?"
  A) To encrypt data
  B) To prove knowledge without revealing the secret
  C) To compress data
  D) To sign transactions
User: "B"
Score: 9/10 — Correct. Setting level to 'beginner'.

[Session Start]
Narrator: "Let's explore zk-SNARKs. At its core, a zk-SNARK lets you prove you know a secret without revealing the secret itself..."
[Concept: Definition]
Narrator: "The acronym breaks down: Zero-Knowledge Succinct Non-interactive Arguments of Knowledge..."
[Concept: Completeness + Soundness]
Narrator: "Two key properties: completeness (if true, prover can convince verifier) and soundness (false proof rejected)..."
[Concept: Practical Application]
Narrator: "On Solana, this enables private transactions — prove you're authorized without revealing your address..."

[Quiz Checkpoint]
Quiz: "Which property of zk-SNARKs makes them practical for on-chain verification?"
  A) Large proof size
  B) Constant verification time
  C) Requires trusted setup
  D) Linear prover time
User: "B"
Score: 9/10 — "Correct. Constant-time verification is what enables on-chain use. Large proofs are okay if succinct."

[Session End]
Narrator: "Great progress today. Next session: non-interactive proofs and recursive verification."
Updating profile: zk-proofs level 'beginner' confirmed.
```

## Memory Integration

At session end, onSessionEnd() from @onyx/mem captures the full exchange:

```typescript
import { onSessionEnd } from '@onyx/mem'

await onSessionEnd({
  userId: 'user-abc',
  sessionId: 'sess-xyz',
  content: fullTranscriptText,
  mode: 'crystal',
  tags: ['tutor', 'zk-proofs', 'session-12'],
})
```

On the next session about zk-SNARKs, the injected crystal ensures the tutor resumes from where they left off without recap.

## Environment Variables

Required for @onyx/tutor:

```
ANTHROPIC_API_KEY=sk-ant-...
QDRANT_URL=http://localhost:6333
TUTOR_PORT=3005
```

The tutor service runs on port 3005 by default.