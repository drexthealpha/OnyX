// ─────────────────────────────────────────────
// Test 1: capture.ts — buffer isolation per sessionId
// ─────────────────────────────────────────────

import { describe, it, expect, beforeEach } from 'bun:test';
import {
  getSessionBuffer,
  clearSessionBuffer,
  pushTelemetry,
} from '../capture.js';
import type { ConversationTelemetry } from '../types.js';

describe('capture — buffer isolation', () => {
  const session1 = 'session-aaa-111';
  const session2 = 'session-bbb-222';

  const makeTurn = (
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
  ): ConversationTelemetry => ({
    sessionId,
    role,
    content,
    tokenCount: content.split(' ').length,
    timestamp: Date.now(),
  });

  beforeEach(() => {
    // Clear both sessions before each test.
    clearSessionBuffer(session1);
    clearSessionBuffer(session2);
  });

  it('buffers multiple turns correctly per sessionId', () => {
    pushTelemetry(makeTurn(session1, 'user', 'Hello ONYX'));
    pushTelemetry(makeTurn(session1, 'assistant', 'Hello! How can I help?'));
    pushTelemetry(makeTurn(session1, 'user', 'Build me a Solana program'));

    pushTelemetry(makeTurn(session2, 'user', 'What is DeFi?'));

    const buf1 = getSessionBuffer(session1);
    const buf2 = getSessionBuffer(session2);

    // Session 1 should have 3 turns.
    expect(buf1).toHaveLength(3);
    expect(buf1[0]?.role).toBe('user');
    expect(buf1[0]?.content).toBe('Hello ONYX');
    expect(buf1[2]?.content).toBe('Build me a Solana program');

    // Session 2 should have exactly 1 turn — no cross-contamination.
    expect(buf2).toHaveLength(1);
    expect(buf2[0]?.content).toBe('What is DeFi?');
  });

  it('returns an empty array for an unknown sessionId', () => {
    const buf = getSessionBuffer('does-not-exist');
    expect(buf).toEqual([]);
  });

  it('clears only the specified session', () => {
    pushTelemetry(makeTurn(session1, 'user', 'Turn A'));
    pushTelemetry(makeTurn(session2, 'user', 'Turn B'));

    clearSessionBuffer(session1);

    expect(getSessionBuffer(session1)).toHaveLength(0);
    expect(getSessionBuffer(session2)).toHaveLength(1);
  });

  it('returns a copy so mutations do not affect the internal buffer', () => {
    pushTelemetry(makeTurn(session1, 'user', 'Original'));
    const copy = getSessionBuffer(session1);
    copy.push(makeTurn(session1, 'assistant', 'Mutated'));

    // Internal buffer should still have only 1 item.
    expect(getSessionBuffer(session1)).toHaveLength(1);
  });
});