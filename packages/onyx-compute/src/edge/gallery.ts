// packages/onyx-compute/src/edge/gallery.ts
//
// Google AI Edge Gallery — Gemma 4 model configs.
// Data sourced from: google-ai-edge/gallery model_allowlists/1_0_11.json
//
// Runtime: LiteRT-LM (.litertlm files)
// HuggingFace URL pattern:
//   https://huggingface.co/{modelId}/resolve/{commitHash}/{modelFile}

export interface GalleryModelConfig {
  name: string;
  modelId: string;
  modelFile: string;
  commitHash: string;
  downloadUrl: string;
  sizeInBytes: number;
  minDeviceMemoryGb: number;
  supportsImage: boolean;
  supportsAudio: boolean;
  supportsThinking: boolean;
  defaultConfig: {
    topK: number;
    topP: number;
    temperature: number;
    maxContextLength: number;
    maxTokens: number;
    accelerators: string;
  };
}

const HF_BASE = 'https://huggingface.co';

function hfUrl(modelId: string, commitHash: string, modelFile: string): string {
  return `${HF_BASE}/${modelId}/resolve/${commitHash}/${modelFile}`;
}

/**
 * Gemma 4 E2B (Efficient 2B) — on-device optimised, ~2.4 GB, 8 GB device RAM required.
 * Best for: mobile and edge devices with 8+ GB RAM.
 * Supports: text, vision, audio, thinking mode.
 */
export const GEMMA4_E2B_CONFIG: GalleryModelConfig = {
  name: 'Gemma-4-E2B-it',
  modelId: 'litert-community/gemma-4-E2B-it-litert-lm',
  modelFile: 'gemma-4-E2B-it.litertlm',
  commitHash: '7fa1d78473894f7e736a21d920c3aa80f950c0db',
  downloadUrl: hfUrl(
    'litert-community/gemma-4-E2B-it-litert-lm',
    '7fa1d78473894f7e736a21d920c3aa80f950c0db',
    'gemma-4-E2B-it.litertlm'
  ),
  sizeInBytes: 2_583_085_056,
  minDeviceMemoryGb: 8,
  supportsImage: true,
  supportsAudio: true,
  supportsThinking: true,
  defaultConfig: {
    topK: 64,
    topP: 0.95,
    temperature: 1.0,
    maxContextLength: 32_000,
    maxTokens: 4_000,
    accelerators: 'gpu,cpu',
  },
};

/**
 * Gemma 4 E4B (Efficient 4B) — higher quality, ~3.4 GB, 12 GB device RAM required.
 * Best for: high-end edge devices and server-side LiteRT inference.
 * Supports: text, vision, audio, thinking mode.
 */
export const GEMMA4_E4B_CONFIG: GalleryModelConfig = {
  name: 'Gemma-4-E4B-it',
  modelId: 'litert-community/gemma-4-E4B-it-litert-lm',
  modelFile: 'gemma-4-E4B-it.litertlm',
  commitHash: '9695417f248178c63a9f318c6e0c56cb917cb837',
  downloadUrl: hfUrl(
    'litert-community/gemma-4-E4B-it-litert-lm',
    '9695417f248178c63a9f318c6e0c56cb917cb837',
    'gemma-4-E4B-it.litertlm'
  ),
  sizeInBytes: 3_654_467_584,
  minDeviceMemoryGb: 12,
  supportsImage: true,
  supportsAudio: true,
  supportsThinking: true,
  defaultConfig: {
    topK: 64,
    topP: 0.95,
    temperature: 1.0,
    maxContextLength: 32_000,
    maxTokens: 4_000,
    accelerators: 'gpu,cpu',
  },
};

// Convenience alias — E2B is the default Gemma 4 model for ONYX edge
export const GEMMA4_MODEL_URL = GEMMA4_E2B_CONFIG.downloadUrl;
export const GEMMA4_TFLITE_PATH = `./models/${GEMMA4_E2B_CONFIG.modelFile}`;

/** All supported Gemma 4 gallery models */
export const GEMMA4_MODELS: GalleryModelConfig[] = [GEMMA4_E2B_CONFIG, GEMMA4_E4B_CONFIG];