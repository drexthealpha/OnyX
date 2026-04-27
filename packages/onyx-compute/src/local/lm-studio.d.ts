export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
export interface CompletionChoice {
    message: ChatMessage;
    finish_reason: string;
    index: number;
}
export interface ChatCompletionResponse {
    id: string;
    object: string;
    model: string;
    choices: CompletionChoice[];
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}
export interface ModelsResponse {
    object: string;
    data: Array<{
        id: string;
        object: string;
    }>;
}
/**
 * Check if LM Studio is running and reachable on localhost.
 */
export declare function isAvailable(): Promise<boolean>;
/**
 * List all models currently loaded in LM Studio.
 */
export declare function listModels(): Promise<string[]>;
/**
 * Generate a completion using LM Studio's OpenAI-compatible API.
 *
 * @param model  - Model identifier (e.g. 'lmstudio-community/Meta-Llama-3.1-8B-Instruct-GGUF')
 * @param prompt - User prompt string
 * @returns      - Generated text response
 */
export declare function generate(model: string, prompt: string): Promise<string>;
/**
 * Multi-turn chat via LM Studio's OpenAI-compatible /v1/chat/completions endpoint.
 *
 * @param model    - Model identifier
 * @param messages - Conversation history
 * @returns        - Assistant reply text
 */
export declare function chat(model: string, messages: ChatMessage[]): Promise<string>;
//# sourceMappingURL=lm-studio.d.ts.map