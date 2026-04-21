// packages/onyx-persona/src/persona.test.ts
import { describe, it, expect } from 'vitest';
import { PERSONA_REGISTRY, DEFAULT_PERSONA_NAME } from './index';
import { autoDetect } from './switcher';
import { getEngineParams } from './voice-conditioning';
import type { ConversationContext } from './context';

// ─── Test 1: Finance persona auto-detected when context contains 'portfolio' ───

describe('autoDetect', () => {
  it('activates finance persona when context contains "portfolio"', async () => {
    const context: ConversationContext = {
      messages: [
        { role: 'user', content: 'Can you review my portfolio allocation?' },
      ],
    };
    const detected = await autoDetect(context);
    expect(detected.name).toBe('finance');
  });

  it('activates trading persona when context contains "signal"', async () => {
    const context: ConversationContext = {
      messages: [{ role: 'user', content: 'Give me a signal for BTC entry' }],
    };
    const detected = await autoDetect(context);
    expect(detected.name).toBe('trading');
  });

  it('activates devops persona when context contains "docker"', async () => {
    const context: ConversationContext = {
      messages: [{ role: 'user', content: 'My docker container keeps crashing' }],
    };
    const detected = await autoDetect(context);
    expect(detected.name).toBe('devops');
  });

  it(`defaults to "${DEFAULT_PERSONA_NAME}" when no triggers match`, async () => {
    const context: ConversationContext = {
      messages: [{ role: 'user', content: 'Hello, how are you today?' }],
    };
    const detected = await autoDetect(context);
    expect(detected.name).toBe(DEFAULT_PERSONA_NAME);
  });
});

// ─── Test 2: Every persona systemPrompt is over 200 characters ───

describe('Persona systemPrompt length', () => {
  for (const [name, persona] of Object.entries(PERSONA_REGISTRY)) {
    it(`${name} systemPrompt is ≥ 200 characters`, () => {
      expect(persona.systemPrompt.length).toBeGreaterThanOrEqual(200);
    });
  }
});

// ─── Test 3: Voice conditioning returns valid voiceConfig fields ───

describe('getEngineParams', () => {
  for (const [name, persona] of Object.entries(PERSONA_REGISTRY)) {
    it(`${name} — getEngineParams returns speed, pitch, and voiceId`, () => {
      const params = getEngineParams(persona);
      expect(typeof params.speed).toBe('number');
      expect(typeof params.pitch).toBe('number');
      expect(typeof params.voiceId).toBe('string');
      expect(params.voiceId.length).toBeGreaterThan(0);
      // Speed must be within safe engine range
      expect(params.speed).toBeGreaterThanOrEqual(0.5);
      expect(params.speed).toBeLessThanOrEqual(2.0);
      // Pitch must be within safe semitone range
      expect(params.pitch).toBeGreaterThanOrEqual(-12);
      expect(params.pitch).toBeLessThanOrEqual(12);
    });
  }

  it('clamps out-of-range speed and pitch values', () => {
    const extremePersona = {
      name: 'test',
      systemPrompt: 'x'.repeat(200),
      tone: 'test',
      responseStyle: 'test',
      contextTriggers: [],
      voiceConfig: { speed: 99, pitch: 999, voice: 'NATF0' },
    };
    const params = getEngineParams(extremePersona);
    expect(params.speed).toBe(2.0);
    expect(params.pitch).toBe(12);
  });
});