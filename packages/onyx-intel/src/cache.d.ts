import type { IntelBrief } from "./types.ts";
/**
 * Retrieve a cached IntelBrief for a topic.
 * Returns null if not found or if TTL has expired.
 */
export declare function get(topic: string): IntelBrief | null;
/**
 * Store an IntelBrief in the cache.
 */
export declare function set(topic: string, brief: IntelBrief): void;
/**
 * Check whether a cached entry for a topic has expired (age > TTL).
 * Returns true if entry does not exist (treat missing as expired).
 */
export declare function isExpired(topic: string): boolean;
//# sourceMappingURL=cache.d.ts.map