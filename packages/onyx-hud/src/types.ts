// ─────────────────────────────────────────────
//  @onyx/hud — types.ts
//  Region, HUDStatus, ScreenContext interfaces
// ─────────────────────────────────────────────

/** A rectangular area of the screen selected by the user */
export interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Live HUD status snapshot */
export interface HUDStatus {
  /** ISO timestamp of the last status poll */
  timestamp: string;
  /** Token usage meter from gateway /metrics */
  context: {
    used: number;
    total: number;
    percent: number;
  };
  /** Names of active tool functions currently running */
  activeTools: string[];
  /** Names / IDs of active multica agents */
  activeAgents: string[];
  /** Pending RL tasks (todo items) */
  pendingTasks: TodoItem[];
}

/** A single task in the RL task queue */
export interface TodoItem {
  id: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  createdAt: string;
}

/** Extracted context from a captured screen region */
export interface ScreenContext {
  region: Region;
  imageBase64: string;
  extractedText: string;
  capturedAt: string;
}

/** Token usage returned by the context meter */
export interface TokenUsage {
  used: number;
  total: number;
  percent: number;
}

/** Multica herald message shape for screen-context topic */
export interface ScreenContextMessage {
  topic: "screen-context";
  payload: ScreenContext;
}