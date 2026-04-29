export interface Trajectory {
    id: string;
    conversationId: string;
    message: string;
    response: string;
    toolsUsed: string[];
    latencyMs: number;
    tokensUsed: number;
    timestamp: number;
}
export interface Reward {
    trajectoryId: string;
    value: number;
    components: {
        completion: number;
        feedback: number;
        latency: number;
        efficiency: number;
    };
}
export interface PolicyUpdate {
    timestamp: number;
    gradientSignal: number;
    affectedSkills: string[];
}
export interface ConversationTelemetry {
    conversationId: string;
    message: string;
    response: string;
    toolsUsed?: string[];
    latencyMs: number;
    tokensUsed: number;
}
export interface OutcomePayload {
    trajectoryId: string;
    success: boolean;
    details: string;
}
export interface FeedbackPayload {
    trajectoryId: string;
    thumbsUp: boolean;
}
export interface OutcomeRecord {
    trajectoryId: string;
    success: boolean;
    details: string;
    recordedAt: number;
}
export interface FeedbackRecord {
    trajectoryId: string;
    thumbsUp: boolean;
    recordedAt: number;
}
export interface RolloutOutcome {
    interactions: unknown[];
    finalResponse: string | null;
    reachedIterationLimit: boolean;
    reachedParseErrorLimit: boolean;
    modelTurnCount: number;
    parseErrorCount: number;
    prmTurnScores: Record<number, number>;
    prmTurnDetails: Array<{
        turnIdx: number;
        score: number;
        outputText?: string;
        error?: string;
    }>;
}
export interface PipelineResult {
    processedCount: number;
    rewards: Reward[];
    update: PolicyUpdate;
    ranAt: number;
}
//# sourceMappingURL=types.d.ts.map