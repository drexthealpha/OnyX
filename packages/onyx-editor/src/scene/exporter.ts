import type { Scene, SceneNode, SceneEdge } from '../types';

/**
 * SceneExporter — serialization and Mermaid export.
 * Inspired by pascalorg/editor's clean data-layer separation.
 */
export class SceneExporter {
  /**
   * Serialize a Scene to a JSON string.
   * Scene is already plain-data so this is a clean JSON.stringify.
   */
  toJSON(scene: Scene): string {
    return JSON.stringify(scene, null, 2);
  }

  /**
   * Deserialize a JSON string back to a Scene.
   * Validates top-level shape; throws on malformed input.
   */
  fromJSON(json: string): Scene {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      throw new Error('SceneExporter.fromJSON: invalid JSON string');
    }

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !Array.isArray((parsed as Record<string, unknown>).nodes) ||
      !Array.isArray((parsed as Record<string, unknown>).edges)
    ) {
      throw new Error(
        'SceneExporter.fromJSON: object must have nodes[] and edges[] arrays'
      );
    }

    const raw = parsed as { nodes: unknown[]; edges: unknown[] };

    const nodes: SceneNode[] = raw.nodes.map((n, i) => {
      const node = n as Record<string, unknown>;
      if (
        typeof node.id !== 'string' ||
        typeof node.type !== 'string' ||
        typeof node.position !== 'object' ||
        node.position === null
      ) {
        throw new Error(`SceneExporter.fromJSON: malformed node at index ${i}`);
      }
      const pos = node.position as Record<string, unknown>;
      return {
        id: node.id,
        type: node.type,
        position: {
          x: Number(pos.x ?? 0),
          y: Number(pos.y ?? 0),
          z: Number(pos.z ?? 0),
        },
        config: (typeof node.config === 'object' && node.config !== null
          ? node.config
          : {}) as Record<string, unknown>,
      };
    });

    const edges: SceneEdge[] = raw.edges.map((e, i) => {
      const edge = e as Record<string, unknown>;
      if (
        typeof edge.from !== 'string' ||
        typeof edge.to !== 'string' ||
        typeof edge.label !== 'string'
      ) {
        throw new Error(`SceneExporter.fromJSON: malformed edge at index ${i}`);
      }
      return { from: edge.from, to: edge.to, label: edge.label };
    });

    return { nodes, edges };
  }

  /**
   * Export scene as a Mermaid flowchart string.
   * Node IDs are sanitized (Mermaid doesn't allow underscores in bare IDs).
   * Edges use labeled arrows: A -->|label| B
   *
   * Example output:
   *   flowchart LR
   *     agent_abc123["agent\nagent_abc123"]
   *     vault_def456["vault\nvault_def456"]
   *     agent_abc123 -->|calls| vault_def456
   */
  toMermaid(scene: Scene): string {
    const sanitize = (id: string) => id.replace(/[^a-zA-Z0-9]/g, '_');

    const lines: string[] = ['flowchart LR'];

    // Node declarations
    for (const node of scene.nodes) {
      const safeId = sanitize(node.id);
      const label = `${node.type}\\n${node.id}`;
      lines.push(`  ${safeId}["${label}"]`);
    }

    // Edge declarations
    for (const edge of scene.edges) {
      const from = sanitize(edge.from);
      const to = sanitize(edge.to);
      lines.push(`  ${from} -->|${edge.label}| ${to}`);
    }

    return lines.join('\n');
  }
}