import fs from 'fs';

export async function isAvailable(): Promise<boolean> {
    const modelPath = process.env.QVAC_MODEL_PATH;
    if (modelPath && fs.existsSync(modelPath)) return true;
    return false;
}

export async function getOfflineModel(): Promise<string> {
    return process.env.QVAC_MODEL_PATH || './models/llama-3.2-1b.bin';
}
