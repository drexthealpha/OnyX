/**
 * @onyx/semantic — Qdrant vector store layer for ONYX
 *
 * Barrel export. All public surface lives here.
 * Usage:
 *   import { createSemanticClient } from '@onyx/semantic';
 *   const sem = createSemanticClient();
 *   await sem.memories.upsert([{ id: 'abc', text: 'hello', payload: { timestamp: Date.now() } }]);
 *   const results = await sem.memories.search('hello', 5);
 */
export declare const NAME = "onyx-semantic";
export { createSemanticClient } from './client.js';
export type { SemanticClient } from './client.js';
export { embed } from './embed.js';
export { search, search as semanticSearch } from './search.js';
export type { SearchResult } from './search.js';
export { memories } from './collections/memories.js';
export { documents } from './collections/documents.js';
export { research } from './collections/research.js';
export { skills } from './collections/skills.js';
export { marketSignals } from './collections/market-signals.js';
export type { MemoryPoint, MemoryResult } from './collections/memories.js';
export type { DocumentPoint, DocumentResult } from './collections/documents.js';
export type { ResearchPoint, ResearchResult } from './collections/research.js';
export type { SkillPoint, SkillResult } from './collections/skills.js';
export type { MarketSignalPoint, MarketSignalResult } from './collections/market-signals.js';
//# sourceMappingURL=index.d.ts.map