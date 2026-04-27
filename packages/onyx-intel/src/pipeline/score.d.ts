import type { Source } from "../types.ts";
/**
 * Score a single source against a query.
 *
 * Formula:
 *   keywordMatch  = countMatches(snippet, queryWords) / queryWords.length     [0-1]
 *   authorityWeight = platformWeights[platform]                               [0-1]
 *   engagementNorm  = Math.min(engagement / 1000, 1)                          [0-1]
 *   recencyDecay    = 1 / Math.log(ageHours + Math.E)                         [0-1]
 *   final = keywordMatch*0.3 + authorityWeight*0.2 + engagementNorm*0.2 + recencyDecay*0.3
 */
export declare function scoreSource(source: Source, query: string): number;
/**
 * Score all sources in-place and return sorted array (highest score first).
 */
export declare function scoreAndSort(sources: Source[], query: string): Source[];
//# sourceMappingURL=score.d.ts.map