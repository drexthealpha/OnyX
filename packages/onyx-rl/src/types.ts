// ─── Core trajectory & reward types ────────────────────────────────────────

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

// ─── HTTP request body types ────────────────────────────────────────────────

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

// ─── Stored records ─────────────────────────────────────────────────────────

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

// ─── Rollout outcome (mirrors OpenClaw-RL RolloutOutcome) ───────────────────

export interface RolloutOutcome {
  interactions: unknown[];
  finalResponse: string | null;
  reachedIterationLimit: boolean;
  reachedParseErrorLimit: boolean;
  modelTurnCount: number;
  parseErrorCount: number;
  prmTurnScores: Record<number, number>;
  prmTurnDetails: Array<{ turnIdx: number; score: number; outputText?: string; error?: string }>;
}

// ─── Pipeline result ────────────────────────────────────────────────────────

export interface PipelineResult {
  processedCount: number;
  rewards: Reward[];
  update: PolicyUpdate;
  ranAt: number;
}