import type { ResearchState } from "./types.js";
export interface WriteResult {
    success: boolean;
    id?: string;
    error?: string;
}
export declare function writeToSemantic(result: ResearchState): Promise<WriteResult>;
//# sourceMappingURL=memory-writer.d.ts.map