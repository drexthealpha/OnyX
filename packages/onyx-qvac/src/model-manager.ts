import { loadModel as qvacLoadModel, unloadModel as qvacUnloadModel } from '@qvac/sdk';

const loadedModels = new Map<string, string>();

export async function loadModel(src: string): Promise<string> {
    if (loadedModels.has(src)) {
        return loadedModels.get(src)!;
    }
    const modelId = await qvacLoadModel({
        modelSrc: src,
        modelType: 'llm',
        onProgress: (progress: unknown) => console.log(`QVAC Model Loading: ${progress}`)
    });
    loadedModels.set(src, modelId);
    return modelId;
}

export async function unloadModel(modelId: string): Promise<void> {
    await qvacUnloadModel({ modelId });
    for (const [src, id] of loadedModels.entries()) {
        if (id === modelId) {
            loadedModels.delete(src);
            break;
        }
    }
}

export function listLoaded(): string[] {
    return Array.from(loadedModels.values());
}

export function isLoaded(modelId: string): boolean {
    return Array.from(loadedModels.values()).includes(modelId);
}
