// ============================================================
// packages/onyx-seo/src/index.ts
// Barrel export — @onyx/seo public API
// ============================================================

export { writeArticle } from "./commands/write.js";
export { research } from "./commands/research.js";
export { rewrite } from "./commands/rewrite.js";
export { optimize } from "./commands/optimize.js";
export { publish } from "./commands/publish.js";

export { createContentAnalyzer } from "./agents/content-analyzer.js";
export { createSEOOptimizer } from "./agents/seo-optimizer.js";
export { createMetaCreator } from "./agents/meta-creator.js";
export { createInternalLinker } from "./agents/internal-linker.js";
export { createKeywordMapper } from "./agents/keyword-mapper.js";
export { createEditor } from "./agents/editor.js";
export { createHeadlineGenerator } from "./agents/headline-generator.js";
export { createCROAnalyst } from "./agents/cro-analyst.js";
export { createLandingPageOptimizer } from "./agents/landing-page-optimizer.js";

export { getPagePerformance } from "./data/google-analytics.js";
export { getKeywordMetrics, getSERPResults } from "./data/dataforseo.js";

export type {
  SEOAgent,
  ContentOpportunity,
  Article,
  KeywordMetric,
  SERPResult,
  PagePerformance,
  PublishResult,
} from "./types.js";