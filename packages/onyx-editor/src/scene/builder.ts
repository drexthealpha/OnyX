import { v4 as uuidv4 } from 'uuid';
import type { Scene, SceneNode, SceneEdge } from '../types';

/**
 * SceneBuilder — programmatically constructs a 3D scene graph.
 * Inspired by pascalorg/editor's flat-dictionary node storage pattern.
 * All data is plain JSON-serializable; no Three.js objects here.
 */
export class SceneBuilder {
  private nodes: Map<string, SceneNode> = new Map();
  private edges: SceneEdge[] = [];

  /**
   * Add a node to the scene.
   * @param type   Node type string (e.g. 'agent', 'vault', 'compute', 'wall', 'zone')
   * @param position  3D world position
   * @param config    Arbitrary JSON config for this node
   * @returns nodeId — stable ID for use in addEdge
   */
  addNode(
    type: string,
    position: { x: number; y: number; z: number },
    config: Record<string, unknown>
  ): string {
    const id = `${type}_${uuidv4().replace(/-/g, '').slice(0, 8)}`;
    const node: SceneNode = { id, type, position, config };
    this.nodes.set(id, node);
    return id;
  }

  /**
   * Add a directed edge between two nodes.
   * @param fromId  Source node ID (must exist)
   * @param toId    Target node ID (must exist)
   * @param label   Relationship label (e.g. 'calls', 'depends_on', 'routes_to')
   */
  addEdge(fromId: string, toId: string, label: string): void {
    if (!this.nodes.has(fromId)) {
      throw new Error(`SceneBuilder.addEdge: fromId "${fromId}" not found`);
    }
    if (!this.nodes.has(toId)) {
      throw new Error(`SceneBuilder.addEdge: toId "${toId}" not found`);
    }
    this.edges.push({ from: fromId, to: toId, label });
  }

  /**
   * Build and return the immutable Scene snapshot.
   * Scene is fully JSON-serializable (no class instances).
   */
  build(): Scene {
    return {
      nodes: Array.from(this.nodes.values()).map((n) => ({
        id: n.id,
        type: n.type,
        position: { ...n.position },
        config: { ...n.config },
      })),
      edges: this.edges.map((e) => ({ ...e })),
    };
  }

  /** Reset the builder for reuse */
  reset(): void {
    this.nodes.clear();
    this.edges = [];
  }
}