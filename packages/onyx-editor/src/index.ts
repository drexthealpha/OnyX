import http from 'http';
import { CollaborationServer } from './collaboration';
import { SceneExporter } from './scene/exporter';
import { SceneBuilder } from './scene/builder';

// ─── HTTP Server ─────────────────────────────────────────────────────────────

const EDITOR_PORT = parseInt(process.env.EDITOR_PORT ?? '3009', 10);

const globalBuilder = new SceneBuilder();
const globalExporter = new SceneExporter();
const collab = new CollaborationServer();

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${EDITOR_PORT}`);

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // GET /health
  if (url.pathname === '/health' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok', service: '@onyx/editor', port: EDITOR_PORT }));
    return;
  }

  // GET /scene — get current scene JSON
  if (url.pathname === '/scene' && req.method === 'GET') {
    res.writeHead(200);
    res.end(globalExporter.toJSON(globalBuilder.build()));
    return;
  }

  // GET /scene/mermaid — get Mermaid flowchart
  if (url.pathname === '/scene/mermaid' && req.method === 'GET') {
    res.writeHead(200);
    res.end(
      JSON.stringify({ mermaid: globalExporter.toMermaid(globalBuilder.build()) })
    );
    return;
  }

  // POST /scene/node — add a node
  if (url.pathname === '/scene/node' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const { type, position, config } = JSON.parse(body) as {
          type: string;
          position: { x: number; y: number; z: number };
          config: Record<string, unknown>;
        };
        const id = globalBuilder.addNode(type, position, config ?? {});
        res.writeHead(201);
        res.end(JSON.stringify({ id }));
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: String(err) }));
      }
    });
    return;
  }

  // POST /scene/edge — add an edge
  if (url.pathname === '/scene/edge' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const { from, to, label } = JSON.parse(body) as {
          from: string;
          to: string;
          label: string;
        };
        globalBuilder.addEdge(from, to, label);
        res.writeHead(201);
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: String(err) }));
      }
    });
    return;
  }

  // POST /scene/reset
  if (url.pathname === '/scene/reset' && req.method === 'POST') {
    globalBuilder.reset();
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'not found' }));
});

server.listen(EDITOR_PORT, () => {
  console.log(`[@onyx/editor] HTTP  → http://localhost:${EDITOR_PORT}`);
  console.log(`[@onyx/editor] WS   → ws://localhost:${EDITOR_PORT}/editor/ws`);
});

// Start WebSocket collaboration server on same port via upgrade
collab.start(EDITOR_PORT + 1); // WS on EDITOR_PORT+1 (3010)

// ─── Barrel Exports ────────────���────────────────────────────────────────────────

export { SceneBuilder } from './scene/builder';
export { SceneRenderer } from './scene/renderer';
export { SceneExporter } from './scene/exporter';
export { CollaborationServer } from './collaboration';
export { AgentSceneAPI } from './agent-integration';
export type { Scene, SceneNode, SceneEdge, SceneOperation } from './types';