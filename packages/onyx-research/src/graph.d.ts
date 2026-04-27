import type { ResearchState } from "./types.js";
type Node = (state: ResearchState) => Promise<ResearchState>;
export declare class ResearchGraph {
    private edges;
    constructor(edges?: {
        name: string;
        fn: Node;
    }[]);
    run(topic: string): Promise<ResearchState>;
}
export declare function runResearch(topic: string): Promise<ResearchState>;
export {};
//# sourceMappingURL=graph.d.ts.map