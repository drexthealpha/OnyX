import { describe, it, expect, vi } from 'vitest';
import { SceneBuilder } from '../scene/builder';
import { SceneExporter } from '../scene/exporter';

// ─── Test 1: Scene builder produces valid JSON-serializable Scene object ──────

describe('SceneBuilder', () => {
  it('produces a valid JSON-serializable Scene object', () => {
    const builder = new SceneBuilder();

    const agentId = builder.addNode(
      'agent',
      { x: 0, y: 0, z: 0 },
      { label: 'Research Agent', priority: 'high' }
    );

    const vaultId = builder.addNode(
      'vault',
      { x: 3, y: 0, z: 0 },
      { label: 'ONYX Vault', encrypted: true }
    );

    builder.addEdge(agentId, vaultId, 'reads_from');

    const scene = builder.build();

    // Shape validation
    expect(scene).toHaveProperty('nodes');
    expect(scene).toHaveProperty('edges');
    expect(Array.isArray(scene.nodes)).toBe(true);
    expect(Array.isArray(scene.edges)).toBe(true);

    // Node structure
    const agent = scene.nodes.find((n) => n.id === agentId);
    expect(agent).toBeDefined();
    expect(agent!.type).toBe('agent');
    expect(agent!.position).toMatchObject({ x: 0, y: 0, z: 0 });
    expect(agent!.config.label).toBe('Research Agent');

    // Edge structure
    const edge = scene.edges[0];
    expect(edge.from).toBe(agentId);
    expect(edge.to).toBe(vaultId);
    expect(edge.label).toBe('reads_from');

    // JSON-serializability: must not throw, and round-trip must be equal
    const json = JSON.stringify(scene);
    expect(() => JSON.parse(json)).not.toThrow();
    const reparsed = JSON.parse(json);
    expect(reparsed.nodes).toHaveLength(2);
    expect(reparsed.edges).toHaveLength(1);
  });
});

// ─── Test 2: Exporter toMermaid returns string containing '-->' ───────────────

describe('SceneExporter', () => {
  it('toMermaid returns a string containing "-->"', () => {
    const builder = new SceneBuilder();
    const exporter = new SceneExporter();

    const a = builder.addNode('agent', { x: 0, y: 0, z: 0 }, {});
    const b = builder.addNode('compute', { x: 5, y: 0, z: 0 }, {});
    builder.addEdge(a, b, 'dispatches_to');

    const scene = builder.build();
    const mermaid = exporter.toMermaid(scene);

    expect(typeof mermaid).toBe('string');
    expect(mermaid).toContain('-->');
    expect(mermaid).toContain('flowchart LR');
    expect(mermaid).toContain('dispatches_to');
  });

  it('fromJSON round-trips a scene without data loss', () => {
    const builder = new SceneBuilder();
    const exporter = new SceneExporter();

    const a = builder.addNode('router', { x: 1, y: 2, z: 3 }, { name: 'X402 Router' });
    const b = builder.addNode('vault', { x: 4, y: 5, z: 6 }, { name: 'Treasury' });
    builder.addEdge(a, b, 'routes_payment_to');

    const original = builder.build();
    const json = exporter.toJSON(original);
    const restored = exporter.fromJSON(json);

    expect(restored.nodes).toHaveLength(2);
    expect(restored.edges).toHaveLength(1);
    expect(restored.nodes[0].position.x).toBe(1);
    expect(restored.edges[0].label).toBe('routes_payment_to');
  });
});

// ─── Test 3: Agent addNode generates non-null position with x, y, z fields ───

describe('AgentSceneAPI (mocked Claude)', () => {
  it('addNode generates a non-null position with x, y, z fields', async () => {
    // Mock the Anthropic SDK so no real API call is made
    vi.mock('@anthropic-ai/sdk', () => {
      return {
        default: class MockAnthropic {
          messages = {
            create: vi.fn().mockResolvedValue({
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    type: 'agent',
                    position: { x: 2.5, y: 0, z: -1.5 },
                    config: { label: 'Mock Tutor Agent' },
                  }),
                },
              ],
            }),
          };
        },
      };
    });

    // Import after mocking
    const { AgentSceneAPI } = await import('../agent-integration');
    const api = new AgentSceneAPI('mock-key');

    const nodeId = await api.addNode('A tutor agent that teaches coding');

    expect(typeof nodeId).toBe('string');
    expect(nodeId.length).toBeGreaterThan(0);

    const scene = api.getScene();
    const node = scene.nodes.find((n) => n.id === nodeId);

    expect(node).toBeDefined();
    expect(node!.position).not.toBeNull();
    expect(typeof node!.position.x).toBe('number');
    expect(typeof node!.position.y).toBe('number');
    expect(typeof node!.position.z).toBe('number');
  });
});