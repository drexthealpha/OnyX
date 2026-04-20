declare module "@elizaos/core" {
  export type UUID = string;

  export interface Memory {
    id?: UUID;
    content: {
      text: string;
      [key: string]: unknown;
    };
    entityId: UUID;
    roomId: UUID;
    agentId: UUID;
    createdAt?: number;
  }

  export interface State {
    data?: Record<string, unknown>;
    [key: string]: unknown;
  }

  export interface RuntimeSettings {
    [key: string]: unknown;
  }

  export interface Agent {
    id: UUID;
    name: string;
    [key: string]: unknown;
  }

  export const enum EventType {
    MESSAGE_RECEIVED = "MESSAGE_RECEIVED",
    POST_GENERATED = "POST_GENERATED",
    ACTION_STARTED = "ACTION_STARTED",
    ACTION_COMPLETED = "ACTION_COMPLETED",
    SERVICE_STARTED = "SERVICE_STARTED",
    SERVICE_ERROR = "SERVICE_ERROR",
    MODEL_USED = "MODEL_USED",
    ENTITY_JOINED = "ENTITY_JOINED",
    RESPONSE_GENERATED = "RESPONSE_GENERATED",
  }

  export const enum ModelType {
    TEXT_LARGE = "TEXT_LARGE",
    TEXT_SMALL = "TEXT_SMALL",
    TEXT_EMBEDDING = "TEXT_EMBEDDING",
    IMAGE = "IMAGE",
    AUDIO_TRANSCRIPTION = "AUDIO_TRANSCRIPTION",
  }

  export interface Character {
    id?: UUID;
    name: string;
    username?: string;
    bio: string | string[];
    lore?: string[];
    system?: string;
    plugins?: string[];
    clients?: string[];
    modelProvider?: string;
    settings?: { model?: string; secrets?: Record<string, string>; [key: string]: unknown };
    knowledge?: string[];
    messageExamples?: MessageExample[][];
    postExamples?: string[];
    topics?: string[];
    adjectives?: string[];
    style?: { all?: string[]; chat?: string[]; post?: string[] };
    templates?: Record<string, string>;
  }

  export type MessageExample = {
    role: "user" | "assistant" | "system";
    content: {
      text: string;
      [key: string]: unknown;
    };
  };

  export interface Action {
    name: string;
    similes: string[];
    description: string;
    validate: (runtime: IAgentRuntime, message: Memory, state?: State) => Promise<boolean>;
    handler: (
      runtime: IAgentRuntime,
      message: Memory,
      state: State | undefined,
      options: HandlerOptions | undefined,
      callback: HandlerCallback
    ) => Promise<ActionResult>;
    examples: MessageExample[][];
  }

  export interface HandlerOptions {
    [key: string]: unknown;
  }

  export interface HandlerCallback {
    (options: { text: string; success: boolean; values?: Record<string, unknown>; data?: unknown }): Promise<ActionResult>;
  }

  export interface ActionResult {
    success: boolean;
    text?: string;
    values?: Record<string, unknown>;
    data?: unknown;
    error?: string;
  }

  export interface Provider {
    name: string;
    description?: string;
    position?: number;
    dynamic?: boolean;
    private?: boolean;
    get: (runtime: IAgentRuntime, message: Memory, state?: State) => Promise<ProviderResult>;
  }

  export interface ProviderResult {
    text?: string;
    values?: Record<string, unknown>;
    data?: unknown;
  }

  export interface Evaluator {
    alwaysRun?: boolean;
    name: string;
    similes?: string[];
    description: string;
    validate: (runtime: IAgentRuntime, message: Memory, state?: State) => Promise<boolean>;
    handler: (runtime: IAgentRuntime, message: Memory, state?: State) => Promise<void>;
    examples: EvaluationExample[];
  }

  export interface EvaluationExample {
    [key: string]: unknown;
  }

  export interface Task {
    id?: UUID;
    [key: string]: unknown;
  }

  export interface Plugin {
    name: string;
    description: string;
    actions?: Action[];
    providers?: Provider[];
    evaluators?: Evaluator[];
    services?: (typeof Service)[];
    events?: Record<string, ((payload: unknown) => Promise<void>)[]>;
    routes?: unknown[];
    models?: Record<string, unknown>;
    dependencies?: string[];
    config?: Record<string, unknown>;
    init?: (config: Record<string, string>, runtime: IAgentRuntime) => Promise<void>;
    tests?: unknown[];
  }

  export interface IAgentRuntime {
    agentId: UUID;
    character: Character;
    actions: Action[];
    evaluators: Evaluator[];
    providers: Provider[];
    plugins: Plugin[];
    logger?: {
      info?: (msg: string) => void;
      warn?: (msg: string) => void;
      error?: (msg: string) => void;
      debug?: (msg: string) => void;
    };
    getSetting?: (key: string) => string | undefined;
    setSetting?: (key: string, value: string) => void;
    createMemory: (memory: Memory, tableName: string, unique?: boolean) => Promise<UUID>;
    getMemories: (params: {
      roomId: UUID;
      tableName: string;
      count?: number;
      unique?: boolean;
      start?: number;
      end?: number;
    }) => Promise<Memory[]>;
    getMemoryById: (id: UUID) => Promise<Memory | null>;
    searchMemories: (params: {
      tableName: string;
      agentId: UUID;
      embedding: number[];
      match_threshold?: number;
      count?: number;
      roomId?: UUID;
      unique?: boolean;
    }) => Promise<Memory[]>;
    deleteMemory: (memoryId: UUID) => Promise<void>;
    clearAllAgentMemories: () => Promise<void>;
    createTask: (task: Partial<Task>) => Promise<UUID>;
    emitEvent: (event: string | string[], params: unknown) => Promise<void>;
    composeState: (message: Memory, providers?: string[]) => Promise<State>;
    useModel: <T extends keyof ModelParamsMap>(modelType: T, params: ModelParamsMap[T]) => Promise<ModelResultMap[T]>;
    ensureAgentExists: (agent: Partial<Agent>) => Promise<Agent>;
    ensureConnection: (params: unknown) => Promise<void>;
    ensureRoomExists: (params: unknown) => Promise<void>;
    ensureParticipantInRoom: (entityId: UUID, roomId: UUID) => Promise<void>;
    initialize: (options?: { skipMigrations?: boolean }) => Promise<void>;
    stop: () => Promise<void>;
    fetch?: typeof fetch;
  }

  export interface ModelParamsMap {
    TEXT_LARGE: { prompt: string };
    TEXT_SMALL: { prompt: string };
    TEXT_EMBEDDING: { text: string };
    IMAGE: unknown;
    AUDIO_TRANSCRIPTION: unknown;
  }

  export interface ModelResultMap {
    TEXT_LARGE: string;
    TEXT_SMALL: string;
    TEXT_EMBEDDING: number[];
    IMAGE: unknown;
    AUDIO_TRANSCRIPTION: unknown;
  }

  export class AgentRuntime {
    constructor(opts: {
      conversationLength?: number;
      agentId?: UUID;
      character?: Character;
      plugins?: Plugin[];
      fetch?: typeof fetch;
      adapter?: IDatabaseAdapter;
      settings?: RuntimeSettings;
      allAvailablePlugins?: Plugin[];
    });
    agentId: UUID;
    character: Character;
    actions: Action[];
    evaluators: Evaluator[];
    providers: Provider[];
    plugins: Plugin[];
    logger?: IAgentRuntime["logger"];
    getSetting?: (key: string) => string | undefined;
    setSetting?: (key: string, value: string) => void;
    createMemory: IAgentRuntime["createMemory"];
    getMemories: IAgentRuntime["getMemories"];
    getMemoryById: IAgentRuntime["getMemoryById"];
    searchMemories: IAgentRuntime["searchMemories"];
    deleteMemory: IAgentRuntime["deleteMemory"];
    clearAllAgentMemories: IAgentRuntime["clearAllAgentMemories"];
    createTask: IAgentRuntime["createTask"];
    emitEvent: IAgentRuntime["emitEvent"];
    composeState: IAgentRuntime["composeState"];
    useModel: IAgentRuntime["useModel"];
    ensureAgentExists: IAgentRuntime["ensureAgentExists"];
    ensureConnection: IAgentRuntime["ensureConnection"];
    ensureRoomExists: IAgentRuntime["ensureRoomExists"];
    ensureParticipantInRoom: IAgentRuntime["ensureParticipantInRoom"];
    initialize: IAgentRuntime["initialize"];
    stop: IAgentRuntime["stop"];
    fetch?: typeof fetch;
    registerPlugin: (plugin: Plugin) => Promise<void>;
    registerAction: (action: Action) => void;
    registerProvider: (provider: Provider) => void;
    registerEvaluator: (evaluator: Evaluator) => void;
    registerModel: (modelType: string, handler: unknown, pluginName: string, priority?: number) => void;
    registerEvent: (eventName: string, handler: (payload: unknown) => Promise<void>) => void;
    registerTaskWorker: (worker: unknown) => void;
    registerService: (serviceDef: typeof Service) => Promise<void>;
  }

  export interface IDatabaseAdapter {
    createMemory: (memory: Memory, tableName: string) => Promise<UUID>;
    getMemories: (params: unknown) => Promise<Memory[]>;
    getMemoryById: (id: UUID) => Promise<Memory | null>;
    searchMemories: (params: unknown) => Promise<Memory[]>;
    deleteMemory: (memoryId: UUID) => Promise<void>;
    getAgent: (agentId: UUID) => Promise<Agent | null>;
    getAgentByName: (name: string) => Promise<Agent | null>;
    createAgent: (agent: Partial<Agent>) => Promise<Agent>;
    updateAgent: (agent: Partial<Agent>) => Promise<Agent>;
    getRoom: (roomId: UUID) => Promise<unknown>;
    getRoomsByAgentId: (agentId: UUID) => Promise<unknown[]>;
    createRoom: (room: unknown) => Promise<unknown>;
    getParticipant: (params: unknown) => Promise<unknown>;
    getParticipantsByRoomId: (roomId: UUID) => Promise<unknown[]>;
    createParticipant: (participant: unknown) => Promise<unknown>;
    getEntity: (entityId: UUID) => Promise<unknown>;
    getEntitiesByWorldId: (worldId: UUID) => Promise<unknown[]>;
    createEntity: (entity: unknown) => Promise<unknown>;
  }

  export class Service {
    static runtime: IAgentRuntime;
    constructor(runtime: IAgentRuntime);
  }

  export type ServiceTypeName = "database" | "embedding" | "transcription" | "image";
}