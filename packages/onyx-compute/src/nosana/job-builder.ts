// packages/onyx-compute/src/nosana/job-builder.ts
//
// Fluent builder for Nosana job definitions.
// Canonical format from: nosana-ci/agent-challenge/nos_job_def/nosana_eliza_job_definition.json
//
// Output schema (version "0.1"):
// {
//   "version": "0.1",
//   "ops": [
//     {
//       "id": "<opId>",
//       "type": "container/run",
//       "args": {
//         "image": "docker-image:tag",
//         "expose": 3000,
//         "env": { "KEY": "VALUE" },
//         "gpu": { "type": "A100" },       // optional
//         "resources": [...]               // optional
//       },
//       "execution": { "group": "run" }
//     }
//   ]
// }

import yaml from 'js-yaml';

export const SCHEMA_VERSION = '0.1' as const;
export const OP_TYPE = 'container/run' as const;

export interface NosanaGPU {
  type: string; // e.g. 'A100', 'RTX4090', 'H100'
}

export interface NosanaVolume {
  name: string;
  size: number; // bytes
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

export interface JobDefinition {
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
export class JobBuilder {
  private image: string = '';
  private ops: NosanaOp[] = [];
  private volumes: NosanaVolume[] = [];
  private healthCheck: NosanaHealthCheck | null = null;
  private gpu: NosanaGPU | null = null;
  private env: Record<string, string> = {};
  private expose: number | null = null;
  private opIdCounter = 0;

  /** Set the primary Docker image for the job. */
  setImage(image: string): this {
    if (!image || image.trim() === '') {
      throw new Error('JobBuilder: image must be a non-empty string.');
    }
    this.image = image.trim();
    return this;
  }

  /** Add an environment variable. */
  addEnv(key: string, value: string): this {
    this.env[key] = value;
    return this;
  }

  /** Bulk-add environment variables. */
  setEnv(env: Record<string, string>): this {
    this.env = { ...this.env, ...env };
    return this;
  }

  /** Expose a container port. */
  setExpose(port: number): this {
    this.expose = port;
    return this;
  }

  /** Append a fully-formed op. */
  addOp(op: NosanaOp): this {
    if (op.type !== OP_TYPE) {
      throw new Error(
        `JobBuilder: op.type must be "${OP_TYPE}". Got "${op.type}".`
      );
    }
    this.ops.push(op);
    return this;
  }

  /** Add a named volume (persisted storage). */
  addVolume(name: string, size: number): this {
    if (!name) throw new Error('JobBuilder: volume name must be non-empty.');
    if (size <= 0) throw new Error('JobBuilder: volume size must be positive.');
    this.volumes.push({ name, size });
    return this;
  }

  /**
   * Configure the HTTP health check endpoint.
   * @param path - URL path (e.g. '/health')
   * @param port - container port
   * @param method - HTTP method (default GET)
   * @param expectedStatus - expected HTTP status (default 200)
   */
  setHealthCheck(
    path: string,
    port: number,
    method: 'GET' | 'POST' = 'GET',
    expectedStatus = 200
  ): this {
    this.healthCheck = { type: 'http', path, port, method, expectedStatus };
    return this;
  }

  /**
   * Request a specific GPU type.
   * @param type - GPU model string, e.g. 'A100', 'RTX4090', 'H100'
   */
  setGPU(type: string): this {
    if (!type) throw new Error('JobBuilder: GPU type must be non-empty.');
    this.gpu = { type };
    return this;
  }

  /**
   * Build and return the job definition as a YAML string.
   * Validates schema version and op types before serialising.
   */
  build(): string {
    if (!this.image && this.ops.length === 0) {
      throw new Error(
        'JobBuilder: call setImage() or addOp() before build().'
      );
    }

    const finalOps: NosanaOp[] = [...this.ops];

    // Auto-generate primary op from setImage() if caller used the simple API
    if (this.image) {
      const args: NosanaOp['args'] = { image: this.image };
      if (this.expose !== null) args.expose = this.expose;
      if (Object.keys(this.env).length > 0) args.env = { ...this.env };
      if (this.gpu) args.gpu = { ...this.gpu };
      if (this.volumes.length > 0) args.resources = [...this.volumes];

      finalOps.unshift({
        id: `op-${++this.opIdCounter}`,
        type: OP_TYPE,
        args,
        execution: { group: 'run' },
      });
    }

    if (finalOps.length === 0) {
      throw new Error('JobBuilder: at least one op is required.');
    }

    // Validate all ops
    for (const op of finalOps) {
      if (op.type !== OP_TYPE) {
        throw new Error(
          `JobBuilder: all ops must have type "${OP_TYPE}". Found "${op.type}".`
        );
      }
      if (!op.args?.image) {
        throw new Error(`JobBuilder: op "${op.id}" must have args.image set.`);
      }
    }

    const definition: JobDefinition = {
      version: SCHEMA_VERSION,
      ops: finalOps,
    };

    if (this.healthCheck) {
      definition.meta = { healthCheck: this.healthCheck };
    }

    // Serialize as YAML
    const yamlStr = yaml.dump(definition, {
      indent: 2,
      lineWidth: 120,
      noRefs: true,
    });

    // Final assertion — schema version must appear in output
    if (!yamlStr.includes(`version: '${SCHEMA_VERSION}'`) &&
        !yamlStr.includes(`version: "${SCHEMA_VERSION}"`) &&
        !yamlStr.includes(`version: ${SCHEMA_VERSION}`)) {
      throw new Error(
        `JobBuilder: serialised YAML does not contain schema version "${SCHEMA_VERSION}".`
      );
    }

    return yamlStr;
  }

  /**
   * Build and return the job definition as a plain JS object.
   * Useful for JSON serialisation before IPFS upload.
   */
  buildObject(): JobDefinition {
    // Parse our own YAML to get the validated object
    const yamlStr = this.build();
    return yaml.load(yamlStr) as JobDefinition;
  }
}