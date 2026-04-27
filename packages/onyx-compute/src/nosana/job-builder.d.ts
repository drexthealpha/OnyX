export declare const SCHEMA_VERSION: "0.1";
export declare const OP_TYPE: "container/run";
export interface NosanaGPU {
    type: string;
}
export interface NosanaVolume {
    name: string;
    size: number;
}
export interface NosanaHealthCheck {
    type: 'http';
    path: string;
    port: number;
    method: 'GET' | 'POST';
    expectedStatus: number;
}
export interface NosanaOp {
    id: string;
    type: typeof OP_TYPE;
    args: {
        image: string;
        expose?: number;
        env?: Record<string, string>;
        gpu?: NosanaGPU;
        resources?: NosanaVolume[];
        cmd?: string[];
        workDir?: string;
    };
    execution?: {
        group: string;
    };
}
interface JobDefinition {
    version: typeof SCHEMA_VERSION;
    ops: NosanaOp[];
    meta?: {
        trigger?: string;
        healthCheck?: NosanaHealthCheck;
    };
}
/**
 * Fluent builder for Nosana job definitions.
 *
 * @example
 * ```ts
 * const yamlStr = new JobBuilder()
 *   .setImage('myorg/myagent:latest')
 *   .setGPU('A100')
 *   .setHealthCheck('/health', 3000)
 *   .addEnv('OPENAI_API_KEY', 'xxx')
 *   .build();
 * ```
 */
export declare class JobBuilder {
    private image;
    private ops;
    private volumes;
    private healthCheck;
    private gpu;
    private env;
    private expose;
    private opIdCounter;
    /** Set the primary Docker image for the job. */
    setImage(image: string): this;
    /** Add an environment variable. */
    addEnv(key: string, value: string): this;
    /** Bulk-add environment variables. */
    setEnv(env: Record<string, string>): this;
    /** Expose a container port. */
    setExpose(port: number): this;
    /** Append a fully-formed op. */
    addOp(op: NosanaOp): this;
    /** Add a named volume (persisted storage). */
    addVolume(name: string, size: number): this;
    /**
     * Configure the HTTP health check endpoint.
     * @param path - URL path (e.g. '/health')
     * @param port - container port
     * @param method - HTTP method (default GET)
     * @param expectedStatus - expected HTTP status (default 200)
     */
    setHealthCheck(path: string, port: number, method?: 'GET' | 'POST', expectedStatus?: number): this;
    /**
     * Request a specific GPU type.
     * @param type - GPU model string, e.g. 'A100', 'RTX4090', 'H100'
     */
    setGPU(type: string): this;
    /**
     * Build and return the job definition as a YAML string.
     * Validates schema version and op types before serialising.
     */
    build(): string;
    /**
     * Build and return the job definition as a plain JS object.
     * Useful for JSON serialisation before IPFS upload.
     */
    buildObject(): JobDefinition;
}
export {};
//# sourceMappingURL=job-builder.d.ts.map