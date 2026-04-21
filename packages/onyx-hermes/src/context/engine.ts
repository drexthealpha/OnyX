/**
 * Context assembly engine for skill execution.
 * Combines: system prompt, memory context, skill definition, user input.
 */

import { compress } from './compressor';
import { ReferenceTracker } from './references';

export interface ContextConfig {
  systemPrompt?: string;
  skillDefinition?: string;
  memoryContext?: string;
  maxTokens?: number;
}

export interface AssembledContext {
  prompt: string;
  estimatedTokens: number;
  wasCompressed: boolean;
}

export class ContextEngine {
  private readonly defaultMaxTokens: number;
  private readonly references: ReferenceTracker;

  constructor(maxTokens = 8192) {
    this.defaultMaxTokens = maxTokens;
    this.references = new ReferenceTracker();
  }

  /**
   * Assemble context for a skill execution.
   * Compresses if combined context exceeds maxTokens.
   */
  assemble(userInput: string, config: ContextConfig = {}): AssembledContext {
    const maxTokens = config.maxTokens ?? this.defaultMaxTokens;

    const parts: string[] = [];

    if (config.systemPrompt) {
      parts.push(`## System\n${config.systemPrompt}`);
    }

    if (config.skillDefinition) {
      parts.push(`## Skill Definition\n${config.skillDefinition}`);
    }

    if (config.memoryContext) {
      parts.push(`## Memory Context\n${config.memoryContext}`);
    }

    parts.push(`## User Input\n${userInput}`);

    let combined = parts.join('\n\n---\n\n');
    const estimatedRaw = Math.ceil(combined.length / 4);

    let wasCompressed = false;
    if (estimatedRaw > maxTokens) {
      combined = compress(combined, maxTokens);
      wasCompressed = true;
    }

    this.references.track(userInput);

    return {
      prompt: combined,
      estimatedTokens: Math.ceil(combined.length / 4),
      wasCompressed,
    };
  }

  /** Clear reference history. */
  resetReferences(): void {
    this.references.clear();
  }
}