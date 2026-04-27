import { Plugin, Provider } from "@elizaos/core";
export interface NosanaJobDefinition {
    ops: Array<{
        id: string;
        args: {
            image: string;
            expose: number;
            env: Record<string, string>;
        };
        execution: {
            group: string;
        };
        type: string;
    }>;
    version: string;
}
export declare const nosanaStatusProvider: Provider;
export declare function buildNosanaJobDef(imageTag: string, envVars: Record<string, string>): NosanaJobDefinition;
export declare const nosanaPlugin: Plugin;
//# sourceMappingURL=nosana.d.ts.map