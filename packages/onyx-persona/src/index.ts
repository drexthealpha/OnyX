// packages/onyx-persona/src/index.ts
// Main entry point — exports Persona interface, all built-in personas, and switcher utilities.

export type { Persona } from './types';
export type { ConversationContext } from './context';
export type { TTSEngineParams } from './voice-conditioning';

export { switchTo, autoDetect } from './switcher';
export { getEngineParams } from './voice-conditioning';
export { analyzeContext, extractKeywords } from './context';

// Built-in personas
export { financePersona } from './personas/finance';
export { tradingPersona } from './personas/trading';
export { researchPersona } from './personas/research';
export { devopsPersona } from './personas/devops';
export { contentPersona } from './personas/content';
export { privacyPersona } from './personas/privacy';
export { tutorPersona } from './personas/tutor';
export { nomadPersona } from './personas/nomad';

import { financePersona } from './personas/finance';
import { tradingPersona } from './personas/trading';
import { researchPersona } from './personas/research';
import { devopsPersona } from './personas/devops';
import { contentPersona } from './personas/content';
import { privacyPersona } from './personas/privacy';
import { tutorPersona } from './personas/tutor';
import { nomadPersona } from './personas/nomad';
import type { Persona } from './types';

/**
 * Registry of all built-in ONYX personas, keyed by name.
 * Add new personas here to make them available to the auto-detect switcher.
 */
export const PERSONA_REGISTRY: Record<string, Persona> = {
  finance: financePersona,
  trading: tradingPersona,
  research: researchPersona,
  devops: devopsPersona,
  content: contentPersona,
  privacy: privacyPersona,
  tutor: tutorPersona,
  nomad: nomadPersona,
};

export const DEFAULT_PERSONA_NAME = 'research';

export const NAME = '@onyx/persona';