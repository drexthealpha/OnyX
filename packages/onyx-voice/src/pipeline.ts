/**
 * @onyx/voice — Full voice pipeline
 *
 * audio input → Whisper STT → @onyx/agent → TTS → audio output
 *
 * Selects TTS voice based on current @onyx/persona.
 * Target round-trip latency: < 1500 ms.
 *
 * Emits events via @onyx/multica herald (optional peer dep).
 */

import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';
import { transcribeStream } from './transcription/streaming.js';
import { synthesize as edgeSynthesize } from './tts/edge.js';
import { synthesize as elevenLabsSynthesize } from './tts/elevenlabs.js';
import { synthesize as openAISynthesize } from './tts/openai-tts.js';

export type TTSBackend = 'edge' | 'elevenlabs' | 'openai';

export interface PipelineOptions {
  ttsBackend?: TTSBackend;
  elevenLabsVoiceId?: string;
  edgeVoice?: string;
  sampleRate?: number;
  chunkMs?: number;
}

export class VoicePipeline extends EventEmitter {
  private running = false;
  private opts: Required<PipelineOptions>;

  constructor(opts: PipelineOptions = {}) {
    super();
    this.opts = {
      ttsBackend: opts.ttsBackend ?? 'edge',
      elevenLabsVoiceId: opts.elevenLabsVoiceId ?? '',
      edgeVoice: opts.edgeVoice ?? 'en-US-AriaNeural',
      sampleRate: opts.sampleRate ?? 16_000,
      chunkMs: opts.chunkMs ?? 2000,
    };
  }

  async start(audioStream: Readable): Promise<void> {
    this.running = true;
    this.emit('started');

    try {
      for await (const transcript of transcribeStream(
        audioStream,
        this.opts.chunkMs,
        this.opts.sampleRate,
      )) {
        if (!this.running) break;

        this.emit('transcript', transcript);

        const agentResponse = await this._runAgent(transcript);
        if (!agentResponse) continue;

        this.emit('agentResponse', agentResponse);

        const startTTS = Date.now();
        const audioOut = await this._synthesize(agentResponse);
        const ttsMs = Date.now() - startTTS;

        this.emit('audioOut', audioOut, { ttsMs, text: agentResponse });
      }
    } catch (err) {
      this.emit('error', err);
    } finally {
      this.running = false;
      this.emit('stopped');
    }
  }

  stop(): void {
    this.running = false;
  }

  private async _runAgent(transcript: string): Promise<string | null> {
    try {
      const agentModule = await import('@onyx/agent');
      const result: string = await agentModule.run(transcript);
      return result;
    } catch {
      return transcript;
    }
  }

  private async _synthesize(text: string): Promise<Buffer> {
    let voiceOverride: string | undefined;
    try {
      const personaModule = await import('@onyx/persona');
      const current = await personaModule.getCurrentPersona();
      voiceOverride = current?.voice;
    } catch {
      // persona not installed
    }

    switch (this.opts.ttsBackend) {
      case 'elevenlabs': {
        const voiceId = voiceOverride ?? this.opts.elevenLabsVoiceId;
        if (!voiceId) throw new Error('[onyx-voice/pipeline] elevenLabsVoiceId is required');
        return elevenLabsSynthesize(text, voiceId);
      }
      case 'openai':
        return openAISynthesize(text);
      case 'edge':
      default:
        return edgeSynthesize(text, voiceOverride ?? this.opts.edgeVoice);
    }
  }
}