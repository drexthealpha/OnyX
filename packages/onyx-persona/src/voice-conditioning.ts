// packages/onyx-persona/src/voice-conditioning.ts
// Maps Persona voiceConfig to @onyx/studio TTSEngine parameters.

import type { Persona, VoiceConfig } from './types';

/**
 * Full parameter set accepted by @onyx/studio TTSEngine.
 * Mirrors the PersonaPlex voice embedding schema (speed, pitch, voice ID)
 * and adds studio-specific fields for audio post-processing.
 */
export interface TTSEngineParams {
  /** Voice identifier — maps to PersonaPlex embedding file, e.g. "NATF2". */
  voiceId: string;
  /** Playback speed multiplier passed to the synthesis engine. */
  speed: number;
  /** Pitch shift in semitones. */
  pitch: number;
  /** Output sample rate in Hz. Default 24000 matches Moshi/PersonaPlex output. */
  sampleRate: number;
  /** Audio encoding format for streaming output. */
  encoding: 'opus' | 'pcm' | 'mp3';
  /** Whether to apply noise reduction post-processing. */
  denoise: boolean;
  /** Volume normalization target in dBFS. */
  normalizationTarget: number;
}

const DEFAULTS: Omit<TTSEngineParams, 'voiceId' | 'speed' | 'pitch'> = {
  sampleRate: 24000,
  encoding: 'opus',
  denoise: true,
  normalizationTarget: -14,
};

/**
 * Converts a Persona's voiceConfig into TTSEngineParams ready for @onyx/studio.
 * Applies safe clamping to speed and pitch to prevent invalid engine inputs.
 */
export function getEngineParams(persona: Persona): TTSEngineParams {
  const cfg: VoiceConfig = persona.voiceConfig;

  const speed = Math.max(0.5, Math.min(2.0, cfg.speed));
  const pitch = Math.max(-12, Math.min(12, cfg.pitch));

  return {
    ...DEFAULTS,
    voiceId: cfg.voice,
    speed,
    pitch,
  };
}

/**
 * Converts raw VoiceConfig (without full Persona) to TTSEngineParams.
 * Useful for one-off voice conditioning outside the persona system.
 */
export function voiceConfigToParams(cfg: VoiceConfig): TTSEngineParams {
  return {
    ...DEFAULTS,
    voiceId: cfg.voice,
    speed: Math.max(0.5, Math.min(2.0, cfg.speed)),
    pitch: Math.max(-12, Math.min(12, cfg.pitch)),
  };
}