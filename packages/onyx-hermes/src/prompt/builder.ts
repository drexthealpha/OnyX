/**
 * Prompt assembly — constructs final prompts for skill execution.
 * Combines system prompt + memory + skill definition + user input.
 */

export interface PromptParts {
  system?: string;
  memory?: string;
  skillDefinition?: string;
  userInput: string;
  maxTokens?: number;
}

export interface BuiltPrompt {
  systemPrompt: string;
  userPrompt: string;
  estimatedTokens: number;
}

export class PromptBuilder {
  private readonly charsPerToken = 4;

  build(parts: PromptParts): BuiltPrompt {
    const systemParts: string[] = [];

    if (parts.system) {
      systemParts.push(parts.system);
    }

    if (parts.memory) {
      systemParts.push(`<memory>\n${parts.memory}\n</memory>`);
    }

    if (parts.skillDefinition) {
      systemParts.push(`<skill>\n${parts.skillDefinition}\n</skill>`);
    }

    const systemPrompt = systemParts.join('\n\n');
    const userPrompt = parts.userInput;

    const estimatedTokens = Math.ceil(
      (systemPrompt.length + userPrompt.length) / this.charsPerToken
    );

    return { systemPrompt, userPrompt, estimatedTokens };
  }

  /** Build a prompt that instructs the model to improve a skill. */
  buildImprovementPrompt(skillName: string, currentPrompt: string, score: number): BuiltPrompt {
    const systemPrompt = [
      'You are an expert prompt engineer for AI skill systems.',
      'Your task is to improve skill prompts that are underperforming.',
      'Analyse the given prompt and rewrite it to be more effective.',
      'Output ONLY the improved prompt — no preamble, no explanation.',
    ].join('\n');

    const userPrompt = [
      `Skill: ${skillName}`,
      `Current score: ${score.toFixed(2)} (threshold: 0.6)`,
      '',
      '--- CURRENT PROMPT ---',
      currentPrompt,
      '',
      'Rewrite this prompt to improve its performance score above 0.6.',
    ].join('\n');

    const estimatedTokens = Math.ceil(
      (systemPrompt.length + userPrompt.length) / this.charsPerToken
    );

    return { systemPrompt, userPrompt, estimatedTokens };
  }
}