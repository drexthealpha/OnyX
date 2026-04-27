import type { Source } from "../types.ts";
/**
 * Synthesize sources into a grounded intelligence brief via Claude.
 * Cites every claim with [Source N]. Max 200 words.
 * Requires ANTHROPIC_API_KEY environment variable.
 */
export declare function synthesize(sources: Source[], topic: string): Promise<string>;
//# sourceMappingURL=synthesize.d.ts.map