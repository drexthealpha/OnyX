import { completion } from '@qvac/sdk';

export async function complete(modelId: string, prompt: string): Promise<string> {
    const result = await completion({
        modelId,
        history: [{ role: 'user', content: prompt }],
        stream: false
    });
    // @ts-ignore
    return result.text || '';
}

export async function* stream(modelId: string, prompt: string): AsyncIterable<string> {
    const result = await completion({
        modelId,
        history: [{ role: 'user', content: prompt }],
        stream: true
    });
    // @ts-ignore
    for await (const token of result.tokenStream) {
        yield token;
    }
}
