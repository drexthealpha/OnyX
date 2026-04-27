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
/**
 * Gemma 4 E2B (Efficient 2B) — on-device optimised, ~2.4 GB, 8 GB device RAM required.
 * Best for: mobile and edge devices with 8+ GB RAM.
 * Supports: text, vision, audio, thinking mode.
 */
export declare const GEMMA4_E2B_CONFIG: GalleryModelConfig;
/**
 * Gemma 4 E4B (Efficient 4B) — higher quality, ~3.4 GB, 12 GB device RAM required.
 * Best for: high-end edge devices and server-side LiteRT inference.
 * Supports: text, vision, audio, thinking mode.
 */
export declare const GEMMA4_E4B_CONFIG: GalleryModelConfig;
export declare const GEMMA4_MODEL_URL: string;
export declare const GEMMA4_TFLITE_PATH: string;
/** All supported Gemma 4 gallery models */
export declare const GEMMA4_MODELS: GalleryModelConfig[];
//# sourceMappingURL=gallery.d.ts.map