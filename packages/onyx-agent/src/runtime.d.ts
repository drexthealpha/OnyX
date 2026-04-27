import { AgentRuntime, Character, Plugin, IDatabaseAdapter, RuntimeSettings, UUID } from "@elizaos/core";
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
export declare const MEMORY_TABLES: {
    readonly MESSAGE: "messages";
    readonly FACT: "facts";
    readonly DOCUMENT: "documents";
    readonly RELATIONSHIP: "relationships";
    readonly GOAL: "goals";
    readonly TASK: "tasks";
    readonly ACTION: "actions";
};
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
export declare class OnyxRuntime extends AgentRuntime {
    private gatewayUrl;
    constructor(opts: OnyxRuntimeOptions);
    private _setupTelemetry;
}
export declare function createOnyxRuntime(character: Character, plugins: Plugin[], adapter?: IDatabaseAdapter): OnyxRuntime;
export {};
//# sourceMappingURL=runtime.d.ts.map