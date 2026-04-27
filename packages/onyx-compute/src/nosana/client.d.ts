import { type NosanaClient } from '@nosana/kit';
/**
 * Returns the singleton Nosana client.
 * Lazily initialised on first call.
 * Throws if NOSANA_PRIVATE_KEY is not set.
 */
export declare function getNosanaClient(): Promise<NosanaClient>;
/**
 * Reset the singleton (useful in tests).
 */
export declare function _resetClient(): void;
//# sourceMappingURL=client.d.ts.map