/**
 * @onyx/eliza-adapter
 *
 * Bridges ONYX ConversationTelemetry ↔ ElizaOS Memory/ActionResult.
 * Subscribes to @onyx/multica 'telemetry' topic and forwards
 * memories to an ElizaOS AgentRuntime via createMemory().
 *
 * Layer: L7 Workflow
 * Depends on: @onyx/multica (herald/subscribe)
 * Peer: ElizaOS AgentRuntime (user-provided)
 */

function generateId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─── ElizaOS minimal types (local, no runtime dep on @elizaos/core) ──────────

export interface ElizaMemory {
  id?: string;
  content: { text?: string; [key: string]: unknown };
  entityId: string;
  agentId?: string;
  roomId: string;
  worldId?: string;
  createdAt?: number;
  metadata?: Record<string, unknown>;
}

export interface ElizaActionResult {
  success: boolean;
  text?: string;
  values?: Record<string, unknown>;
  data?: Record<string, unknown>;
  error?: string | Error;
}

export interface AgentRuntime {
  agentId: string;
  createMemory(
    memory: ElizaMemory,
    tableName: string,
    unique?: boolean
  ): Promise<string>;
}

// ─── ONYX ConversationTelemetry ──────────────────────────────────────────────

export interface ConversationTelemetry {
  conversationId: string;
  channelName: string;
  message: string;
  timestamp: number;
  agentId?: string;
  metadata?: Record<string, unknown>;
}

// ─── ElizaAdapter interface ───────────────────────────────────────────────────

export interface ElizaAdapter {
  /**
   * Map ONYX ConversationTelemetry → ElizaOS Memory.
   * entityId = telemetry.conversationId (stable conversation anchor)
   * roomId   = telemetry.channelName    (multica channel)
   * agentId  = 'onyx'
   */
  toElizaMemory(telemetry: ConversationTelemetry): ElizaMemory;

  /**
   * Map ElizaOS ActionResult back to ConversationTelemetry format
   * suitable for the ONYX RL pipeline.
   */
  fromElizaResult(
    result: ElizaActionResult,
    original: ConversationTelemetry
  ): ConversationTelemetry;

  /**
   * Subscribe to @onyx/multica 'telemetry' topic and forward each
   * event to elizaRuntime.createMemory() in the 'conversations' table.
   */
  bridge(elizaRuntime: AgentRuntime): void;
}

// ─── toElizaMemory ────────────────────────────────────────────────────────────

function toElizaMemory(telemetry: ConversationTelemetry): ElizaMemory {
  return {
    id: generateId(),
    entityId: telemetry.conversationId,
    agentId: telemetry.agentId ?? "onyx",
    roomId: telemetry.channelName,
    content: {
      text: telemetry.message,
      source: "onyx-eliza-adapter",
    },
    createdAt: telemetry.timestamp,
    metadata: {
      type: "message",
      source: "onyx-eliza-adapter",
      channelName: telemetry.channelName,
      ...(telemetry.metadata ?? {}),
    },
  };
}

// ─── fromElizaResult ─────────────────────────────────────────────────────────

function fromElizaResult(
  result: ElizaActionResult,
  original: ConversationTelemetry
): ConversationTelemetry {
  const errorText =
    result.error instanceof Error
      ? result.error.message
      : (result.error ?? undefined);

  return {
    conversationId: original.conversationId,
    channelName: original.channelName,
    message: result.text ?? original.message,
    timestamp: Date.now(),
    agentId: original.agentId,
    metadata: {
      ...(original.metadata ?? {}),
      elizaResult: {
        success: result.success,
        values: result.values,
        data: result.data,
        error: errorText,
      },
    },
  };
}

// ─── bridge ──────────────────────────────────────────────────────────────────

function makeBridge(elizaRuntime: AgentRuntime): void {
  (async () => {
    const { globalHerald } = await import("@onyx/multica");

    globalHerald.subscribe("telemetry", async (payload: unknown) => {
      const telemetry = payload as ConversationTelemetry;

      if (
        !telemetry ||
        typeof telemetry.conversationId !== "string" ||
        typeof telemetry.message !== "string"
      ) {
        console.warn("[onyx-eliza-adapter] Received malformed telemetry:", payload);
        return;
      }

      const memory = toElizaMemory(telemetry);

      try {
        await elizaRuntime.createMemory(memory, "conversations", false);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`[onyx-eliza-adapter] createMemory failed: ${errMsg}`);

        try {
          const { alarm } = await import("@onyx/kernel/alarm-and-abort");
          const { AlarmCode } = await import("@onyx/kernel/types");

          alarm("eliza-adapter", AlarmCode.POLICY_VIOLATION, {
            error: errMsg,
            conversationId: telemetry.conversationId,
            timestamp: Date.now(),
          });
        } catch {
          // kernel unreachable — swallow
        }
      }
    });

    console.log("[onyx-eliza-adapter] bridge: subscribed to multica 'telemetry' topic");
  })().catch((err: unknown) => {
    console.error("[onyx-eliza-adapter] bridge init failed:", err);
  });
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Create an ElizaAdapter instance.
 *
 * @param gatewayUrl  ONYX gateway base URL (e.g. http://localhost:3000)
 * @param elizaRuntime  ElizaOS AgentRuntime (must implement createMemory)
 */
export function createElizaAdapter(
  gatewayUrl: string,
  elizaRuntime: AgentRuntime
): ElizaAdapter {
  const adapter: ElizaAdapter = {
    toElizaMemory,
    fromElizaResult,
    bridge(runtime: AgentRuntime) {
      makeBridge(runtime);
    },
  };

  return adapter;
}

// ─── Convenience re-exports ───────────────────────────────────────────────────

export { toElizaMemory, fromElizaResult };