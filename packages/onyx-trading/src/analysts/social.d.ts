/**
 * Social sentiment analyst — uses @onyx/intel x-twitter source
 * Falls back to neutral if intel package unavailable
 * Operator cost: $0 — user provides TWITTER_BEARER_TOKEN
 */
import { SocialAnalysis } from '../types.js';
export declare function analyzeSocial(token: string): Promise<SocialAnalysis>;
//# sourceMappingURL=social.d.ts.map