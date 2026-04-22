// packages/onyx-compute/src/tests/job-builder.test.ts
import { describe, it, expect } from 'vitest';
import { JobBuilder, SCHEMA_VERSION, OP_TYPE } from '../nosana/job-builder.js';
import yaml from 'js-yaml';

describe('JobBuilder', () => {
  it('produces YAML with schema version "0.1"', () => {
    const yamlStr = new JobBuilder()
      .setImage('myorg/agent:latest')
      .build();

    // Must contain the version field
    expect(yamlStr).toContain(SCHEMA_VERSION);

    // Parse and assert structure
    const parsed = yaml.load(yamlStr) as { version: string; ops: unknown[] };
    expect(parsed.version).toBe('0.1');
    expect(Array.isArray(parsed.ops)).toBe(true);
    expect(parsed.ops.length).toBeGreaterThan(0);
  });

  it('includes the primary op with type "container/run"', () => {
    const yamlStr = new JobBuilder()
      .setImage('nosana/eliza-agent:v1')
      .setExpose(3000)
      .addEnv('NODE_ENV', 'production')
      .build();

    const parsed = yaml.load(yamlStr) as {
      version: string;
      ops: Array<{ type: string; args: { image: string; expose: number; env: Record<string, string> } }>;
    };

    expect(parsed.ops[0].type).toBe(OP_TYPE); // 'container/run'
    expect(parsed.ops[0].args.image).toBe('nosana/eliza-agent:v1');
    expect(parsed.ops[0].args.expose).toBe(3000);
    expect(parsed.ops[0].args.env?.NODE_ENV).toBe('production');
  });

  it('includes GPU config when setGPU() is called', () => {
    const yamlStr = new JobBuilder()
      .setImage('myorg/training:latest')
      .setGPU('A100')
      .build();

    const parsed = yaml.load(yamlStr) as {
      ops: Array<{ args: { gpu: { type: string } } }>;
    };
    expect(parsed.ops[0].args.gpu?.type).toBe('A100');
  });

  it('throws when build() is called with no image and no ops', () => {
    expect(() => new JobBuilder().build()).toThrow();
  });

  it('throws when an op has wrong type', () => {
    const badOp = {
      id: 'bad',
      type: 'wrong/type' as typeof OP_TYPE,
      args: { image: 'foo:bar' },
    };
    expect(() => new JobBuilder().setImage('base:img').addOp(badOp)).toThrow(
      /type must be "container\/run"/
    );
  });

  it('includes health check in meta when setHealthCheck() is called', () => {
    const yamlStr = new JobBuilder()
      .setImage('myorg/api:latest')
      .setHealthCheck('/health', 8080)
      .build();

    const parsed = yaml.load(yamlStr) as {
      meta?: { healthCheck?: { type: string; path: string; port: number } };
    };
    expect(parsed.meta?.healthCheck?.type).toBe('http');
    expect(parsed.meta?.healthCheck?.path).toBe('/health');
    expect(parsed.meta?.healthCheck?.port).toBe(8080);
  });
});