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
export declare function runInference(modelPath: string, input: Float32Array): Promise<Float32Array>;
/**
 * Resolve the default models directory path.
 */
export declare function getModelsDir(): string;
//# sourceMappingURL=liteRT.d.ts.map