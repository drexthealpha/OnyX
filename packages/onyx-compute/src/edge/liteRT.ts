// packages/onyx-compute/src/edge/liteRT.ts
//
// LiteRT-LM inference runner for on-device edge compute.
//
// Google AI Edge Gallery uses .litertlm models (NOT classic .tflite).
// LiteRT-LM is the successor runtime: https://github.com/google-ai-edge/LiteRT-LM
//
// In a Node.js/server context we provide a functional interface that:
//  1. Accepts a path to a .litertlm model file
//  2. Accepts a Float32Array input (token IDs or embeddings)
//  3. Returns a Float32Array output (logits or token IDs)
//
// The actual native LiteRT-LM binding is loaded dynamically so the package
// can be imported in environments where the native module is absent
// (it will throw a descriptive error at call time, not import time).

import * as fs from 'node:fs';
import * as path from 'node:path';

const MODELS_DIR = path.join(process.cwd(), 'models');

export interface InferenceResult {
  output: Float32Array;
  inferenceTimeMs: number;
}

/**
 * Run LiteRT-LM inference on a loaded model.
 *
 * @param modelPath - Absolute path to a .litertlm model file.
 * @param input     - Input tensor as Float32Array (e.g. token id sequence).
 * @returns         - Output tensor as Float32Array (logits / token probabilities).
 *
 * @throws if the model file does not exist.
 * @throws if the LiteRT-LM native binding is not available in this environment.
 */
export async function runInference(
  modelPath: string,
  input: Float32Array
): Promise<Float32Array> {
  // Validate model file exists
  if (!fs.existsSync(modelPath)) {
    throw new Error(
      `LiteRT: model file not found at "${modelPath}". ` +
        `Run downloadModel() first to fetch the model.`
    );
  }

  if (!modelPath.endsWith('.litertlm') && !modelPath.endsWith('.tflite')) {
    throw new Error(
      `LiteRT: expected a .litertlm or .tflite model file. Got: "${path.basename(modelPath)}"`
    );
  }

  // Attempt to load the native LiteRT-LM Node.js binding.
  // The npm package is @google-ai-edge/litert (or litert-lm when released for Node).
  // We dynamic-import to avoid hard crash when running in non-edge environments.
  let LiteRTInterpreter: {
    new (modelPath: string): {
      run(input: Float32Array): Promise<Float32Array>;
      dispose(): void;
    };
  };

  try {
    // Try the official @google-ai-edge/litert package first
    const mod = await import('@google-ai-edge/litert' as string);
    LiteRTInterpreter = (mod as { Interpreter: typeof LiteRTInterpreter }).Interpreter;
  } catch {
    // Fallback: try the legacy tflite-node binding for .tflite models
    try {
      const mod = await import('tflite-node' as string);
      LiteRTInterpreter = (mod as { TFLiteInterpreter: typeof LiteRTInterpreter }).TFLiteInterpreter;
    } catch {
      throw new Error(
        'LiteRT native binding not available in this environment. ' +
          'Install @google-ai-edge/litert or tflite-node, or run in NOMAD_MODE ' +
          'on a device that supports LiteRT-LM. ' +
          'Alternatively use local Ollama/LMStudio or Nosana cloud GPU.'
      );
    }
  }

  const start = Date.now();
  const interpreter = new LiteRTInterpreter(modelPath);
  try {
    const output = await interpreter.run(input);
    const inferenceTimeMs = Date.now() - start;
    console.info(`[LiteRT] Inference complete in ${inferenceTimeMs}ms`);
    return output;
  } finally {
    interpreter.dispose();
  }
}

/**
 * Resolve the default models directory path.
 */
export function getModelsDir(): string {
  return MODELS_DIR;
}