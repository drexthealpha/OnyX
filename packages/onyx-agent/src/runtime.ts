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
}

export class OnyxRuntime extends AgentRuntime {
  constructor(opts: OnyxRuntimeOptions) {
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

        const { globalHerald } = await import("@onyx/multica");
        globalHerald.publish("telemetry", telemetry);
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