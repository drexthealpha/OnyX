import { AgentRuntime, EventType, IAgentRuntime, Character, Plugin, IDatabaseAdapter, RuntimeSettings, UUID } from "@elizaos/core";
import type { Memory } from "@elizaos/core";

export interface ConversationTelemetry {
  event: string;
  agentId: string;
  roomId?: string;
  entityId?: string;
  messageId?: string;
  timestamp: number;
  source?: string;
  metadata?: Record<string, unknown>;
}

export const MEMORY_TABLES = {
  MESSAGE: "messages",
  FACT: "facts",
  DOCUMENT: "documents",
  RELATIONSHIP: "relationships",
  GOAL: "goals",
  TASK: "tasks",
  ACTION: "actions",
} as const;

interface OnyxRuntimeOptions {
  conversationLength?: number;
  agentId?: UUID;
  character?: Character;
  plugins?: Plugin[];
  fetch?: typeof fetch;
  adapter?: IDatabaseAdapter;
  settings?: RuntimeSettings;
  allAvailablePlugins?: Plugin[];
  gatewayUrl?: string;
}

export class OnyxRuntime extends AgentRuntime {
  private gatewayUrl: string;

  constructor(opts: OnyxRuntimeOptions) {
    const gatewayUrl = opts.gatewayUrl ?? process.env.GATEWAY_URL ?? "http://localhost:4000";
    super({
      conversationLength: opts.conversationLength,
      agentId: opts.agentId,
      character: opts.character,
      plugins: opts.plugins,
      fetch: opts.fetch,
      adapter: opts.adapter,
      settings: opts.settings,
      allAvailablePlugins: opts.allAvailablePlugins,
    });
    this.gatewayUrl = gatewayUrl;
    this._setupTelemetry();
  }

  private _setupTelemetry(): void {
    this.registerEvent(EventType.MESSAGE_RECEIVED, async (payload: unknown) => {
      try {
        const eventPayload = payload as Record<string, unknown>;
        const telemetry: ConversationTelemetry = {
          event: EventType.MESSAGE_RECEIVED,
          agentId: this.agentId || "unknown",
          roomId: eventPayload.roomId as string | undefined,
          entityId: eventPayload.entityId as string | undefined,
          messageId: eventPayload.messageId as string | undefined,
          timestamp: Date.now(),
          source: "onyx-agent",
          metadata: eventPayload.metadata as Record<string, unknown> | undefined,
        };
        const fetchFn = this.fetch;
        const logger = this.logger;
        if (fetchFn) {
          const response = await fetchFn(this.gatewayUrl + "/telemetry", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(telemetry),
          });
          if (!response?.ok && logger?.warn) {
            logger.warn("Telemetry emission failed: non-OK response");
          }
        }
      } catch (error) {
        const logger = this.logger;
        if (logger?.warn) {
          logger.warn("Telemetry emission error: " + (error as Error).message);
        }
      }
    });
  }
}

export function createOnyxRuntime(
  character: Character,
  plugins: Plugin[],
  adapter?: IDatabaseAdapter
): OnyxRuntime {
  return new OnyxRuntime({
    character,
    plugins,
    adapter,
  });
}