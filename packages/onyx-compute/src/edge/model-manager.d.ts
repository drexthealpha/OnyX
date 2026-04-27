/**
 * Download a model file from a URL and save it locally.
 *
 * @param name - Local filename to save as (e.g. 'gemma-4-E2B-it.litertlm')
 * @param url  - Full HTTPS URL to download from
 * @returns    - Absolute local path of the downloaded file
 */
export declare function downloadModel(name: string, url: string): Promise<string>;
/**
 * List all model files in the local models directory.
 * Returns filenames (not full paths).
 */
export declare function listModels(): string[];
/**
 * Check if a specific model is already downloaded.
 * @param name - Model filename (e.g. 'gemma-4-E2B-it.litertlm')
 */
export declare function isAvailable(name: string): boolean;
/**
 * Delete a locally cached model.
 * @param name - Model filename
 */
export declare function deleteModel(name: string): void;
/**
 * Get the full local path for a model.
 * @param name - Model filename
 */
export declare function getModelPath(name: string): string;
//# sourceMappingURL=model-manager.d.ts.map