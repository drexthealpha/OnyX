export const writers = new Set();
export function broadcastEvent(type, data) {
    const payload = `event: ${type}\ndata: ${JSON.stringify({ type, data, timestamp: Date.now() })}\n\n`;
    for (const writer of writers) {
        try {
            writer.write(payload);
        }
        catch {
            writers.delete(writer);
        }
    }
}
export function initSSE(c) {
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    writers.add(writer);
    // Subscribe to @onyx/multica herald events
    (async () => {
        try {
            const multica = await import("@onyx/multica");
            multica.subscribe("herald", (msg) => {
                broadcastEvent(msg.type, msg.data);
            });
        }
        catch {
            console.warn("[onyx-nerve/sse] @onyx/multica not installed — SSE will fire on broadcastEvent calls only");
        }
    })();
    // Clean up on disconnect
    c.req.raw.signal?.addEventListener("abort", () => {
        writers.delete(writer);
        writer.close().catch(() => { });
    });
    return new Response(readable, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    });
}
