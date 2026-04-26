import Anthropic from '@anthropic-ai/sdk';
import { SceneBuilder } from './scene/builder';
import { SceneExporter } from './scene/exporter';
import type { Scene } from './types';

/**
 * AgentSceneAPI — Claude-powered scene manipulation for ONYX agents.
 *
 * Agents describe nodes in natural language; Claude generates the
 * 3D position and config. This is the bridge between the @onyx/agent
 * layer and the spatial editor.
 *
 * API key: user-provided via ANTHROPIC_API_KEY env var. Zero operator cost.
 */
export class AgentSceneAPI {
  private builder: SceneBuilder;
  private exporter: SceneExporter;
  private anthropic: Anthropic;

  constructor(apiKey?: string) {
    this.builder = new SceneBuilder();
    this.exporter = new SceneExporter();
    this.anthropic = new Anthropic({
      apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY ?? '',
    });
  }

  /**
   * Add a node to the scene using a natural language description.
   * Claude generates position {x,y,z} and config JSON from the description.
   * @returns nodeId of the created node
   */
  async addNode(description: string): Promise<string> {
    const sceneContext = this.exporter.toJSON(this.builder.build());

    const prompt = `You are a 3D spatial layout engine for an AI operating system.
Given the current scene context below and a node description, generate a JSON object with:
- "type": a short lowercase identifier for the node type (e.g. "agent", "vault", "compute", "router")
- "position": { "x": number, "y": number, "z": number } — place nodes so they don't overlap; spread them out
- "config": a JSON object with any relevant metadata

Current scene (JSON):
${sceneContext}

Node description: "${description}"

Return ONLY a valid JSON object. No markdown, no explanation, no backticks.
Example: {"type":"agent","position":{"x":2,"y":0,"z":-1},"config":{"label":"Research Agent","priority":"high"}}`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('');

    let parsed: {
      type?: string;
      position?: { x: number; y: number; z: number };
      config?: Record<string, unknown>;
    };

    try {
      // Strip any accidental markdown code fences
      const clean = text.replace(/```[a-z]*\n?/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      // Fallback: extract JSON object from response text
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        throw new Error(
          `AgentSceneAPI.addNode: Claude did not return valid JSON. Response: ${text}`
        );
      }
      parsed = JSON.parse(match[0]);
    }

    const type = parsed.type ?? 'unknown';
    const position = parsed.position ?? { x: 0, y: 0, z: 0 };
    const config = parsed.config ?? { description };

    // Validate position fields
    if (
      typeof position.x !== 'number' ||
      typeof position.y !== 'number' ||
      typeof position.z !== 'number'
    ) {
      throw new Error(
        `AgentSceneAPI.addNode: invalid position from Claude: ${JSON.stringify(position)}`
      );
    }

    return this.builder.addNode(type, position, config);
  }

  /**
   * Connect two nodes with a labeled relationship edge.
   */
  connectNodes(aId: string, bId: string, relationship: string): void {
    this.builder.addEdge(aId, bId, relationship);
  }

  /**
   * Export current scene as a Mermaid flowchart string.
   */
  exportMermaid(): string {
    return this.exporter.toMermaid(this.builder.build());
  }

  /**
   * Get the current Scene snapshot.
   */
  getScene(): Scene {
    return this.builder.build();
  }

  /**
   * Reset the agent's scene (start fresh).
   */
  reset(): void {
    this.builder.reset();
  }
}