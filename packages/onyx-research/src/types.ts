// ─── Core types for @onyx/research ──────────────────────────────────────────

export interface RetrievedItem {
  url: string;
  title: string;
  content: string;
  source: "web" | "intel" | "semantic";
  retrievedAt: string;
  urlHash: string;
}

export interface Citation {
  id: string;
  url: string;
  title: string;
  excerpt: string;
}

export interface ResearchState {
  topic: string;
  subQuestions: string[];
  retrievedContent: RetrievedItem[];
  synthesis: string;
  citations: Citation[];
  report: string;
  complete: boolean;
  reflectionPassed?: boolean;
  qualityScore?: number;
  errors?: string[];
}

export interface ScheduledJob {
  id: string;
  topic: string;
  deliverAt: string;
  status: "pending" | "running" | "complete" | "failed";
  createdAt: string;
  result?: string;
  error?: string;
}

export interface ResearchSignal {
  topic: string;
  signal: "bullish" | "bearish" | "neutral" | "unknown";
  confidence: number;
  keyEntities: string[];
  summary: string;
  extractedAt: string;
}

export function createEmptyState(topic: string): ResearchState {
  return {
    topic,
    subQuestions: [],
    retrievedContent: [],
    synthesis: "",
    citations: [],
    report: "",
    complete: false,
    reflectionPassed: false,
    qualityScore: 0,
    errors: [],
  };
}