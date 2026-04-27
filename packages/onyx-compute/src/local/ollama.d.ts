export interface OllamaGenerateRequest {
    model: string;
    prompt: string;
    stream?: boolean;
    options?: {
        temperature?: number;
        top_k?: number;
        top_p?: number;
        num_predict?: number;
    };
}
export interface OllamaGenerateResponse {
    model: string;
    response: string;
    done: boolean;
    total_duration?: number;
    eval_count?: number;
}
export interface OllamaTagsResponse {
    models: Array<{
        name: string;
        size: number;
        digest: string;
    }>;
}
/**
 * Check if Ollama is running and reachable on localhost.
 */
export declare function isAvailable(): Promise<boolean>;
/**
 * List all locally available Ollama models.
 */
export declare function listModels(): Promise<string[]>;
/**
 * Generate a completion using a locally running Ollama model.
 *
 * @param model  - Model name as known to Ollama (e.g. 'llama3', 'mistral')
 * @param prompt - User prompt string
 * @returns      - Generated text response
 */
export declare function generate(model: string, prompt: string): Promise<string>;
/**
 * OpenAI-compatible chat completion via Ollama.
 * Ollama exposes /v1/chat/completions since v0.1.14.
 */
export declare function chat(model: string, messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
}>): Promise<string>;
//# sourceMappingURL=ollama.d.ts.map