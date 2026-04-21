/**
 * Smart router — selects the best skill variant for a given input.
 * Uses GEPA metadata (scores) to pick the top-performing variant.
 * Falls back to the canonical skill if no variants exist.
 */

import { SkillMetadataStore } from './metadata';

export interface RouteDecision {
  skillName: string;
  variantId: string | null;
  reason: string;
  score: number;
}

export class SmartRouter {
  private readonly metadata: SkillMetadataStore;

  constructor(metadata?: SkillMetadataStore) {
    this.metadata = metadata ?? new SkillMetadataStore();
  }

  /**
   * Route a request to the best skill variant.
   * Prefers highest-scoring variant; falls back to canonical if all equal.
   */
  route(skillName: string): RouteDecision {
    const variants = this.metadata.getVariants(skillName);

    if (variants.length === 0) {
      return {
        skillName,
        variantId: null,
        reason: 'no variants — using canonical skill',
        score: 0,
      };
    }

    // Pick highest-scoring variant
    const best = variants.reduce((a, b) => (a.score >= b.score ? a : b));

    if (best.score === 0) {
      return {
        skillName,
        variantId: null,
        reason: 'all variants unscored — using canonical skill',
        score: 0,
      };
    }

    return {
      skillName,
      variantId: best.variantId,
      reason: `variant selected (score: ${best.score.toFixed(3)}, generation: ${best.generation})`,
      score: best.score,
    };
  }

  /** Route multiple skills at once. */
  routeBatch(skillNames: string[]): RouteDecision[] {
    return skillNames.map((name) => this.route(name));
  }
}