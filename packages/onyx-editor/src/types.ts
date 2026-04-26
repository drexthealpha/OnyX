// ─── Core Scene Types ────────────────────────────────────────────────────────

export interface SceneNode {
  id: string;
  type: string;
  position: { x: number; y: number; z: number };
  config: Record<string, unknown>;
}

export interface SceneEdge {
  from: string;
  to: string;
  label: string;
}

export interface Scene {
  nodes: SceneNode[];
  edges: SceneEdge[];
}

// ─── Collaboration Types ──────────────────────────────────────────────────────

export type SceneOperationType =
  | 'addNode'
  | 'removeNode'
  | 'addEdge'
  | 'updateNode';

export interface SceneOperation {
  type: SceneOperationType;
  payload: unknown;
  userId: string;
  timestamp: number;
  /** Vector clock entry: { [userId]: logicalTime } */
  vectorClock?: Record<string, number>;
}

export interface CollaborationSession {
  sceneId: string;
  users: Set<string>;
  /** nodeId → { userId → logicalTime } for last-write-wins */
  vectorClocks: Map<string, Record<string, number>>;
}