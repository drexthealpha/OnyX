import { loadModel as qvacLoadModel, unloadModel as qvacUnloadModel } from '@qvac/sdk';

const loadedModels = new Set<string>();

export async function loadModel(src: string): Promise<string> {
    const modelId = await qvacLoadModel({
        modelSrc: src,
        modelType: 'llm',
        onProgress: (progress: any) => console.log(`QVAC Model Loading: ${progress}`)
    });
    loadedModels.add(modelId);
    return modelId;
}

export async function unloadModel(modelId: string): Promise<void> {
    await qvacUnloadModel({ modelId });
    loadedModels.delete(modelId);
}

export function listLoaded(): string[] {
    return Array.from(loadedModels);
}

export function isLoaded(modelId: string): boolean {
    return loadedModels.has(modelId);
}
