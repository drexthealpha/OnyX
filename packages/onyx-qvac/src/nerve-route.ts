import { Hono } from 'hono';
import { loadModel, unloadModel, listLoaded } from './model-manager.js';
import { complete, stream } from './inference.js';

export const qvacRouter = new Hono();

qvacRouter.get('/models', (c) => {
    return c.json({ models: listLoaded() });
});

qvacRouter.post('/load', async (c) => {
    const { src } = await c.req.json();
    const modelId = await loadModel(src);
    return c.json({ modelId });
});

qvacRouter.post('/complete', async (c) => {
    const { modelId, prompt } = await c.req.json();
    const result = await complete(modelId, prompt);
    return c.json({ result });
});

qvacRouter.post('/stream', async (c) => {
    const { modelId, prompt } = await c.req.json();
    
    return new Response(new ReadableStream({
        async start(controller) {
            const tokenStream = stream(modelId, prompt);
            for await (const token of tokenStream) {
                controller.enqueue(new TextEncoder().encode(`data: ${token}\n\n`));
            }
            controller.close();
        }
    }), {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        }
    });
});

qvacRouter.delete('/:modelId', async (c) => {
    const modelId = c.req.param('modelId');
    await unloadModel(modelId);
    return c.json({ success: true });
});
