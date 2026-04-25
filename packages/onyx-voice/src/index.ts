// @onyx/voice — barrel export

export { transcribe } from './transcription/whisper.js';
export { transcribeStream } from './transcription/streaming.js';
export * as edgeTTS from './tts/edge.js';
export * as elevenLabs from './tts/elevenlabs.js';
export * as openAITTS from './tts/openai-tts.js';
export { VoicePipeline, type PipelineOptions } from './pipeline.js';
export { WakeWordDetector } from './wake-word.js';