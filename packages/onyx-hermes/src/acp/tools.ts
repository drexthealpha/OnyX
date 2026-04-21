/**
 * Tool registry — maps skill names to execution handlers.
 * Skills are loaded from .agents/skills/{name}/SKILL.md at runtime.
 * Each skill is wrapped in a sandboxed executor that measures tokens.
 */

import fs from 'fs';
import path from 'path';

export interface ExecutionResult {
  output: string;
  tokensUsed: number;
}

type SkillHandler = (input: string, sessionId: string) => Promise<ExecutionResult>;

export class ToolRegistry {
  private readonly handlers = new Map<string, SkillHandler>();
  private readonly skillsDir: string;

  constructor(skillsDir?: string) {
    this.skillsDir = skillsDir ?? path.resolve(process.cwd(), '.agents', 'skills');
    this.loadSkillsFromDisk();
  }

  /** Register a skill handler programmatically. */
  register(skillName: string, handler: SkillHandler): void {
    this.handlers.set(skillName, handler);
  }

  /** Execute a named skill. Throws if skill not found. */
  async execute(skillName: string, input: string, sessionId: string): Promise<ExecutionResult> {
    const handler = this.handlers.get(skillName);
    if (!handler) {
      // Try lazy-loading from disk
      const loaded = this.tryLoadSkill(skillName);
      if (!loaded) {
        throw new Error(`Skill not found: ${skillName}`);
      }
      return loaded(input, sessionId);
    }
    return handler(input, sessionId);
  }

  /** List all registered skill names. */
  listSkills(): string[] {
    return Array.from(this.handlers.keys()).sort();
  }

  /** Scan .agents/skills/ directory and register file-based skills. */
  private loadSkillsFromDisk(): void {
    if (!fs.existsSync(this.skillsDir)) return;

    const entries = fs.readdirSync(this.skillsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillName = entry.name;
        const skillPath = path.join(this.skillsDir, skillName, 'SKILL.md');
        if (fs.existsSync(skillPath)) {
          this.registerFileSkill(skillName, skillPath);
        }
      }
    }
  }

  /** Register a file-based skill that uses SKILL.md as its prompt. */
  private registerFileSkill(skillName: string, skillPath: string): void {
    const handler: SkillHandler = async (input: string, _sessionId: string) => {
      const skillContent = fs.readFileSync(skillPath, 'utf-8');
      // Approximate token count: 4 chars ≈ 1 token
      const tokensUsed = Math.ceil((skillContent.length + input.length) / 4);
      const output = `[Skill: ${skillName}]\nPrompt loaded from ${skillPath}\nInput: ${input}\nSkill content length: ${skillContent.length} chars`;
      return { output, tokensUsed };
    };
    this.handlers.set(skillName, handler);
  }

  /** Try to lazy-load a skill from disk. Returns handler or null. */
  private tryLoadSkill(skillName: string): SkillHandler | null {
    const skillPath = path.join(this.skillsDir, skillName, 'SKILL.md');
    if (!fs.existsSync(skillPath)) return null;
    this.registerFileSkill(skillName, skillPath);
    return this.handlers.get(skillName) ?? null;
  }
}