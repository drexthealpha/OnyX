/**
 * Memory retrieval provider for skills.
 * Provides relevant memory context given a skill name and input query.
 * Currently backed by SkillMemoryManager SQLite store.
 * Designed to be swappable for vector-search in onyx-semantic.
 */

import { SkillMemoryManager, SkillPerformance } from './manager';

export interface MemoryContext {
  performanceSummary: string;
  avgScore: number | null;
  sampleCount: number;
}

export class MemoryProvider {
  private readonly manager: SkillMemoryManager;

  constructor(manager?: SkillMemoryManager) {
    this.manager = manager ?? new SkillMemoryManager();
  }

  /**
   * Retrieve memory context for a skill.
   * Returns a text block suitable for injection into system prompt.
   */
  retrieve(skillName: string): MemoryContext {
    const perf = this.manager.getPerformance(skillName);

    if (!perf) {
      return {
        performanceSummary: `No performance history for skill: ${skillName}`,
        avgScore: null,
        sampleCount: 0,
      };
    }

    const summary = this.buildSummary(perf);
    return {
      performanceSummary: summary,
      avgScore: perf.avgScore,
      sampleCount: perf.sampleCount,
    };
  }

  private buildSummary(perf: SkillPerformance): string {
    const level =
      perf.avgScore >= 0.8 ? 'high' :
      perf.avgScore >= 0.6 ? 'moderate' :
      'low';

    return [
      `Skill: ${perf.skillName}`,
      `Performance: ${level} (avg score: ${perf.avgScore.toFixed(2)} over ${perf.sampleCount} samples)`,
      `Last score: ${perf.lastScore.toFixed(2)}`,
      perf.avgScore < 0.6
        ? 'Note: This skill has been underperforming — a prompt improvement may be active.'
        : '',
    ]
      .filter(Boolean)
      .join('\n');
  }

  /** Record a score after skill execution. */
  record(skillName: string, score: number): void {
    this.manager.record(skillName, score);
  }
}