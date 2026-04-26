import { WebSocketServer, WebSocket } from 'ws';
import type { SceneOperation, CollaborationSession } from './types';
import { SceneBuilder } from './scene/builder';

export class CollaborationServer {
  private wss!: WebSocketServer;
  private sessions: Map<string, CollaborationSession> = new Map();
  private sceneBuilders: Map<string, SceneBuilder> = new Map();
  private userSockets: Map<string, WebSocket> = new Map();
  private userClocks: Map<string, number> = new Map();
  private serverRunning = false;

  start(port: number): void {
    if (this.serverRunning) {
      return;
    }

    this.wss = new WebSocketServer({ port, path: '/editor/ws' });
    this.serverRunning = true;

    this.wss.on('connection', (ws: WebSocket) => {
      let currentUserId: string | null = null;
      let currentSceneId: string | null = null;

      ws.on('message', (raw: Buffer) => {
        try {
          const msg = JSON.parse(raw.toString()) as Record<string, unknown>;

          if (msg.action === 'join') {
            const sceneId = String(msg.sceneId ?? '');
            const userId = String(msg.userId ?? '');
            currentSceneId = sceneId;
            currentUserId = userId;
            this.join(sceneId, userId);
            this.userSockets.set(userId, ws);
            ws.send(JSON.stringify({ type: 'joined', sceneId, userId }));
            return;
          }

          if (msg.type && currentSceneId && currentUserId) {
            const op: SceneOperation = {
              type: msg.type as SceneOperation['type'],
              payload: msg.payload ?? {},
              userId: currentUserId,
              timestamp: Date.now(),
              vectorClock: msg.vectorClock as Record<string, number> | undefined,
            };
            this.applyOperation(op, currentSceneId);
          }
        } catch (err) {
          ws.send(JSON.stringify({ type: 'error', message: String(err) }));
        }
      });

      ws.on('close', () => {
        if (currentUserId) {
          this.userSockets.delete(currentUserId);
          if (currentSceneId) {
            this.sessions.get(currentSceneId)?.users.delete(currentUserId);
          }
        }
      });
    });
  }

  join(sceneId: string, userId: string): void {
    if (!this.sessions.has(sceneId)) {
      this.sessions.set(sceneId, {
        sceneId,
        users: new Set(),
        vectorClocks: new Map(),
      });
      this.sceneBuilders.set(sceneId, new SceneBuilder());
    }
    this.sessions.get(sceneId)!.users.add(userId);
    if (!this.userClocks.has(userId)) {
      this.userClocks.set(userId, 0);
    }
  }

  applyOperation(op: SceneOperation, sceneId: string): void {
    const session = this.sessions.get(sceneId);
    const builder = this.sceneBuilders.get(sceneId);
    if (!session || !builder) return;

    const prevClock = this.userClocks.get(op.userId) ?? 0;
    const newClock = Math.max(prevClock, op.timestamp);
    this.userClocks.set(op.userId, newClock + 1);

    const payload = op.payload as Record<string, unknown>;
    const nodeId = String(payload?.nodeId ?? payload?.id ?? '');

    if (nodeId) {
      const existingClocks = session.vectorClocks.get(nodeId) ?? {};
      const existingMaxTime = Math.max(0, ...Object.values(existingClocks));
      const incomingTime = op.vectorClock?.[op.userId] ?? op.timestamp;

      if (incomingTime < existingMaxTime) {
        return;
      }

      existingClocks[op.userId] = Math.max(
        existingClocks[op.userId] ?? 0,
        incomingTime
      );
      session.vectorClocks.set(nodeId, existingClocks);
    }

    try {
      switch (op.type) {
        case 'addNode': {
          const p = payload as {
            type?: string;
            position?: { x: number; y: number; z: number };
            config?: Record<string, unknown>;
          };
          builder.addNode(
            p.type ?? 'unknown',
            p.position ?? { x: 0, y: 0, z: 0 },
            p.config ?? {}
          );
          break;
        }
        case 'addEdge': {
          const p = payload as { from?: string; to?: string; label?: string };
          if (p.from && p.to && p.label) {
            try {
              builder.addEdge(p.from, p.to, p.label ?? '');
            } catch {
              // silently skip
            }
          }
          break;
        }
        case 'removeNode':
        case 'updateNode':
          break;
      }
    } catch {
      // non-fatal
    }

    const merged = {
      ...op,
      timestamp: Date.now(),
      vectorClock: Object.fromEntries(this.userClocks),
      sceneId,
    };

    for (const userId of session.users) {
      const sock = this.userSockets.get(userId);
      if (sock && sock.readyState === WebSocket.OPEN) {
        sock.send(JSON.stringify(merged));
      }
    }
  }

  getScene(sceneId: string) {
    const builder = this.sceneBuilders.get(sceneId);
    return builder ? builder.build() : null;
  }

  close(): void {
    this.wss?.close();
    this.serverRunning = false;
  }
}