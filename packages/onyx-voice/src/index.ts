// @onyx/voice — barrel export

export const NAME = 'onyx-voice';

export { transcribe } from './transcription/whisper';
export { transcribeStream } from './transcription/streaming';
export * as edgeTTS from './tts/edge';
export * as elevenLabs from './tts/elevenlabs';
export * as openAITTS from './tts/openai-tts';
export { VoicePipeline, type PipelineOptions } from './pipeline';
export { WakeWordDetector } from './wake-word';