// ─── @onyx/research — barrel ─────────────────────────────────────────────────
export type {
  ResearchState,
  RetrievedItem,
  Citation,
  ScheduledJob,
  ResearchSignal,
} from "./types.js";

export { createEmptyState } from "./types.js";
export { ResearchGraph, runResearch } from "./graph.js";
export { plan } from "./planner.js";
export { retrieve } from "./retriever.js";
export { analyzeSource } from "./researcher.js";
export { synthesize } from "./synthesizer.js";
export { reflect } from "./reflector.js";
export { report } from "./reporter.js";
export { scheduleResearch, runScheduledJobs } from "./temporal.js";
export { extractSignal } from "./signal.js";
export { writeToSemantic } from "./memory-writer.js";
export { toMarkdownReport } from "./outputs/markdown.js";
export { toSlidesOutline } from "./outputs/slides.js";
export { toPodcastScript } from "./outputs/podcast.js";