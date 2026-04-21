// packages/onyx-persona/src/types.ts

export interface VoiceConfig {
  /** Playback speed multiplier. 1.0 = normal, 0.8 = slower, 1.3 = faster. */
  speed: number;
  /** Pitch shift in semitones. 0 = no shift. Positive = higher. */
  pitch: number;
  /** PersonaPlex / studio voice ID, e.g. "NATF2", "NATM1", "VARF0". */
  voice: string;
}

export interface Persona {
  /** Unique slug used as registry key and in herald events. */
  name: string;
  /**
   * Full system prompt injected into the LLM context when this persona is active.
   * Must be at least 200 characters to provide meaningful behavioral guidance.
   */
  systemPrompt: string;
  /** General tone descriptor, e.g. "conservative", "aggressive", "Socratic". */
  tone: string;
  /** Response style guidance, e.g. "cite sources", "bullet signals", "use analogies". */
  responseStyle: string;
  /**
   * Keywords that trigger auto-activation of this persona when found in conversation context.
   * Checked case-insensitively against the full context text.
   */
  contextTriggers: string[];
  /** Voice conditioning parameters mapped to @onyx/studio TTSEngine. */
  voiceConfig: VoiceConfig;
}