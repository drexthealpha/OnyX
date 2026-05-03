/**
 * Collection: onyx_skills
 * Stores reusable skill definitions — tool specs, agent instructions, procedures.
 *
 * Vector size: 384 (all-MiniLM-L6-v2)
 */
import { type SearchResult } from '../search.js';
export interface SkillPoint {
    id: string;
    text: string;
    payload: {
        timestamp: number;
        name: string;
        version: string;
        category?: string;
        schema?: unknown;
        [key: string]: unknown;
    };
}
export interface SkillResult extends SearchResult {
    payload: SkillPoint['payload'];
}
declare function upsert(points: SkillPoint[]): Promise<void>;
declare function searchSkills(query: string, topK?: number): Promise<SkillResult[]>;
declare function deleteSkills(ids: string[]): Promise<void>;
declare function get(id: string): Promise<SkillPoint['payload'] | null>;
export declare const skills: {
    upsert: typeof upsert;
    search: typeof searchSkills;
    delete: typeof deleteSkills;
    get: typeof get;
};
export {};
//# sourceMappingURL=skills.d.ts.map