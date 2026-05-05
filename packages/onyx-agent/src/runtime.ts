import { AgentRuntime, EventType, IAgentRuntime, Character, Plugin, IDatabaseAdapter, RuntimeSettings, UUID } from "@elizaos/core";
import type { Memory } from "@elizaos/core";

export interface ConversationTelemetry {
  event: string;
  agentId: string;
  roomId?: string | undefined;
  entityId?: string | undefined;
  messageId?: string | undefined;
  timestamp: number;
  source?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
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
  conversationLength?: number | undefined;
  agentId?: UUID | undefined;
  character?: Character | undefined;
  plugins?: Plugin[] | undefined;
  fetch?: typeof fetch | undefined;
  adapter?: IDatabaseAdapter | undefined;
  settings?: RuntimeSettings | undefined;
  allAvailablePlugins?: Plugin[] | undefined;
}

export class OnyxRuntime extends AgentRuntime {
  constructor(opts: OnyxRuntimeOptions) {
    const superOpts: unknown = {};
    if (opts.conversationLength !== undefined) superOpts.conversationLength = opts.conversationLength;
    if (opts.agentId !== undefined) superOpts.agentId = opts.agentId;
    if (opts.character !== undefined) superOpts.character = opts.character;
    if (opts.plugins !== undefined) superOpts.plugins = opts.plugins;
    if (opts.fetch !== undefined) superOpts.fetch = opts.fetch;
    if (opts.adapter !== undefined) superOpts.adapter = opts.adapter;
    if (opts.settings !== undefined) superOpts.settings = opts.settings;
    if (opts.allAvailablePlugins !== undefined) superOpts.allAvailablePlugins = opts.allAvailablePlugins;

    super(superOpts);
    this._setupTelemetry();
  }

  private _setupTelemetry(): void {
    this.registerEvent(EventType.MESSAGE_RECEIVED, async (payload: unknown) => {
      try {
        const eventPayload = payload as Record<string, unknown>;
        const telemetry: ConversationTelemetry = {
          event: EventType.MESSAGE_RECEIVED,
          agentId: this.agentId || "unknown",
          roomId: eventPayload['roomId'] as string | undefined,
          entityId: eventPayload['entityId'] as string | undefined,
          messageId: eventPayload['messageId'] as string | undefined,
          timestamp: Date.now(),
          source: "onyx-agent",
          metadata: eventPayload['metadata'] as Record<string, unknown> | undefined,
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
  adapter?: IDatabaseAdapter | undefined
): OnyxRuntime {
  return new OnyxRuntime({
    character,
    plugins,
    adapter,
  });
}